/** A hardware simulation of physical memory **/
/** Created by Joe Muro on 9/30/13. **/

/**
 * Constructs a new memory unit with the specified number of bytes.
 *
 * @param size the number of bytes in this memory unit
 * @constructor
 */
function MainMemory(size) {
    this.bytes = new Array(size); // Memory is implemented with an array.

    /**
     * Returns the byte at the specified memory address.
     *
     * @param atAddress a non-negative integer representing an address
     * @returns {the contents of the specified memory address}
     */
    this.readByte = function(address) {
        return this.bytes[address];
    };

    /**
     * Returns a block of <code>numBytes</code> bytes beginning from the specified start address.
     *
     * @param atAddress a non-negative integer representing an address
     * @param numBytes a non-negative integer
     * @returns {Array}
     */
    this.readBytes = function(address, numBytes) {
        var byteSequence= [];

        for (var offset = 0; offset < numBytes; offset += 1) {
            byteSequence.push(this.readByte(address + offset));
        }

        return byteSequence;
    };

    /**
     * Stores the specified value at the specified memory address.
     *
     * @param address a non-negative integer representing an address
     * @param value the value to be stored in memory
     */
    this.write = function(address, value) {
        this.bytes[address] = value;
    };

    /**
     * Clears the contents of main memory to 0.
     */
    this.clear = function() {
        for (var i = 0; i < this.bytes.length; ++i) {
            this.bytes[i] = "00";
        }
    };
}