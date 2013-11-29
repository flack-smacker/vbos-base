/**
 * A* hardware simulation of a HDD.
 * Created by Joe Muro on 11/26/13. 
 **/

DeviceDriverHDD.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js
 
function DeviceDriverHDD() {
    
	/* Variables */
	this.drive = null;
	
	/* Device Constants */
	this.N_TRACKS = 4; // The number of physical tracks.
	this.N_SECTORS = 8; // The number of sectors per track.
	this.N_BLOCKS = 8; // The number of blocks per sector.
	this.BLK_SZ_BYTES = 64; // // The number of bytes per block.
	
	/**
	 * Initialization routine called by the kernel-bootstrap routine.
	 */
	this.driverEntry = function() {
		/** Mounts the hard-disk drive. */
		if (is_html5_storage_supported()) {
			this.drive = window.localStorage;
			// Start with a clean drive.
			this.wipe();
			// Indicate successful load.
			this.status = "loaded";
		} else {
			alert("Unable to mount hard-disk drive.\n HTML5 local storage is not supported on this browser.");
			this.drive = null;
		}
	};
	
	/**
	 * Returns 64-bytes of data located at the specifed <track, sector, block>.
	 */
	this.read = function(track, sector, block) {
		var location = track + sector + block;
		return this.drive[location].substr(0, this.BLK_SZ_BYTES);
	};
	
	/**
	 * Writes the specified data to the specified <track, sector, block>.
	 */
	this.write = function(track, sector, block, data) {
		var location = track + sector + block;
		this.drive[location] = data.substr(0, this.BLK_SZ_BYTES);
	};
	
	/**
	 * Clears all formatting and user data from this drive.
	 */
	this.wipe = function() {
		this.drive.clear();
	};
}