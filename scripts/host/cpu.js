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
        var opcode = _MemoryManager.read(0, this.PC, 0);

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
            _CPU.Acc = parseInt(_MemoryManager.read(0, _CPU.PC, 0), 10);
            _CPU.PC += 1;
        },

        'AD': function() { // Load the accumulator from memory.

            var toLoad = fetchOperand();
            this.Acc = toLoad();
        },

        '8D': function() { // Write the value of the accumulator to memory.
            var lowNyble = _MemoryManager.read(0, _CPU.PC, 0);
            var highNyble = _MemoryManager.read(0, _CPU.PC, 1);

            var toAddress = parseInt(highNyble + lowNyble, 10);

            _MemoryManager.write(0, toAddress, _CPU.Acc);

            _CPU.PC += 2;
        },

        '6D': function() { // Add the contents of a memory address to the accumulator.

            var toAdd = fetchOperand();

            _CPU.Acc += toAdd;
            _CPU.PC += 2;
        },

        'A2': function() { // Load X register with a constant.
            _CPU.X = parseInt(_MemoryManager.read(0, _CPU.PC, 0), 10);
            _CPU.PC += 1;
        },

        'AE': function() { // Load X register from memory.

            var toLoad = fetchOperand()

            _CPU.X = toLoad;

        },

        'A0': function() { // Load Y register with a constant.
            _CPU.Y = parseInt(_MemoryManager.read(0, _CPU.PC, 0), 10);
            _CPU.PC += 1;
        },

        'AC': function() { // Load Y register from memory.

            var toLoad = fetchOperand();

            _CPU.Y = toLoad;
        },

        'EA': function() { // NO-OP

        },

        '00': function() { // Break (System-call)
            _CPU.isExecuting = false;
        },

        'EC': function() { // Compare a byte in memory to contents of X register

            var toCompare = fetchOperand();

            if (_CPU.X == toCompare) {
                _CPU.Z = 1;
            }
        },

        'D0': function() { // Branch X bytes if Z flag = 0

            if (_CPU.Z == 0) {
                var offset = parseInt(_MemoryManager.read(0, _CPU.PC, 0), 16);

                // Allow for "negative" branching by wrapping-around.
                if ( (255 % offset) > 0 ) {
                    _CPU.PC = 255 % offset;
                } else {
                    _CPU.PC += offset;
                }
            } else {
                _CPU.PC += 1;
            }
        },

        'EE': function() { // Increment the value of a byte in memory.

            var lowNyble = _MemoryManager.read(0, _CPU.PC, 0);
            var highNyble = _MemoryManager.read(0, _CPU.PC, 1);
            _CPU.PC += 2;

            var operandAddress = parseInt(highNyble + lowNyble, 10);
            var operand =  parseInt(_MemoryManager.read(0, operandAddress, 0), 10);

            operand += 1;

            _MemoryManager.write(0, operandAddress, operand);
        },

        'FF': function() { // Print system call.
            if (_CPU.X == 1) { // #$01 in X reg = print the integer stored in the Y register.
                _KernelInterruptQueue.enqueue(new Interrupt(SYSTEM_CALL_IRQ, [1, _CPU.Y]));
            } else if (_CPU.X == 2) { // #$02 in X reg = print the 00-terminated string stored at the address in the Y register.
                _KernelInterruptQueue.enqueue(new Interrupt(SYSTEM_CALL_IRQ, [2, _CPU.Y]));
            }
        }
    };

    function fetchOperand() {

        var lowNyble = _MemoryManager.read(0, _CPU.PC, 0);
        var highNyble = _MemoryManager.read(0, _CPU.PC, 1);
        _CPU.PC += 2;

        var operandAddress = parseInt(highNyble + lowNyble, 10);
        var operand =  parseInt(_MemoryManager.read(0, operandAddress, 0), 10);

        return operand;
    }
}
