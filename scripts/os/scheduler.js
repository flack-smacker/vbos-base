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
		if (_CPU.isExecuting) {
			if (this.cycles === _Quantum) { // Check if this process exceeded the specified quantum.
				krnTrace("Process with PID " + _ActiveProcess.PID + " exhausted quantum. Checking ready queue for the next process to execute.");
				// Reset the cycle count;
				this.cycles = 0;
				// Prevent the CPU from executing work until the context-switch completes.
				_CPU.isExecuting = false;
				// Schedule a context-switch
				_KernelInterruptQueue.enqueue(new Interrupt(CONTEXT_SWITCH_IRQ, [_ActiveProcess.PID]));
				// Indicate an idle CPU.
				_ActiveProcess = null;
			} else {
				// Increment the count of cycles.
				this.cycles++;
				// Perform another CPU cycle.
				_CPU.cycle();
			}
		} else if (_KernelReadyQueue.getSize() > 0) { // If there is no work currently executing then check the ready queue.
			// Log scheduling events...
			krnTrace("Retrieving process with PID " + pid + " from ready queue.");
			
			// Get the PID of the process to be executed.
			var pid = _KernelReadyQueue.dequeue();
			// Get the PCB associated with this PID.
			var toDispatch = _KernelResidentList[pid];
			
			// Check if this process is currently swapped in.
			if (!toDispatch.swappedIn) {
				// Swap the process into main memory first.
				this.swapIn(toDispatch);
			}
			
			// Dispatch the process for execution.
			this.doDispatch(toDispatch);
			
		} else { // If there are no interrupts and there is nothing being executed then just be idle.
		   krnTrace("Idle");
		}
	};
	
	/**
	 * Dispatches the specified process to the CPU for execution.
	 */
	this.doDispatch = function(toDispatch) {
		
		// Log scheduling events...
		krnTrace("Dispatching process with PID " + toDispatch.PID + " to CPU0.");
		
		// Update the PCB with the new process state.
		toDispatch.State = ProcessState.RUNNING;
		// Update the currently active process.
		_ActiveProcess = toDispatch;
		
		// Restore the CPU state.
		_CPU.PC = toDispatch.PC;
		_CPU.Acc = toDispatch.Acc;
		_CPU.Xreg = toDispatch.Xreg;
		_CPU.Yreg = toDispatch.Yreg;
		_CPU.Zflag = toDispatch.Zflag;
		
		// We don't want to give the user program kernel powers.
		_Mode = USER_MODE;
		
		// Inform the kernel that there is work to be done.
		_CPU.isExecuting = true;
		
		// Update the PCB display
		updatePCBDisplay(_ActiveProcess);
	};
	
	/**
	 * Swaps the specified process into main memory.
	 */
	this.swapIn = function(toSwap) {
	
		// Read the source code for the incoming process from the swap file.
		var incoming = _FileSystem.read(_SwapFile);
		
		// Check if there is storage available in main memory.
		if (_ProcessCount < MAX_PROCESSES) {
			var baseAddress = _MemoryManager.allocate(toSwap.PID);
			toSwap.BASE_ADDRESS = baseAddress;
			toSwap.LIMIT = (baseAddress + (ADDRESS_SPACE_MAX - 1));
			toSwap.swappedIn = true;
			
			_Mode = KERNEL_MODE;
			for (var i=0,j=0; i < ADDRESS_SPACE_MAX; i+=1,j+=2) {
				_MemoryManager.write(toSwap.BASE_ADDRESS + i, incoming.substr(j,2));
			}_Mode = USER_MODE;
			
			_SwapFileInUse = false;
		} 
		// Else we need to swap out a process that is currently in memory.
		else {
		
			var outgoing = null;
			
			// Select a process to swap out.
			for (var i=0; i < MAX_PROCESSES; i+=1) {
				if (_KernelResidentList[i].swappedIn) {
					outgoing = _KernelResidentList[i];
					break;
				}
			}
			
			// Write the address space to the swap file.
			var buffer = '';
			_Mode = KERNEL_MODE;
			for (var i=0,j=0; i < ADDRESS_SPACE_MAX; i+=1,j+=2) {
				buffer += _MemoryManager.read(outgoing.BASE_ADDRESS, i);
				_MemoryManager.write(outgoing.BASE_ADDRESS + i, incoming.substr(j,2));
			}_Mode = USER_MODE;
			_FileSystem.writeToSwap(buffer);
		
			// Update the MMU to reflect the swap.
			_MemoryManager.memoryMap[toSwap.PID] = _MemoryManager.memoryMap[outgoing.PID];
			delete _MemoryManager.memoryMap[outgoing.PID];
			
			// Swap address spaces and modify the PCBs to reflect the change.
			outgoing.swappedIn = false;
			toSwap.BASE_ADDRESS = outgoing.BASE_ADDRESS;
			toSwap.LIMIT = outgoing.LIMIT;
			toSwap.swappedIn = true;
		}
	}
}