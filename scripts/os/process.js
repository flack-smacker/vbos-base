/**
 * Created by Joe Muro on 10/7/13.
 */

function ProcCtrlBlk() {

    // PROCESS STATE INFORMATION
    this.PID = null; // the integer ID assigned to this process
    this.Priority = null;// the integer priority assigned to this process
    this.State = ProcessState.NEW; // the current process state (i.e. running, waiting, terminated, etc.)

    // ADDRESS SPACE INFORMATION
    this.BASE_ADDRESS = null; // the first address in this process address space
    this.LIMIT = null; // the size of this processes address space

    // CPU STATE INFORMATION
    this.PC = 0; // contains the address of the next executable instruction
    this.Acc   = 0; // the value contained in the accumulator register
    this.Xreg  = 0; // the value contained in the X register
    this.Yreg  = 0; // the value contained in the Y register
    this.Zflag = 0; // the value contained in the ZFlag register

}

ProcessState = {

    NEW: 0,
    RUNNING: 1,
    WAITING: 2,
    READY: 3,
    TERMINATED: 4
};