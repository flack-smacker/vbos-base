/* ------------
   Kernel.js
   
   Requires globals.js
   
   Routines for the Operating System, NOT the host.
   
   This code references page numbers in the text book: 
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */


//
// OS Startup and Shutdown Routines   
//
function krnBootstrap()      // Page 8.
{
   hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.

    // Load and initialize the Memory Management Module
    _MemoryManager = new MMU(_MainMemory);
    _MemoryManager.init();

   // Initialize our global queues.
   _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
   _KernelBuffers = new Array();         // Buffers... for the kernel.
   _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.

   // Process related data structures.
   _KernelReadyQueue = new Queue();
   _KernelResidentList = {};

   _Console = new CLIconsole();     // The command line interface / console I/O device.
   _Console.init();                 // Initialize the CLIconsole.

   // Initialize standard input and output to the _Console.
   _StdIn  = _Console;
   _StdOut = _Console;

   // Load the Keyboard Device Driver
    //TODO: Should that have a _global-style name?
   krnTrace("Loading the keyboard device driver.");
   krnKeyboardDriver = new DeviceDriverKeyboard();
   krnKeyboardDriver.driverEntry();
   krnTrace(krnKeyboardDriver.status);

   // Load the status bar display.
   krnTrace("Loading the status bar device driver.");
   krnStatusBarDriver = new DeviceDriverStatusBar();
   krnStatusBarDriver.driverEntry();
   krnTrace(krnStatusBarDriver.status);

   // Load the device driver for the memory display.
   krnTrace("Loading the memory display device driver.");
   krnMemDispDriver = new DeviceDriverMemoryDisplay();
   krnMemDispDriver.driverEntry();
   krnTrace(krnMemDispDriver.status);
   
   // Load the device driver for the HDD.
   krnTrace("Loading the HDD device driver.");
   krnHddDriver = new DeviceDriverHDD();
   krnHddDriver.driverEntry();
   krnTrace(krnHddDriver.status);
   
   // Load and initialize the file system.
	_FileSystem = new FileSystem();

   // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
   krnTrace("Enabling the interrupts.");
   krnEnableInterrupts();

   // Initialize the CPU scheduler with a default quantum of 6;
   _Scheduler = new RoundRobinScheduler(_Quantum);
   
   // Launch the shell.
   krnTrace("Creating and Launching the shell.");
   _OsShell = new Shell();
   _OsShell.init();
   
   // Don't leave the kernel in GOD MODE!
   _Mode = USER_MODE;
   
   // Finally, initiate testing.
   if (_GLaDOS) {
      _GLaDOS.afterStartup();
   }
}

function krnShutdown()
{
    krnTrace("begin shutdown OS");
    // TODO: Check for running processes.  Alert if there are some, alert and stop.  Else...    
    // ... Disable the Interrupts.
    krnTrace("Disabling the interrupts.");
    krnDisableInterrupts();
    // 
    // Unload the Device Drivers?
    // More?
    //
    krnTrace("end shutdown OS");
}


function krnOnCPUClockPulse() 
{
    /* This gets called from the host hardware sim every time there is a hardware clock pulse.
       This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
       This, on the other hand, is the clock pulse from the hardware (or host) that tells the kernel 
       that it has to look for interrupts and process them if it finds any.                           */
	
    if (_KernelInterruptQueue.getSize() > 0) { // Check for an interrupt, are any. Page 560
        // Process the first interrupt on the interrupt queue.
        // TODO: Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
        var interrupt = _KernelInterruptQueue.dequeue();
        krnInterruptHandler(interrupt.irq, interrupt.params);
    } else { // Delegate CPU-related tasks to the scheduler.
		_Scheduler.doExecute();
	}
}


// 
// Interrupt Handling
// 
function krnEnableInterrupts()
{
    // Keyboard
    hostEnableKeyboardInterrupt();
    // Put more here.
}

function krnDisableInterrupts()
{
    // Keyboard
    hostDisableKeyboardInterrupt();
    // Put more here.
}

