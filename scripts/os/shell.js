/* ------------
   Shell.js

   The OS Shell - The "command line interface" (CLI) for the console.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

function Shell() {
    // Properties
    this.promptStr   = ">";
    this.commandList = [];
    this.curses      = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
    this.apologies   = "[sorry]";
    // Methods
    this.init        = shellInit;
    this.putPrompt   = shellPutPrompt;
    this.handleInput = shellHandleInput;
    this.execute     = shellExecute;
}

function shellInit() {
    var sc = null;

    // Load the command list.

    // ver
    sc = new ShellCommand();
    sc.command = "ver";
    sc.description = "- Displays the current version data.";
    sc.function = shellVer;
    this.commandList[this.commandList.length] = sc;

    // help
    sc = new ShellCommand();
    sc.command = "help";
    sc.description = "- This is the help command. Seek help.";
    sc.function = shellHelp;
    this.commandList[this.commandList.length] = sc;

    // shutdown
    sc = new ShellCommand();
    sc.command = "shutdown";
    sc.description = "- Shuts down the virtual OS.";
    sc.function = shellShutdown;
    this.commandList[this.commandList.length] = sc;

    // cls
    sc = new ShellCommand();
    sc.command = "cls";
    sc.description = "- Clears the screen and resets the cursor position.";
    sc.function = shellCls;
    this.commandList[this.commandList.length] = sc;

    // man <topic>
    sc = new ShellCommand();
    sc.command = "man";
    sc.description = "<topic> - Displays the MANual page for <topic>.";
    sc.function = shellMan;
    this.commandList[this.commandList.length] = sc;

    // trace <on | off>
    sc = new ShellCommand();
    sc.command = "trace";
    sc.description = "<on | off> - Turns the OS trace on or off.";
    sc.function = shellTrace;
    this.commandList[this.commandList.length] = sc;

    // rot13 <string>
    sc = new ShellCommand();
    sc.command = "rot13";
    sc.description = "<string> - Does rot13 obfuscation on <string>.";
    sc.function = shellRot13;
    this.commandList[this.commandList.length] = sc;

    // prompt <string>
    sc = new ShellCommand();
    sc.command = "prompt";
    sc.description = "<string> - Sets the prompt.";
    sc.function = shellPrompt;
    this.commandList[this.commandList.length] = sc;

	// date - displays the current date and time
	sc = new ShellCommand();
	sc.command = "date";
	sc.description = "- Displays the current date and time";
	sc.function = shellTime;
	this.commandList[this.commandList.length] = sc;

	// whereami - displays the user's current location
	sc = new ShellCommand();
	sc.command = "whereami";
	sc.description = "- Displays the user's current location.";
	sc.function = shellUserLocation;
	this.commandList[this.commandList.length] = sc;

	// theme - allows the user to change the color of the console elements
	sc = new ShellCommand();
	sc.command = "theme";
	sc.description = "- Sets the console theme.";
	sc.function = shellChangeTheme;
	this.commandList[this.commandList.length] = sc;

	// load - Loads the source code from the input area into main memory.
	sc = new ShellCommand();
	sc.command = "load";
	sc.description = "- Loads a user program into main memory.";
	sc.function = loadProgram;
	this.commandList[this.commandList.length] = sc;

    // run - Executes the process with the specified PID.
    sc = new ShellCommand();
    sc.command = "run";
    sc.description = "- Executes a user program that exists in memory.";
    sc.function = executeProcess;
    this.commandList[this.commandList.length] = sc;
	
	// quantum - Sets the quantum value.
    sc = new ShellCommand();
    sc.command = "quantum";
    sc.description = "<int> - Sets the CPU burst time.";
    sc.function = shellSetQuantum;
    this.commandList[this.commandList.length] = sc;
	
	// ps - Displays the PIDs of all active process.
    sc = new ShellCommand();
    sc.command = "ps";
    sc.description = "- List the PIDs of all active processes.";
    sc.function = shellPs;
    this.commandList[this.commandList.length] = sc;
	
	// runall - Schedules all resident processes for execution.
    sc = new ShellCommand();
    sc.command = "runall";
    sc.description = "- Execute all resident processes.";
    sc.function = shellRunAll;
    this.commandList[this.commandList.length] = sc;

	// kill - Terminates an active process immediately.
    sc = new ShellCommand();
    sc.command = "kill";
    sc.description = "<pid> - Terminates the specified process.";
    sc.function = shellKillPs;
    this.commandList[this.commandList.length] = sc;
	
	// BSOD - provide a mechanism for testing the kernel error trap function
	sc = new ShellCommand();
	sc.command = "implode";
	sc.description = "- Causes a catastrophic unrecoverable error.";
	sc.function = shellImplode;
	this.commandList[this.commandList.length] = sc;
	
	// status - Allows the user to set the system status display.
	sc = new ShellCommand();
	sc.command = "status";
	sc.description = "<string> - Sets the status display to <string>.";
	sc.function = shellSetStatus;
	this.commandList[this.commandList.length] = sc;
	
	// create - Allows the user to create a file.
    sc = new ShellCommand();
    sc.command = "create";
    sc.description = "<filename> - Creates an empty file.";
    sc.function = createFile;
    this.commandList[this.commandList.length] = sc;
	
	// read - Allows the user to read a file from the file system.
    sc = new ShellCommand();
    sc.command = "read";
    sc.description = "<filename> - Reads the specified file.";
    sc.function = readFile;
    this.commandList[this.commandList.length] = sc;
	
	// write - Allows the user to write to an existing file.";
    sc = new ShellCommand();
    sc.command = "write";
    sc.description = "<filename> \"data\" - Writes data to an existing file.";
    sc.function = writeToFile;
    this.commandList[this.commandList.length] = sc;
	
	// delete - Allows the user to delete a file from the file system.
    sc = new ShellCommand();
    sc.command = "delete";
    sc.description = "<filename> - Deletes the specified file.";
    sc.function = deleteFile;
    this.commandList[this.commandList.length] = sc;
	
	// format - Allows the user to format the file system.
    sc = new ShellCommand();
    sc.command = "format";
    sc.description = "- Initializes the file system.";
    sc.function = formatFs;
    this.commandList[this.commandList.length] = sc;
	
	// ls - Lists all the files stored.
    sc = new ShellCommand();
    sc.command = "ls";
    sc.description = "- List all user files.";
    sc.function = listFiles;
    this.commandList[this.commandList.length] = sc;
    
    // Display the initial prompt.
    this.putPrompt();
}

function shellPutPrompt()
{
    _StdIn.putText(this.promptStr);
}

function shellHandleInput(buffer)
{
    krnTrace("Shell Command~" + buffer);
    //
    // Parse the input...
    //
    var userCommand = new UserCommand();
    userCommand = shellParseInput(buffer);
    // ... and assign the command and args to local variables.
    var cmd = userCommand.command;
    var args = userCommand.args;
    //
    // Determine the command and execute it.
    //
    // JavaScript may not support associative arrays in all browsers so we have to
    // iterate over the command list in attempt to find a match.  TODO: Is there a better way? Probably.
    var index = 0;
    var found = false;
    while (!found && index < this.commandList.length)
    {
        if (this.commandList[index].command === cmd)
        {
            found = true;
            var fn = this.commandList[index].function;
        }
        else
        {
            ++index;
        }
    }
    if (found)
    {
        this.execute(fn, args);
    }
    else
    {
        // It's not found, so check for curses and apologies before declaring the command invalid.
        if (this.curses.indexOf("[" + rot13(cmd) + "]") >= 0)      // Check for curses.
        {
            this.execute(shellCurse);
        }
        else if (this.apologies.indexOf("[" + cmd + "]") >= 0)      // Check for apologies.
        {
            this.execute(shellApology);
        }
        else    // It's just a bad command.
        {
            this.execute(shellInvalidCommand);
        }
    }
}

function shellParseInput(buffer)
{
    var retVal = new UserCommand();

    // 1. Remove leading and trailing spaces.
    buffer = trim(buffer);

    // 2. Lower-case it.
    buffer = buffer.toLowerCase();

    // 3. Separate on spaces so we can determine the command and command-line args, if any.
    var tempList = buffer.split(" ");

    // 4. Take the first (zeroth) element and use that as the command.
    var cmd = tempList.shift();  // Yes, you can do that to an array in JavaScript.  See the Queue class.
    // 4.1 Remove any left-over spaces.
    cmd = trim(cmd);
    // 4.2 Record it in the return value.
    retVal.command = cmd;

    // 5. Now create the args array from what's left.
    for (var i in tempList)
    {
        var arg = trim(tempList[i]);
        if (arg != "")
        {
            retVal.args[retVal.args.length] = tempList[i];
        }
    }
    return retVal;
}

function shellExecute(fn, args)
{
    // We just got a command, so advance the line...
    _StdIn.advanceLine();
    // ... call the command function passing in the args...
    fn(args);
    // Check to see if we need to advance the line again
    if (_StdIn.CurrentXPosition > 0)
    {
        _StdIn.advanceLine();
    }
    // ... and finally write the prompt again.
    this.putPrompt();
}

/**
* Schedules all resident processes for execution.
*/
function shellRunAll() {
	// Enumerate all possible process IDs.
	for (var pid = 0; pid < MAX_PROCESSES; pid+=1) {
		// If the PID has an associated process then execute it.
		if (_KernelResidentList.hasOwnProperty(pid)) {
			executeProcess([pid]);
		}
	}
}

