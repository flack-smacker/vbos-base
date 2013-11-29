/* ----------------------------------
   FileSystem.js
   
   The kernel module responsible for implementing and managing the file system.
   ---------------------------------- */

function FileSystem() {
	
	/* Variables. */
	this.isFormatted = false; // Indicates whether the file system has been formatted.
	this.usedBlocks = 0; // Tracks the number of data blocks currently holding user data.
	this.nFiles = 0; // Tracks the number of files stored by this file system.
	this.fileIndex = {};
	this.freeList = new Queue();
	
	/* Data Constants. */
	this.FREE = '0'; // Indicates an unused block.
	this.USED = '1'; // Indicates a block containing user data.
	this.NULL_ADDRESS = '---'; // Used to indicate a null block address.
	this.NULL_TERMINATOR = '\\0'; // Indicates the end of the data portion of a block.
	this.DIRECTORY_TRACK = '0'; // Represents the track containing the file metadata.
	this.BLOCK_STATUS_BYTE = '0' // Represents the index where the status byte is located.
	
	// The number of blocks available to the user for storing data.
	// The first track is used to store file system meta-data.
	this.N_DATA_BLOCKS = (krnHddDriver.N_TRACKS - 1) * krnHddDriver.N_SECTORS * krnHddDriver.N_BLOCKS;
	
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
		
		for (var i=0; i < krnHddDriver.N_TRACKS; i+=1) {
			for (var j=0; j < krnHddDriver.N_SECTORS; j+=1) {
				for (var k=0; k < krnHddDriver.N_BLOCKS; k+=1) {
					krnHddDriver.write(
							i.toString(), j.toString(), k.toString(), // Location...
							this.FREE + this.NULL_ADDRESS + this.NULL_TERMINATOR // Data...
					);
				}
			}
		}
		
		// Intialize the MBR with the address of the first free directory entry.
		krnHddDriver.write('0', '0', '0', this.USED + '001' + 'VBOS-FS-V1');
		
		// Indicate a formatted file system.
		this.isFormatted = true;
	};
	
	this.create = function(filename) {
		// Find a free directory entry to store the file.
		var location = this.findFree();
		
		// Check if a free location was found.
		if (location == null) {
			return false;
		}
		
		// We found a free entry so create the data.
		var entry = this.USED + this.NULL_ADDRESS + filename.toUpperCase() + this.NULL_TERMINATOR;
		
		// Peform the write.
		krnHddDriver.write(location[0], location[1], location[2], entry);
		
		// Track usage statistics.
		this.nFiles += 1;
		
		// Indicate success.
		return true;
	}
	
	this.read = function(filename) {
		
	}
	
	/**
	 *
	 */
	this.write = function(filename, data) {
	
	
	}
	
	/**
	 *
	 */
	this.deleteFile = function(filename, data) {
	
	
	}
	
	/**
	 * Returns a triple containing the <track,sector,block> of an available directory entry.
	 * Returns null if the directory is full.
	 */
	this.findFree = function() {
		// Iterate through each block in the file system directory until a free entry is found.
		for (var sec=0; sec < krnHddDriver.N_SECTORS; sec+=1) {
			for (var blk=0; blk < krnHddDriver.N_BLOCKS; blk+=1) {
				// Read in the metadata.
				var entry = krnHddDriver.read(this.DIRECTORY_TRACK, sec, blk);
				// Check if this block is free.
				if (entry.charAt(this.BLOCK_STATUS_BYTE) === this.FREE) {
					return [this.DIRECTORY_TRACK, sec, blk];
				}
			}
		}
		// There are no free directory entries. 
		return null;
	}
	
	/**
	 * Returns a triple containing the <track,sector,block> of an available data block.
	 * Returns null if no data blocks are available.
	 */
	this.findFreeDataBlock = function() {
		// Iterate through each block in the file system directory until a free entry is found.
		for (var trk=1; trk < krnHddDriver.N_TRACKS; trk+=1) {
			for (var sec=0; sec < krnHddDriver.N_SECTORS; sec+=1) {
				for (var blk=0; blk < krnHddDriver.N_BLOCKS; blk+=1) {
					// Read in the metadata.
					var entry = krnHddDriver.read(this.DIRECTORY_TRACK, sec, blk);
					// Check if this block is free.
					if (entry.charAt(this.BLOCK_STATUS_BYTE) === this.FREE) {
						return [this.DIRECTORY_TRACK, sec, blk];
					}
				}
			}
		}
		// There are no free directory entries. 
		return null;
	}
	
	/**
	 * Searches the file directory for the specified filename and returns the
	 * <track, sector, block> in the directory where the file is located.
	 * Returns null if the file does not exist within the directory.
	 */
	this.findFile = function(filename) {
		// Iterate through each block in the file system directory until the filename is found.
		for (var sec=0; sec < krnHddDriver.N_SECTORS; sec+=1) {
			for (var blk=0; blk < krnHddDriver.N_BLOCKS; blk+=1) {
				// Read in the metadata.
				var entry = krnHddDriver.read(this.DIRECTORY_TRACK, sec, blk);
				// Check if this block is used.
				if (entry.charAt(this.BLOCK_STATUS_BYTE) === this.USED) {
					var fName = entry.substr(4).split(this.NULL_TERMINATOR)[0]; 
					if (fName === filename) {
						return [this.DIRECTORY_TRACK, sec, blk];
					}
				}
			}
		}
		// The file does not exist.
		return null;
	}
}