function krnInterruptHandler(irq, params)    // This is the Interrupt Handler Routine.  Pages 8 and 560.
{
    // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on.  Page 766.
    krnTrace("Handling IRQ~" + irq);

    // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
    // TODO: Consider using an Interrupt Vector in the future.
    // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.  
    //       Maybe the hardware simulation will grow to support/require that in the future.
    switch (irq)
    {
        case TIMER_IRQ: 
            krnTimerISR();	// Kernel built-in routine for timers (not the clock).
            break;
        case KEYBOARD_IRQ: 
            krnKeyboardDriver.isr(params);	// Kernel mode device driver
            _StdIn.handleInput();
            break;
        case SYSTEM_CALL_IRQ:	// CPU requested a system service.
            krnSystemCallIsr(params);
            break;
        case PROCESS_COMPLETE_IRQ: // A process requested termination.
            krnTerminateProcess(_ActiveProcess);
            break;
		case MEMORY_ERROR_IRQ: // A memory related error occurred.
			krnMemoryErrorIsr(params);
			break;
		case CONTEXT_SWITCH_IRQ:
			krnCPUContextSwitch(params); // The scheduler requested a context-switch.
			break;
        default:
            krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
    }
}

function krnTimerISR()  // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver).
{
    // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
}

/**
* This method is responsbile for performing a CPU context switch. 
* It is invoked from the kernel interrupt handler routine when the appropriate
* interrupt code is generated by the CPU scheduler.
*/
function krnCPUContextSwitch(params) {
	// Determine which process is being switched out.
	var toSavePID = params[0];
	// Grab the PCB of the outgoing process.
	var toSavePCB = _KernelResidentList[toSavePID];
	// Modify the status field appropriately.
	toSavePCB.State = ProcessState.READY;
	// Save the state of the CPU to the PCB.
	toSavePCB.PC = _CPU.PC;
    toSavePCB.Acc = _CPU.Acc;
    toSavePCB.Xreg = _CPU.Xreg;
    toSavePCB.Yreg = _CPU.Yreg;
    toSavePCB.Zflag = _CPU.Zflag;
	// Place the switched out process to the back of the ready queue.
	// Log scheduling events...
	krnTrace("Switching out process with PID " + toSavePID + " and placing it to the back of the ready queue.");
	_KernelReadyQueue.enqueue(toSavePID);
}

function krnMemoryErrorIsr(params) {
	
	var errorType = params[0];
	
	switch (errorType)
    {
        case ACCESS_VIOLATION_ERROR: 
            _StdOut.putText("Process with PID " + params[1] + " attempted to access a memory location outside its address space.");
			_StdOut.putText("Terminating process " + params[1]);
			_StdOut.advanceLine();
			_OsShell.putPrompt();
            break;
        case OUT_OF_MEMORY_ERROR: 
			_StdOut.putText("Load command failed. Insufficient memory.");
			_StdOut.advanceLine();
			_OsShell.putPrompt();
            break;
		default:
			// do nothing
	}
}

/**
 * The routine that is called when an executing program requests a system call. The type of system call is
 * specified by the first parameter in the params array.
 *
 * @param params contains the parameters required by the specified system call
 */
function krnSystemCallIsr(params) {
    if (params[0] == 1) {
        displayInteger(params[1]);
    } else if (params[0] == 2) {
        displayString(params[1]);
    }
}

/**
 * Prints the specified integer to standard output.
 *
 * @param toPrint an integer
 */
function displayInteger(toPrint) {
    _StdOut.putText(toPrint.toString());
}

/**
 * Prints the null-terminated string starting at the specified address to standard output.
 *
 * @param startAddress the address of the first character in the string
 */
function displayString(startAddress) {

    var offset = 0; // The current offset into the string.
    var charCode = null; // The current ASCII character located at (startAddress + offset).

    do { // Loop until the null-terminator is encountered.
        // Retrieve the next character from memory.
        charCode = parseInt(_MemoryManager.read(startAddress, offset), 16);
        _StdOut.putText(String.fromCharCode(charCode)); // Print the character to standard output.
        offset += 1; // Point to the next character in the string.
    } while (charCode != 0);
}

//
// System Calls... that generate software interrupts via tha Application Programming Interface library routines.
//
// Some ideas:
// - ReadConsole
// - WriteConsole
// - CreateProcess
// - ExitProcess
// - WaitForProcessToExit
// - CreateFile
// - OpenFile
// - ReadFile
// - WriteFile
// - CloseFile


