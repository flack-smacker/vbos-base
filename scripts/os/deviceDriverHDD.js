/* ----------------------------------
   DeviceDriverHDD.js
   
   Requires deviceDriver.js
   
   The HDD Device Driver.
   ---------------------------------- */

DeviceDriverHDD.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js

function DeviceDriverHDD() { // Add or override specific attributes and method pointers.
    // Override the base method pointers.
    this.driverEntry = krnHDDDriverEntry;
	
	this.N_TRACKS = 4; // The number of physical tracks.
	this.N_SECTORS = 8; // The number of sectors.
	this.N_BLOCKS = 8; // The number of blocks.
	this.BLK_SZ_BYTES = 64; // // The size of each block in bytes.
}

function krnHDDDriverEntry() {
    // Initialization routine for this, the kernel-mode Keyboard Device Driver.
    this.status = "loaded";
}

function read(track, sector, block) {
	return _HDD[track+sector+block].substr(0, BLK_SZ_BYTES);
}

function write(track, sector, block, nbytes, data) {
	_HDD[track+sector+block] = data; 
}

function wipe() {
	_HDD.clear();
}