/**
* Allows the user to modify the quantum value. 
*/
function shellSetQuantum(args) {
	// We only care about the first element of the args array.
	var number = Number(args[0]);
	
	if (typeof number !== 'number' || args < 0) { // Verify that the user entered a number.
		_StdOut.putText("Invalid quantum value. Must be an integer > 0.");
	} else { // Set the quantum and inform the user.
		_Quantum = number;
		_StdOut.putText("Quantum initialized to " + number);
	}
}

/**
* Displays all currently executing processes.
*/
function shellPs() {
	
	// Dummy var to hold the final output string.
	var output = [];
	
	// Make sure to include the PID of the currently executing process.
	if (_ActiveProcess !== undefined && _ActiveProcess !== null) {
		output[output.length] = "  " + _ActiveProcess.PID + "  " + "  executing";
	}
	
	// Enumerate over all keys on the ready queue. Each key 
	// represents a PID of a process either in execution or 
	// awaiting execution by the scheduler.
	for (var i = 0; i < _KernelReadyQueue.getSize(); i+=1) {
			output[output.length] = "  " + _KernelReadyQueue.q[i] + "  " + "  waiting/ready";
	}
	
	if (output.length > 0) { // If there are any active processes.
		// Print the header
		_StdOut.putText("  PID  STATUS");
		_StdOut.advanceLine();
		// Print the active process information.
		for (var i=0; i < output.length; i+=1) {
			_StdOut.putText(output[i]);
			_StdOut.advanceLine();
		}
	} else { // If there are no active processes.
		_StdOut.putText("  There are currently 0 active processes.");
	}
}

