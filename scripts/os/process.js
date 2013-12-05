/**
 * Created by Joe Muro on 10/7/13.
 */

function ProcCtrlBlk(pid, base_address, limit) {

    // PROCESS STATE INFORMATION
    this.PID = pid; // an integer ID assigned to this process
    this.Priority = null;// an integer priority assigned to this process
    this.State = ProcessState.NEW; // the current process state (i.e. running, waiting, terminated, etc.)
	this.swappedIn = true; // Indicates whether this process exists in main memory.
	
    // ADDRESS SPACE INFORMATION
    this.BASE_ADDRESS = base_address; // the first address in this processes address space
    this.LIMIT = limit; // the size of this processes address space

    // CPU STATE INFORMATION
    this.PC = 0; // contains the address of the next executable instruction
    this.Acc   = 0; // the value contained in the accumulator register
    this.Xreg  = 0; // the value contained in the X register
    this.Yreg  = 0; // the value contained in the Y register
    this.Zflag = 0; // the value contained in the ZFlag register

}

/**
 * Constants to represent the various process states.
 */
ProcessState = {

    NEW: 0,
    RUNNING: 1,
    WAITING: 2,
    READY: 3,
    TERMINATED: 4
};