//
// OS Utility Routines
//
function krnTrace(msg)
{
   // Check globals to see if trace is set ON.  If so, then (maybe) log the message. 
   if (_Trace)
   {
      if (msg === "Idle")
      {
         // We can't log every idle clock pulse because it would lag the browser very quickly.
         if (_OSclock % 10 == 0)  // Check the CPU_CLOCK_INTERVAL in globals.js for an 
         {                        // idea of the tick rate and adjust this line accordingly.
            hostLog(msg, "OS");
         }         
      }
      else
      {
       hostLog(msg, "OS");
      }
   }
}
   
function krnTrapError(msg) 
{
    hostLog("OS ERROR - TRAP: " + msg);
	// Display the error screen.
	displayBSOD();
	// Shutdown the kernel.
	krnShutdown();
}

function displayBSOD() {
	
	_Console.clearScreen();
	_Console.resetXY();
	
	_Canvas.style.backgroundColor = "blue";
	_DrawingContext.strokeStyle = "white";
	
	_StdOut.putText("UNRECOVERABLE ERROR ENCOUNTERED.");
	_StdOut.advanceLine();
	_StdOut.putText("  %ERROR CODE: A0DEAF00 0BABE000");
    _StdOut.advanceLine();
	_StdOut.putText("TO AVOID ADDITIONAL LOSS OF DATA.");
    _StdOut.advanceLine();
	_StdOut.putText("PLEASE CONTACT OUR SUPPORT DEPARTMENT.");
    _StdOut.advanceLine();
	_StdOut.putText("PLEASE HAVE YOUR SUPPORT ID READY.");
    _StdOut.advanceLine();
	_StdOut.putText("FOR USERS WITHOUT A SUPPORT ID PLEASE GO TO ");
    _StdOut.advanceLine();
	_StdOut.putText("WWW.GOOGLE.COM UPON REBOOT.");
    _StdOut.advanceLine();
	_StdOut.putText("HOLD THE POWER BUTTON TO PERFORM A HARD RESET.");
    _StdOut.advanceLine();

}
/**
 * Creates a new process for the specified source program and adds it to the resident list.
 * When this method returns a new process will have been created and the source code
 * specified by src will have been loaded into memory.
 
 * @returns {ProcCtrlBlk.PID|*}
 */
function krnNewProcess(src) {
    
	// First try to allocate memory for the process...
    var newPID = _nextPID++; // ...which requires a PID.
	var baseAddr = _MemoryManager.allocate(newPID);
	
	// Check if the allocation was successful or not.
	if (baseAddr === OUT_OF_MEMORY_ERROR) { // Fail...
		// Generate an out-of-memory interrupt.
		_KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ERROR_IRQ, [OUT_OF_MEMORY_ERROR]));
		// Reset the PID.
		newPID--;
		// Inform the shell that the load command failed.
		return OUT_OF_MEMORY_ERROR;
	}
	
	// The allocation was successful so create the PCB
    var newPCB = new ProcCtrlBlk();
	
	// Assign the base and limit addresses and the PID.
    newPCB.BASE_ADDRESS = baseAddr;
    newPCB.LIMIT = newPCB.BASE_ADDRESS + (ADDRESS_SPACE_MAX - 1);
	newPCB.PID = newPID;
    
    // Add the PCB to the kernels PCB list.
    _KernelResidentList[newPCB.PID] = newPCB;
	
	// Go ahead and load the source code into main memory...
	_Mode = KERNEL_MODE;
        for (var offset = 0; offset < src.length; offset++) {
            _MemoryManager.write(offset + baseAddr, src[offset].trim());
        }
    _Mode = USER_MODE;
	
    // Return the PID to the caller.
    return newPID;
}

/**
* Queues the process specified by PID for execution. This method is
* responsible for transferring the process to the ready queue where it 
* will await executing by the CPU scheduler.
*/
function krnScheduleProcess(pid) {
	_KernelReadyQueue.enqueue(pid);
}

function krnTerminateProcess(process) {
	
    updatePCBDisplay(); // Write the contents of the PCB to the PCB display.
	process.State = ProcessState.TERMINATED; // Update the process state.
    
	_MemoryManager.deallocate(process.PID); // Free the memory allocated to this process.
	refreshDisplay(); // Refresh Main Memory
    
	// Delete the PCB associated with this process.
    delete _KernelResidentList[process.PID];
	_nextPID -= 1;
    _ActiveProcess = null;
    
	// Reset the CPU.
    _CPU.init();
	_CPU.isExecuting = false;
    
	// Reset the console display.
	_StdOut.advanceLine();
    _StdOut.putText(">");
}

