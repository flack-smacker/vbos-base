/**
 * A simulation of a CPU scheduler that implements a round-robin scheduling scheme.
 * The scheduler is responsible for allocating CPU time to each process. The amount of time
 * allocated per process is dependent on the _Quantum variable (global.js) which can be set
 * by the user through a shell command. The scheduler is also responsible for initiating
 * context-switches when the currently executing process exhausts its CPU time. 
 *
 * Created by Joe Muro on 11/09/13. **/

function RoundRobinScheduler(quantum) {

    this.quantum = quantum; // A limit on the number of cycles to allocate per CPU burst.
	this.cycles = 0; // A counter for tracking the amount of cycles used by the currently executing process.
	
    /**
	 * Executes a single CPU clock cycle. This method is called after every host clock-tick.
     */
    this.doExecute = function() {
		if (_CPU.isExecuting) { // If there are no interrupts then run one CPU cycle if there is anything being processed.
			if (this.cycles === _Quantum) { // Check if this process exceeded the specified quantum.
				krnTrace("Process with PID " + _ActiveProcess.PID + " exhausted quantum. Checking ready queue for the next process to execute.");
				this.cycles = 0; // Reset the cycle count;
				_CPU.isExecuting = false; // Prevent the CPU from executing work until the context-switch completes.
				_KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, [_ActiveProcess.PID])); // Schedule a context-switch
				_ActiveProcess = null; // Indicate an idle CPU.
			} else {
				this.cycles++; // Increment the count of cycles.
				_CPU.cycle(); // Perform another CPU cycle.
			}
		} else if (_KernelReadyQueue.getSize() > 0) { // If there is no work currently executing then check the ready queue.
			krnTrace("Retrieving process with PID " + pid + " from ready queue."); // Log scheduling events...
			var pid = _KernelReadyQueue.dequeue(); // Get the PID of the process to be executed.
			this.doDispatch(pid); // Dispatch the process to the CPU for execution.
		} else { // If there are no interrupts and there is nothing being executed then just be idle.
		   krnTrace("Idle");
		}
	};
	
	this.doDispatch = function(pid) {
		
		// Log scheduling events...
		krnTrace("Dispatching process with PID " + pid + " to CPU0.");
		
		// Retrieve the PCB associated with this PID.
		var toDispatch = _KernelResidentList[pid];
		// Update the PCB with the new process state.
		toDispatch.State = ProcessState.RUNNING;
		// Update the currently active process.
		_ActiveProcess = _KernelResidentList[toDispatch.PID];
		
		// Restore the state of the CPU.
		_CPU.PC = toDispatch.PC;
		_CPU.Acc = toDispatch.Acc;
		_CPU.Xreg = toDispatch.Xreg;
		_CPU.Yreg = toDispatch.Yreg;
		_CPU.Zflag = toDispatch.Zflag;
		
		// Change the mode to user mode.
		// We don't want to give the user program kernel powers.
		_Mode = USER_MODE;
		
		// Inform the kernel that there is work to be done.
		_CPU.isExecuting = true;
		
		// Update the PCB display
		updatePCBDisplay();
	};
}