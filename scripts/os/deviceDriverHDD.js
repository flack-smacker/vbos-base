/* ----------------------------------
   DeviceDriverHDD.js
   
   Requires deviceDriver.js
   
   The HDD Device Driver.
   ---------------------------------- */

DeviceDriverHDD.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js

function DeviceDriverHDD() { // Add or override specific attributes and method pointers.
    
    this.driverEntry = function() {
		// Initialization routine for this, the kernel-mode Keyboard Device Driver.
		this.status = "loaded";
	};
	
	/* Variables. */
	this.isFormatted = false; // Indicates whether the file system has been formatted.
	this.usedBlocks = 0; // Tracks the number of data blocks currently holding user data.
	
	/* Data Constants. */
	this.AVAILABLE = 0; // Indicates an unused block.
	this.UNAVAILABLE = 1; // Indicates a block containing user data.
	this.NULL_ADDRESS = '---'; // Used to indicate a null block address.
	this.NULL_TERMINATOR = '\!';
	
	/* Device Constants */
	this.N_TRACKS = 4; // The number of physical tracks.
	this.N_SECTORS = 8; // The number of sectors per track.
	this.N_BLOCKS = 8; // The number of blocks per sector.
	this.BLK_SZ_BYTES = 64; // // The number of bytes per block.
	
	// The number of blocks available to the user for storing data.
	// The first track is used to store file system meta-data.
	this.N_DATA_BLOCKS = (this.N_TRACKS - 1) * this.N_SECTORS * this.N_BLOCKS;

	this.format = function() {
		
		for (var i=0; i < this.N_TRACKS; i+=1) {
			for (var j=0; j < this.N_SECTORS; j+=1) {
				for (var k=0; k < this.N_BLOCKS; k+=1) {
					_HDD[''+i+j+k] = this.AVAILABLE + this.NULL_ADDRESS + this.NULL_TERMINATOR;
				}
			}
		}
		// Intialize the MBR with the address of the first free directory entry.
		_HDD['000'] = this.UNAVAILABLE + '001' + 'VBOS-FS-V1';
		
		// Indicate a formatted file system.
		this.isFormatted = true;
	};

	this.doRead = function(track, sector, block) {
		return _HDD[track+sector+block].substr(0, BLK_SZ_BYTES);
	};

	this.doWrite = function(track, sector, block, nbytes, data) {
		_HDD[track+sector+block] = data; 
	};

	this.doWipe = function() {
		_HDD.clear();
	};
}
