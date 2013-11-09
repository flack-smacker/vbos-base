/**
 * A simulation of a CPU scheduler that implements a round-robin scheduling scheme.
 * The scheduler is responsible for allocating CPU time to each process. The amount of time
 * allocated per process is dependent on the _Quantum variable (global.js) which can be set
 * by the user through a shell command. The scheduler is also responsible for initiating
 * context-switches when the currently executing process exhausts its CPU time. 
 *
 * Created by Joe Muro on 11/09/13. **/

function Scheduler(quantum) {

    this.quantum = quantum;
	this.execTime = 0; // A counter for tracking the amount of CPU cycles 
	
	
    /**
     *
     */
    this.doSchedule = function() {
        
    };

    
}