function shellKillPs(args) {

	var pid = Number(args[0]); // Grab the PID input  by the user.
	
	if (isNaN(pid)) { // Verify that the user entered a number.
		_StdOut.putText("Invalid PID value. Must be an integer.");
		return;
	}
	
	// Check if the process to kill is currently executing.
	if (_ActiveProcess !== undefined && _ActiveProcess !== null) {
		if(_ActiveProcess.PID === pid) { // It is...
			krnTerminateProcess(_KernelResidentList[pid]); // Terminate it.
			return;
		}
	} else { // Check if the process is on the ready queue.
		
		// Enumerate over all processes on the ready queue.
		for (var i = 0; i < _KernelReadyQueue.getSize(); i+=1) {
			
			// If this is the specified process.
			if (_KernelReadyQueue.q[i] === pid) {
				// Remove it from the ready queue.
				delete _KernelReadyQueue.q[i]
				// Terminate it.
				krnTerminateProcess(_KernelResidentList[pid]);
				return;
			}
		}
	}
	
	_StdOut.putText("Cannot kill process with PID " + pid + " because the process does not exist.");
}

//
// The rest of these functions ARE NOT part of the Shell "class" (prototype, more accurately),
// as they are not denoted in the constructor.  The idea is that you cannot execute them from
// elsewhere as shell.xxx .  In a better world, and a more perfect JavaScript, we'd be
// able to make then private.  (Actually, we can. have a look at Crockford's stuff and Resig's JavaScript Ninja cook.)
//

//
// An "interior" or "private" class (prototype) used only inside Shell() (we hope).
//
function ShellCommand()
{
    // Properties
    this.command = "";
    this.description = "";
    this.function = "";
}

//
// Another "interior" or "private" class (prototype) used only inside Shell() (we hope).
//
function UserCommand()
{
    // Properties
    this.command = "";
    this.args = [];
}


//
// Shell Command Functions.  Again, not part of Shell() class per se', just called from there.
//
function shellInvalidCommand()
{
    _StdIn.putText("Invalid Command. ");
    if (_SarcasticMode)
    {
        _StdIn.putText("Duh. Go back to your Speak & Spell.");
    }
    else
    {
        _StdIn.putText("Type 'help' for, well... help.");
    }
}