function updatePCBDisplay() {

    var pcbState = "PID: " + _ActiveProcess.PID + "\n" +
        "STATE: " + _ActiveProcess.State + "\n" +
        "BASE ADDRESS: " + _ActiveProcess.BASE_ADDRESS + "\n" +
        "LIMIT: " + _ActiveProcess.LIMIT + "\n" +
        "PC: " + _CPU.PC + "\n" +
        "ACC: " + _CPU.Acc + "\n" +
        "X: " + _CPU.Xreg + "\n" +
        "Y: " + _CPU.Yreg + "\n" +
        "ZFLAG: " + _CPU.Zflag;

    var taPCBDisplay = document.getElementById("taPCBDisplay");
    taPCBDisplay.value = pcbState;
}


/**
 * Performs the specified I/O operation. This function delegates the work to the appropriate kernel function.
 * Its primary purpose is performing checks on the input that are common to every I/O operation. This prevents
 * unnecessary code duplication and provides a single entry point for all I/O operations. The shell calls this 
 * function and passes in the appropriate operation constant.
 */
function krnPerformIO(operation, filename, data) {
	
	// First, check if the file system has been formatted.
	if (!_FileSystem.isFormatted) {
		_StdOut.putText('I/O operation failed. The file system has not been formatted.');
		_StdOut.putText('Use the \'format\' command or type help for more information.');
		return;
	}
	
	// Next, make sure the filename is valid.
	if(!isValid(filename)) {
		_StdOut.putText('I/O operation failed. Invalid filename.');
		_StdOut.putText('Filename can be up to 60 characters in length and cannot contain the following characters: \/*?:;+[]{}<>()\'\"');
		return;
	}
	
	// All file names are upper case.
	filename = filename.toUpperCase();
	
	// Perform the requested I/O operation.
	switch (operation) {
		
		case IO_CREATE_FILE:
			krnCreateFile(filename);
			break;
		case IO_READ_FILE:
			krnReadFile(filename);
			break;
		case IO_WRITE_FILE:
			krnWriteToFile(filename, data);
			break;
		case IO_DELETE_FILE:
			krnDeleteFile(filename);
			break;
		default:
	}
}

/**
 * Creates an entry in the file system for the specified filename. 
 * Generates an I/O error interrupt if the operation fails. Possible 
 * reasons for failure are an invalid filename, if the specified filename 
 * already exists, insufficient storage, or attempting to 
 * create a file on an unformatted file system.
 */
function krnCreateFile(filename) {
	_FileSystem.create(filename);
}

/**
 * Reads the specified file and sends its contents to standard output.
 * Generates an I/O error interrupt if the operation fails. Possible 
 * reasons for failure are an invalid filename, or attempting to read a 
 * file from an unformatted file system.
 */
function krnReadFile(filename) {
	var result = _FileSystem.read(filename);
	
	if (result) {
		_StdOut.putText(result);
	} else {
		_StdOut.putText("Could not read '" + filename + "'. The file does not exist.");
	}
}

/**
 * Writes the specified data to the specified file.
 * Generates an I/O error interrupt if the operation fails.
 * Possible reasons that would cause the write to fail are
 * insufficient storage, an invalid filename, or attempting
 * to write to an unformatted file system.
 */
function krnWriteToFile(filename, data) {
	
}

/**
 * Deletes the specified file from the file system. All data blocks used by the file are marked as free.
 * Generates an I/O error interrupt if the operation fails. Possible reasons for failure are an invalid
 * filename, or attempting to delete a file from an unformatted file system.
 */
function krnDeleteFile(filename) {
	_FileSystem.deleteFile(filename);
}

/**
 * Formats the file system by calling the HDD driver's format routine.
 */
function krnFormatFs() {
	_FileSystem.format();
}

/**
 * Indicates whether the specified filename is valid.
 */
function isValid(filename) {
	
	// A regex to check for illegal characters in the filename.
	var illegal = /[\\\/\*?:;+\[\]\{\}<>\(\)'"]+/;
	
	// A regex to check if the filename is of the proper length.
	var valid = /(\w|[!@#$%^&.]){1,60}/i;
	
	// Returns true if the filename contains no illegal characters and is of the proper length.
	return !illegal.test(filename) && valid.test(filename)
}