/* ----------------------------------
   DeviceDriverHDD.js
   
   Requires deviceDriver.js
   
   The HDD Device Driver.
   ---------------------------------- */

DeviceDriverHDD.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js

function DeviceDriverHDD(drive) {
	
	/* Variables. */
	this.isFormatted = false; // Indicates whether the file system has been formatted.
	this.usedBlocks = 0; // Tracks the number of data blocks currently holding user data.
	this.drive = drive;
	
	/* Data Constants. */
	this.AVAILABLE = 0; // Indicates an unused block.
	this.UNAVAILABLE = 1; // Indicates a block containing user data.
	this.NULL_ADDRESS = '---'; // Used to indicate a null block address.
	this.NULL_TERMINATOR = '\\0';
	
	// The number of blocks available to the user for storing data.
	// The first track is used to store file system meta-data.
	this.N_DATA_BLOCKS = (this.drive.N_TRACKS - 1) * this.drive.N_SECTORS * this.drive.N_BLOCKS;

	/**
	 * Initialization routine called by the kernel-bootstrap routine.
	 */
	this.driverEntry = function() {
		// Start with a clean drive.
		this.drive.wipe();
		// Initialization routine for this, the kernel-mode Keyboard Device Driver.
		this.status = "loaded";
	};
	
	/**
	 * Formats the hard drive. 
	 *		- The first block (MBR) is marked as used, and its block pointer 
	 *		  is initialized to the first free directory entry.
	 *	Each remaining block is formatted as follows:
	 * 		- The 'used/unused' flag is marked unused.
	 *		- The block pointer is initialized to the NULL_ADDRESS value.
	 *		- The 60-byte data area is initialized with the NULL_TERMINATOR.
	 */
	this.format = function() {
		
		for (var i=0; i < this.drive.N_TRACKS; i+=1) {
			for (var j=0; j < this.drive.N_SECTORS; j+=1) {
				for (var k=0; k < this.drive.N_BLOCKS; k+=1) {
					this.drive.storage[''+i+j+k] = this.AVAILABLE + this.NULL_ADDRESS + this.NULL_TERMINATOR;
				}
			}
		}
		
		// Intialize the MBR with the address of the first free directory entry.
		this.drive.storage['000'] = this.UNAVAILABLE + '001' + 'VBOS-FS-V1';
		
		// Indicate a formatted file system.
		this.isFormatted = true;
	};
}