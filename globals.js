/* ------------
   Globals.js

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)

   This code references page numbers in the text book:
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */


/** Global Constants **/

/* Version Information */
var APP_NAME = "VBOS";
var APP_VERSION = "0.01";

/* CPU */
var CPU_CLOCK_INTERVAL = 100;   // This is in ms, or milliseconds, so 1000 = 1 second.

/* Memory */
var MEMORY_MAX = 768; // Size of main memory in bytes.
var ADDRESS_SPACE_MAX = 256; // Address space size in bytes.

/* Process */
var MAX_PROCESSES = 3 // The maximum number of processes that can exist on the system.
var DEFAULT_PRIORITY = 1 // The default priority given to a newly created process.

/* HDD */
var IO_CREATE_FILE = 0;
var IO_READ_FILE = 1;
var IO_WRITE_FILE = 2;
var IO_DELETE_FILE = 3;

/* Interrupt Codes */
var TIMER_IRQ = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
var KEYBOARD_IRQ = 1; // The interrupt code used by the keyboard device.
var SYSTEM_CALL_IRQ = 2; // Used by a process to to request a system service.
var PROCESS_COMPLETE_IRQ = 3; // Used by a process to indicate successful termination.
var MEMORY_ERROR_IRQ = 4; // The interrupt code used to specify a memory related error.
var CONTEXT_SWITCH_IRQ = 5; // The interrupt code used by the CPU to specify a context switch.
var ACCESS_VIOLATION_ERROR = -2; // Indicates that a process attempted to access a restricted/invalid memory location.
var OUT_OF_MEMORY_ERROR = -1; // Indicates a failed allocation attempt by the kernel.

/* Kernel */
var KERNEL_MODE = 0;
var USER_MODE = 1;


/** Global Variables **/

/* Hardware */
var _CPU = null; // CPU
var _OSclock = 0; // CLOCK COUNTER
var _MainMemory = null; // RAM
var _HDD = null; // HARD-DISK-DRIVE
var _statusBar = null; // STATUS BAR
var _memoryDisplayDevice = null; // MEMORY DISPLAY
var _userInputArea = null; // PROGRAM INPUT AREA
var _Canvas = null; // DISPLAY DEVICE
var _DrawingContext = null; 
var _DefaultFontFamily = "sans";
var _DefaultFontSize = 13;
var _FontHeightMargin = 4; // Additional space added to font size when advancing a line.


/* Software */
var _Mode = KERNEL_MODE;   // 0 = Kernel Mode, 1 = User Mode. 
var _MemoryManager = null; // kernel-level memory manager

// Global Device Driver Handles
var krnKeyboardDriver = null;
var krnStatusBarDriver = null
var krnMemDispDriver = null;
var krnHddDriver = null;

// Default the OS trace to be on.
var _Trace = true;

// OS queues
var _KernelInterruptQueue = null;
var _KernelBuffers = null;
var _KernelInputQueue = null;

// Process-related data structures
var _KernelReadyQueue = null;
var _KernelResidentList = null;
var _ActiveProcess = null;
var _nextPID = 0;
var _Quantum = 6;
var _Scheduler = null;

// Standard input and output
var _StdIn  = null;
var _StdOut = null;

// UI
var _Console = null;
var _OsShell = null;

// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode = false;

// For testing...
var _GLaDOS = null;