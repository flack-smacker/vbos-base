/* ------------  
 CPU.js

 Requires global.js.

 Routines for the host CPU simulation, NOT for the OS itself.
 In this manner, it's A LITTLE BIT like a hypervisor,
 in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
 that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
 JavaScript in both the host and client environments.

 This code references page numbers in the text book:
 Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
 ------------ */

function Cpu() {
    this.PC    = 0;     // Program Counter
    this.Acc   = 0;     // Accumulator
    this.Xreg  = 0;     // X register
    this.Yreg  = 0;     // Y register
    this.Zflag = 0;     // Z-ero flag (Think of it as "isZero".)
    this.isExecuting = false;

    this.init = function() {
        this.PC    = 0;
        this.Acc   = 0;
        this.Xreg  = 0;
        this.Yreg  = 0;
        this.Zflag = 0;
        this.isExecuting = false;
    };

    this.cycle = function() {
        krnTrace("CPU cycle");
        // TODO: Accumulate CPU usage and profiling statistics here.

        // Fetch the next instruction.
        var opcode = _MemoryManager.read(this.PC, 0);

        // Increment the Program Counter
        this.PC += 1;

        // Decode the instruction
        var instruction = this.instructions[opcode];

        // Execute the instruction
        instruction();

    };

    // THE INSTRUCTION SET SUPPORTED BY THIS CPU
    this.instructions = {

        'A9': function() { // Load the accumulator with a constant.
            _CPU.Acc = parseInt(_MemoryManager.read(_CPU.PC, 0), 16);
            _CPU.PC += 1;
        },

        'AD': function() { // Load the accumulator from memory.

            var toLoad = fetchOperand();
            this.Acc = toLoad();
        },

        '8D': function() { // Write the value of the accumulator to memory.
            var lowNyble = _MemoryManager.read(_CPU.PC, 0);
            var highNyble = _MemoryManager.read(_CPU.PC, 1);

            var toAddress = parseInt(highNyble + lowNyble, 16);

            _MemoryManager.write(toAddress, _CPU.Acc);

            _CPU.PC += 2;
        },

        '6D': function() { // Add the contents of a memory address to the accumulator.

            var toAdd = fetchOperand();

            _CPU.Acc += toAdd;
            _CPU.PC += 2;
        },

        'A2': function() { // Load X register with a constant.
            _CPU.Xreg = parseInt(_MemoryManager.read(_CPU.PC, 0), 16);
            _CPU.PC += 1;
        },

        'AE': function() { // Load X register from memory.

            var toLoad = fetchOperand()

            _CPU.Xreg = toLoad;

        },

        'A0': function() { // Load Y register with a constant.
            _CPU.Yreg = parseInt(_MemoryManager.read(_CPU.PC, 0), 16);
            _CPU.PC += 1;
        },

        'AC': function() { // Load Y register from memory.

            var toLoad = fetchOperand();

            _CPU.Yreg = toLoad;
        },

        'EA': function() { // NO-OP

        },

        '00': function() { // Break (System-call)
            _KernelInterruptQueue.enqueue(new Interrupt(PROCESS_COMPLETE_IRQ, [0]));
        },

        'EC': function() { // Compare a byte in memory to contents of X register

            var toCompare = fetchOperand();

            if (_CPU.Xreg == toCompare) {
                _CPU.Zflag = 1;
            }
        },

        'D0': function() { // Branch X bytes if Z flag = 0

            if (_CPU.Zflag == 0) {
                var offset = parseInt(_MemoryManager.read(_CPU.PC, 0), 16);

                _CPU.PC = _CPU.PC + offset

                if ( _CPU.PC > 255 ) { // Allows for "negative" branching by wrapping-around.
                    _CPU.PC = _CPU.PC - 255;
                }
            } else {
                _CPU.PC += 1;
            }
        },

        'EE': function() { // Increment the value of a byte in memory.

            var lowNyble = _MemoryManager.read(_CPU.PC, 0);
            var highNyble = _MemoryManager.read(_CPU.PC, 1);
            _CPU.PC += 2;

            var operandAddress = parseInt(highNyble + lowNyble, 16);
            var operand =  parseInt(_MemoryManager.read(operandAddress, 0), 16);

            operand += 1;

            _MemoryManager.write(operandAddress, operand);
        },

        'FF': function() { // Print system call.
            if (_CPU.Xreg == 1) { // #$01 in X reg = print the integer stored in the Y register.
                _KernelInterruptQueue.enqueue(new Interrupt(SYSTEM_CALL_IRQ, [1, _CPU.Yreg]));
            } else if (_CPU.Xreg == 2) { // #$02 in X reg = print the 00-terminated string stored at the address in the Y register.
                _KernelInterruptQueue.enqueue(new Interrupt(SYSTEM_CALL_IRQ, [2, _CPU.Yreg]));
            }
        }
    };

	/**
	 * Fetches a two-byte operand starting from the memory address currently pointed to be the program counter.
	 */
    function fetchOperand() {

        var lowNyble = _MemoryManager.read(_CPU.PC, 0);
        var highNyble = _MemoryManager.read(_CPU.PC, 1);
        _CPU.PC += 2;

        var operandAddress = parseInt(highNyble + lowNyble, 16);
        var operand =  parseInt(_MemoryManager.read(operandAddress, 0), 16);

        return operand;
    }
}
