/**
 * A hardware simulation of a HDD.
 * Created by Joe Muro on 11/26/13. 
 **/

function HDD() {
    
	/* Variables */
	this.storage = null;
	
	/* Device Constants */
	this.N_TRACKS = 4; // The number of physical tracks.
	this.N_SECTORS = 8; // The number of sectors per track.
	this.N_BLOCKS = 8; // The number of blocks per sector.
	this.BLK_SZ_BYTES = 64; // // The number of bytes per block.
	
	/**
	 * Mounts the hard-disk drive.
	 */
	if (is_html5_storage_supported()) {
		this.storage = window.localStorage;
	} else {
		alert("Unable to mount hard-disk drive.\n HTML5 local storage is not supported on this browser.");
		this.storage = null;
	}
	
	/**
	 * Returns 64-bytes of data located at the specifed <track, sector, block>.
	 */
	this.read = function(track, sector, block) {
		var location = track + sector + block;
		return this.storage[location].substr(0, this.BLK_SZ_BYTES);
	};
	
	/**
	 * Writes the specified data to the specified <track, sector, block>.
	 */
	this.write = function(track, sector, block, data) {
		var location = track + sector + block;
		this.storage[location] = data.substr(0, this.BLK_SZ_BYTES);
	};
	
	/**
	 * Clears all formatting and user data from this drive.
	 */
	this.wipe = function() {
		this.storage.clear();
	};
}