function shellCurse()
{
    _StdIn.putText("Oh, so that's how it's going to be, eh? Fine.");
    _StdIn.advanceLine();
    _StdIn.putText("Bitch.");
    _SarcasticMode = true;
}

function shellApology()
{
   if (_SarcasticMode) {
      _StdIn.putText("Okay. I forgive you. This time.");
      _SarcasticMode = false;
   } else {
      _StdIn.putText("For what?");
   }
}

function shellVer(args)
{
    _StdIn.putText(APP_NAME + " version " + APP_VERSION);
}

function shellHelp(args)
{
    _StdIn.putText("Commands:");
    for (var i in _OsShell.commandList)
    {
        _StdIn.advanceLine();
        _StdIn.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
    }
}

function shellShutdown(args)
{
     _StdIn.putText("Shutting down...");
     // Call Kernel shutdown routine.
    krnShutdown();
    // TODO: Stop the final prompt from being displayed.  If possible.  Not a high priority.  (Damn OCD!)
}

function shellCls(args)
{
    _StdIn.clearScreen();
    _StdIn.resetXY();
}

function shellMan(args)
{
    if (args.length > 0)
    {
        var topic = args[0];
        switch (topic)
        {
            case "help":
                _StdIn.putText("Help displays a list of (hopefully) valid commands.");
                break;
            default:
                _StdIn.putText("No manual entry for " + args[0] + ".");
        }
    }
    else
    {
        _StdIn.putText("Usage: man <topic>  Please supply a topic.");
    }
}

function shellTrace(args)
{
    if (args.length > 0)
    {
        var setting = args[0];
        switch (setting)
        {
            case "on":
                if (_Trace && _SarcasticMode)
                {
                    _StdIn.putText("Trace is already on, dumbass.");
                }
                else
                {
                    _Trace = true;
                    _StdIn.putText("Trace ON");
                }

                break;
            case "off":
                _Trace = false;
                _StdIn.putText("Trace OFF");
                break;
            default:
                _StdIn.putText("Invalid arguement.  Usage: trace <on | off>.");
        }
    }
    else
    {
        _StdIn.putText("Usage: trace <on | off>");
    }
}

function shellRot13(args)
{
    if (args.length > 0)
    {
        _StdIn.putText(args[0] + " = '" + rot13(args[0]) +"'");     // Requires Utils.js for rot13() function.
    }
    else
    {
        _StdIn.putText("Usage: rot13 <string>  Please supply a string.");
    }
}

function shellTime(args) {

		_StdIn.putText(new Date().toLocaleString());
}

var userLocations = [
			"Your Happy Place", "The Library", "Your Happy Place in the Library",
			"A Library in Your Happy Place", "Your Dorm", "At Aunt Marge's eating pie",
			"Your Aunt Bertha's", "Mordor", "In a Dream", "Mallowland", "...within a Dream.",
			"Bagend", "Smithy's Castle", "A Good Place", "Over There", "A Bad Place",
			"Right Here", "In Your Head", "Get out", "In a Burning Building",
			"Get out", "Now", "Gondor"
	];

function shellUserLocation() {
	// Generate an index into the locations array.
	var index = Math.floor((Math.random()*100)) % userLocations.length;
	// Output the users's location.
	_StdIn.putText("Your current location is: " + userLocations[index]);
}

function shellPrompt(args)
{
    if (args.length > 0) {
        _OsShell.promptStr = args[0];
    } else {
        _StdIn.putText("Usage: prompt <string>  Please supply a string.");
    }
}

function shellChangeTheme(args) {

	if (args.length == 0) { // If the user provided no args then simply output the current theme.
		_StdIn.putText("The current theme is " + _Console.CurrentTheme.name + ".");
		_StdIn.advanceLine();
		_StdIn.putText("Type \"theme list\" for a list of available themes.");
	} else if (args.length == 1) { // If the user provided an argument then do more stuff.

		if (args[0] == "list") { // Present the user with a list of available themes.

			for (var i = 0; i < Themes.length; ++i) {
				_StdIn.putText("  " + Themes[i].name + " - " + Themes[i].description);
				_StdIn.advanceLine();
			}
		} else { // Attempt to set the theme using the theme-name specified by the user.

			var userTheme = args[0];
			// initialize the loop variables
			var found = false;
			var index = 0;
			// Loop until the theme is found or until there are no themes left to check.
			while (!found && (index < Themes.length)) {
				if (Themes[index].name == userTheme) {
					_Console.setTheme(Themes[index]);
					found = true;
				}
				index += 1;
			}
			// If no theme was found then inform the user.
			if (!found) {
				_StdIn.putText("Invalid theme. Type \"theme list\" to see valid themes.");
			}
		}
	} else {
		_StdIn.putText("Invalid argument list length. Please supply a valid theme. Type \"theme list\" for valid themes.");
	}
}

