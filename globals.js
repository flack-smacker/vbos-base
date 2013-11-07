/* ------------
   Globals.js

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)

   This code references page numbers in the text book:
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

//
// Global CONSTANTS
//
var APP_NAME = "VBOS";
var APP_VERSION = "0.01";

var CPU_CLOCK_INTERVAL = 100;   // This is in ms, or milliseconds, so 1000 = 1 second.

var MEMORY_MAX = 768; // Size of main memory in bytes.

var MAX_PROCESSES = 100 // The maximum number of processes that can exist on the system.
var DEFAULT_PRIORITY = 1 // The default priority given to a newly created process.

var TIMER_IRQ = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
                    // NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
var KEYBOARD_IRQ = 1;

var SYSTEM_CALL_IRQ = 2; // Used by a process to to request a system service.

var PROCESS_COMPLETE_IRQ = 3; // Used by a process to indicate successful termination.

var KERNEL_MODE = 0;
var USER_MODE = 1;

//
// Global Variables
//
var _CPU = null;

var _MainMemory = null;
var _MemoryManager = null;
var _OSclock = 0;       // Page 23.

var _Mode = KERNEL_MODE;   // 0 = Kernel Mode, 1 = User Mode.  See page 21.

var _Canvas = null;               // Initialized in hostInit().
var _DrawingContext = null;       // Initialized in hostInit().
var _DefaultFontFamily = "sans";  // Ignored, I think. The was just a place-holder in 2008, but the HTML canvas may have use for it.
var _DefaultFontSize = 13;
var _FontHeightMargin = 4;        // Additional space added to font size when advancing a line.

var _statusBar = null;			  // Initialized in hostInit();
var _memoryDisplayDevice = null;  // Initialized in hostInit();
var _userInputArea = null;		  // Initialized in hostInit();

// Default the OS trace to be on.
var _Trace = true;

// OS queues
var _KernelInterruptQueue = null;
var _KernelBuffers = null;
var _KernelInputQueue = null;

// Process-related queues
var _KernelReadyQueue = null;
var _KernelPCBList = null;
var _ActiveProcess = null;

// Standard input and output
var _StdIn  = null;
var _StdOut = null;

// UI
var _Console = null;
var _OsShell = null;

// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode = false;

// Global Device Driver Objects - page 12
var krnKeyboardDriver = null;
var krnStatusBarDriver = null
var krnMemDispDriver = null;

// For testing...
var _GLaDOS = null;