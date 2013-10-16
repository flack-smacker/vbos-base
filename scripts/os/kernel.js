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

   // Process related queues.
   _KernelReadyQueue = new Queue();
   _KernelPCBList = new Array();

   _Console = new CLIconsole();          // The command line interface / console I/O device.

   // Initialize the CLIconsole.
   _Console.init();

   // Initialize standard input and output to the _Console.
   _StdIn  = _Console;
   _StdOut = _Console;

   // Load the Keyboard Device Driver
   krnTrace("Loading the keyboard device driver.");
   krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.  TODO: Should that have a _global-style name?
   krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
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

   // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
   krnTrace("Enabling the interrupts.");
   krnEnableInterrupts();

   // Launch the shell.
   krnTrace("Creating and Launching the shell.");
   _OsShell = new Shell();
   _OsShell.init();

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
	
    // Check for an interrupt, are any. Page 560
    if (_KernelInterruptQueue.getSize() > 0)    
    {
        // Process the first interrupt on the interrupt queue.
        // TODO: Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
        var interrupt = _KernelInterruptQueue.dequeue();
        krnInterruptHandler(interrupt.irq, interrupt.params);
    }
    else if (_CPU.isExecuting) // If there are no interrupts then run one CPU cycle if there is anything being processed.
    {
        _CPU.cycle();
    }
    else if (_KernelReadyQueue.getSize() > 0) // If there is no work to execute then check the ready queue for more work.
    {
        var toDispatch = _KernelReadyQueue.dequeue();
        krnDispatchProcess(toDispatch);
    }
    else  // If there are no interrupts and there is nothing being executed then just be idle.
    {
       krnTrace("Idle");
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
            krnTimerISR();                   // Kernel built-in routine for timers (not the clock).
            break;
        case KEYBOARD_IRQ: 
            krnKeyboardDriver.isr(params);   // Kernel mode device driver
            _StdIn.handleInput();
            break;
        case SYSTEM_CALL_IRQ:
            krnSystemCallIsr(params);
            break;
        case PROCESS_COMPLETE_IRQ:
            krnTerminateProcess(_KernelPCBList[_ActiveProcess]);
            break;
        default:
            krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
    }
}

function krnTimerISR()  // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver).
{
    // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
}   

function krnSystemCallIsr(params) {
    if (params[0] == 1)
    {
        _StdOut.putText(params[1].toString());
    }
    else if (params[0] == 2)
    {
        var start = params[1];
        var offset = 0;
        var charCode = null;

        do {
            var charCode = parseInt(_MemoryManager.read(0, start + offset, 0), 16);
            _StdOut.putText(String.fromCharCode(charCode));
            offset += 1;
        } while (charCode != 0);

    }
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
	_StdOut.putText("TO AVOID ADDITIONAL LOSS OF DATA.")
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
 * Creates a new process and adds it to the PCB list.
 *
 * @returns {ProcCtrlBlk.PID|*}
 */
function krnNewProcess() {

    // Create the PCB
    var newPCB = new ProcCtrlBlk();
    // Assign it a PID
    newPCB.PID = generatePID();
    // Add the PCB to the kernels PCB list.
    _KernelPCBList[newPCB.PID] = newPCB;
    // Allocate memory for the process.
    newPCB.BASE_ADDRESS = _MemoryManager.allocate(newPCB.PID);
    newPCB.LIMIT = newPCB.BASE_ADDRESS + 255;
    // Return the PID to the caller.
    return newPCB.PID;
}

function krnDispatchProcess(process) {
    // Set the program counter to the address of the first instruction.
    _CPU.PC = process.BASE_ADDRESS;
    // Inform the kernel that there is work to be done.
    _CPU.isExecuting = true;
    // Update the process state.
    process.State = ProcessState.RUNNING;
    // Update the currently active process.
    _ActiveProcess = process.PID;
    // Update the PCB display
    updatePCBDisplay();

}

function krnTerminateProcess(process) {
    process.State = ProcessState.TERMINATED;
    // Update the PCB display
    updatePCBDisplay();
    // Reset the CPU registers.
    _CPU.init();
    // Free the memory allocated to this process.
    _MemoryManager.deallocate(process.PID);
    // Delete the PCB associated with this process.
    delete _KernelPCBList[process.PID];
    // Reset the PID of the active process.
    _ActiveProcess = -1;
    // Refresh Main Memory
    refreshDisplay();
    _StdOut.advanceLine();
    _StdOut.putText(">");

}
/**
 * Generates an integer PID within the range of 0 to MAX_PROCESSES
 *
 * @returns {*}
 */
function generatePID() {
    var candidate;

    do { // loop until an unused PID is generated
        candidate = Math.floor(Math.random()*100) % MAX_PROCESSES;
    } while (typeof _KernelPCBList[candidate] != 'undefined');

    return candidate;
}

function updatePCBDisplay() {
    var pcb = _KernelPCBList[_ActiveProcess];
    var pcbState = "PID: " + pcb.PID + "\n" +
        "STATE: " + pcb.State + "\n" +
        "BASE ADDRESS: " + pcb.BASE_ADDRESS + "\n" +
        "LIMIT: " + pcb.LIMIT + "\n" +
        "PC: " + _CPU.PC + "\n" +
        "ACC: " + _CPU.Acc + "\n" +
        "X: " + _CPU.Xreg + "\n" +
        "Y: " + _CPU.Yreg + "\n" +
        "ZFLAG: " + _CPU.Zflag;

    var taPCBDisplay = document.getElementById("taPCBDisplay");
    taPCBDisplay.value = pcbState;
}