function validateSourceCode(tokens) {

	// Build the regex.
	var regex = new RegExp("([A-F]|[0-9]| )", "i");

	// Initialize loop variables.
	var valid = true;
	var index = 0;

	// loop until there are no more characters or until an invalid character is found.
	while(valid && index < tokens.length) {

		if (!regex.test(tokens[index])) {
			valid = false;
		} else {
			index += 1;
		}
	}

    return valid;
}

/**
 * Parses the source code in the user input area and passes it to the kernel. 
 * The kernel is responsible for loading the code into main memory and creating
 * a new process representing the program.
 */
function loadProgram() {

    // First check if the user typed in any source code.
    if (_userInputArea.value.length == 0) {
        _StdOut.putText("You did not enter any source code. Try again.");
        return;
    }
	
    // There is some source code...lets validate it.
    var src = _userInputArea.value.trim().split(" ");
    var isValid = validateSourceCode(src);

    // The source contains valid syntax, feed it to the kernel
	// and assume that it is not a virus.
    if (isValid) {
        // create a new process
        var pid = krnNewProcess(src);
		// Verify that the process was created.
		if (typeof pid !== 'undefined') {
			_StdOut.putText("PID " + pid);
		}
    } else { // Its not valid. Inform the user.
        _StdOut.putText("  Invalid token found in program.");
        _StdOut.advanceLine();
        _StdOut.putText("  Program should contain only spaces and HEX characters.");
    }
}

/**
 * Executes the process specified by PID. This method 
 * delegates the necessary scheduling work to the kernel.
 */
function executeProcess(args) {
	// Grab the PID from the params list.
	var toExecutePID = args[0];
    // This check ensures that the specified PID is valid.
    if (typeof _KernelResidentList[toExecutePID] != 'undefined') {
        krnScheduleProcess(toExecutePID);
    } else {
        _StdOut.putText("Unable to execute process. Invalid PID " + pid);
    }
}

/**
 * Causes a catastrophic error resulting in a BSOD.
 */
function shellImplode(args) {
	krnTrapError(args[0]);
}

/**
 * Updates the status bar with a custom status message.
 */
function shellSetStatus(args) {
	if (args.length < 1) {
		_StdOut.putText("Please supply a string.");
	} else {
		updateStatusMessage(args[0]);
	}
}

/**
 * Create the file "filename" and display a message denoting success or failure.	
 */
function createFile(args) {
	if (args.length < 1) {
		_StdOut.putText("File create failed. One argument expected, none given.");
		_StdOut.putText("Please specify a filename.");
		return;
	}
	
	krnPerformIO(IO_CREATE_FILE, args[0]);
}

/**
 * Read and display the contents of "filename" or display an error if something went wrong.
 */
function readFile(args) {
	if (args.length < 1) {
		_StdOut.putText("File read failed. One argument expected, none given.");
		_StdOut.putText("Please specify a filename.");
		return;
	}
	
	krnPerformIO(IO_READ_FILE, args[0]);
}

/**
 * Write the data inside the quotes to "filename" and display a message denoting success or failure.
 */
function writeToFile(args) {
	if (args.length < 2) {
		_StdOut.putText("File write failed. Two arguments expected, " + args.length + " given.");
		_StdOut.putText("Please specify the filename and the data to be written.");
		return;
	}
	
	var dataString = '';
	
	for (var i=1; i < args.length; i+=1) {
		dataString += args[i] + " ";
	}
	
	krnPerformIO(IO_WRITE_FILE, args[0], dataString.trim());
}

/**
 * Remove "filename" from storage and display a message denoting success or failure.
 */
function deleteFile(args) {
	if (args.length < 1) {
		_StdOut.putText("File delete failed. One argument expected, none given.");
		_StdOut.putText("Please specify the name of the file to be deleted.");
		return;
	}
	
	krnPerformIO(IO_DELETE_FILE, args[0]);
}

/**
 * Initialize all blocks in all sectors in all tracks and display a message denoting success or failure.
 */
function formatFs(args) {
	krnFormatFs()
	_StdOut.putText("File system format was successful.");
}

/**
 * Lists all files stored on the file system.
 */
function listFiles() {
	krnListFiles();
}