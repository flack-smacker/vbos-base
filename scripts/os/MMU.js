/**
 * A software simulation of a memory management unit (MMU).
 * The MMU is responsible for managing access to main memory. Its primary responsibilities
 * include allocation and de-allocation of memory blocks and allowing authorized read/write
 * access to main memory. It currently uses a fixed-size partition allocation scheme,
 * with main memory divided into three 256 byte chunks for a total of 768 bytes of main memory.
 *
 * Created by Joe Muro on 9/30/13. **/

function MMU(memory) {

    this.memory = memory; // A reference to the memory "hardware"
	this.freeList = []; // A list of address ranges representing free blocks of memory.
    this.memoryMap = {}; // A list of pid -> address range mappings.
	this.PARTITION_SIZE = 256; // The maximum partition size.
	
	
    /**
     * Initializes the free list.
     */
    this.init = function() {
        for (var i = 0; i < MEMORY_MAX; i+= this.PARTITION_SIZE) {
            this.freeList.push([i, i + (this.PARTITION_SIZE - 1)]);
        }
    };

    /**
     * Writes the specified byte value to main memory at the specified address.
     *
     * Assumptions:
     *      The specified memory address is within the requesting processes address space.
     *
     * @param address the address to be written to
     * @param byteVal the value to be written
     */
    this.write = function(address, byteVal) {
        if (_Mode === KERNEL_MODE) { // This is a kernel-mode process...
			// ...just do it.
            this.memory.write(address, ("0" + byteVal.toString(16)).substr(-2));
			krnMemDispDriver.updateDisplay(address, ("0" + byteVal.toString(16)).substr(-2));
        } else { // This is a user-mode process...
			// Get the base address of the requesting process.
			var baseAddr = this.memoryMap[_ActiveProcess.PID][0];
			// Verify that the process has access to the requested address.
			if (this.rangeCheck(baseAddr + address)) {
				// Add the baseAddr to the address and perform the write.
				this.memory.write(baseAddr + address, ("0" + byteVal.toString(16)).substr(-2));
				krnMemDispDriver.updateDisplay(baseAddr + address, ("0" + byteVal.toString(16)).substr(-2));
			} else { // The range check failed.
				_KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ERROR_IRQ, [ACCESS_VIOLATION_ERROR, _ActiveProcess.PID]));
			}
		}
    };

    /**
     * Reads the specified byte-values from main memory.
     *
     * Assumptions:
     *      The address + offset + nBtyes is within the requesting processes address space.
     *
     * @param address the memory address where the read operation begins
     * @param offset an integer specifying the offset from the specified address
     */
    this.read = function(address, offset) {
        if (_Mode === KERNEL_MODE) { // This is a kernel-mode process...
			// ...just do it.
            return this.memory.readByte(address + offset);
        } else { // This is a user-mode process
			// Get the base address of the requesting process.
			var baseAddr = this.memoryMap[_ActiveProcess.PID][0];
			// Verify that the process has access to the requested address.
			if (this.rangeCheck(baseAddr + address)) {
				// Add the baseAddr to the address and perform the write.
				return this.memory.readByte(baseAddr + address + offset);
			} else { // The range check failed.
				_KernelInterruptQueue.enqueue(new Interrupt(MEMORY_ERROR_IRQ, [ACCESS_VIOLATION_ERROR, _ActiveProcess.PID]));
			}
		}
    };

    /**
     * Allocates a block of 256 bytes to the process specified by pid and returns the address of the first free byte.
     *
     * @param pid the process id of the requesting process
     */
    this.allocate = function(pid) {
        // Determine if there is any free memory.
        if (this.freeList.length != 0) {
            // Get the start and end address of the range.
            var freeRange = this.freeList.shift();
            // Associate the PID with the address range.
            this.memoryMap[pid] = freeRange;
            // Return the first address of the range.
            return freeRange[0];
        } else { // If there is no free memory than return an out_of_memory error code.
			return OUT_OF_MEMORY_ERROR;
        }
    };

    /**
     * Frees the memory associated with the specified PID.
     *
     * @param pid the owning process
     */
    this.deallocate = function(pid) {
        // Get the address range allocated to this memory block.
        var range = this.memoryMap[pid];
        // Verify that a mapping exists for the specified PID.
        if (typeof range != 'undefined') {
            // Delete this entry from the memory map.
            delete this.memoryMap[pid];
            // Clear the memory held by this process.
            this.memory.clear(range[0], range[1]);
            // Add the newly freed block to the free list.
            this.freeList.unshift(range);
        }
    };

    /**
     * Determines whether the specified address is within the address space of the currently executing process.
     *
     * @param address the memory address of the request
     * @returns {boolean}
     */
    this.rangeCheck = function(address) {
        if (_ActiveProcess != null) {
            return (address >= _ActiveProcess.BASE_ADDRESS) && (address <= _ActiveProcess.LIMIT);
        } else {
            alert("Range check failed due to null _ActiveProcess.")// TODO: Range check on a non-existent PID will always fail.
        }
    }
}