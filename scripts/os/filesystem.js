/* ----------------------------------
   FileSystem.js
   
   The kernel module responsible for implementing and managing the file system.
   ---------------------------------- */

function FileSystem() {
	
	/* Variables. */
	this.isFormatted = false; // Indicates whether the drive has been formatted.
	this.usedBlocks = 0; // Tracks the number of data blocks currently holding user data.
	this.nFiles = 0; // Tracks the number of files stored by this file system.
	this.fileIndex = {};
	this.freeList = new Queue();
	
	/* Data Constants. */
	this.FREE = '0'; // Indicates an unused block.
	this.USED = '1'; // Indicates a block containing user data.
	this.ADDRESS_BEGIN = 1; // Represents the offset into a data block where the next pointer exists.
	this.ADDRESS_LENGTH = 3; // Represents the length of the next pointer stored at each data block.
	this.DATA_BEGIN = 1; // Represents the offset into a data block where the user data is stored.
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
		
		this.fileIndex = {}; // Clear the file index.
		this.freeList = new Queue(); // Start with a new free list.
	
		for (var i=0; i < krnHddDriver.N_TRACKS; i+=1) {
			for (var j=0; j < krnHddDriver.N_SECTORS; j+=1) {
				for (var k=0; k < krnHddDriver.N_BLOCKS; k+=1) {
					krnHddDriver.write( // Write over the block
							i.toString(), j.toString(), k.toString(), // Reinitialize metadata...
							this.FREE + this.NULL_ADDRESS + this.NULL_TERMINATOR // ...and data.
					);
					if (i > 0) { // Add this data block to the free list.
						this.freeList.enqueue(i.toString() + j.toString() + k.toString());
					}
				}
			}
		}
		
		// Intialize the MBR with the address of the first free directory entry.
		krnHddDriver.write('0', '0', '0', this.USED + '001' + 'VBOS-FS-V1');
		
		// Indicate a formatted file system.
		this.isFormatted = true;
	};
	
	this.create = function(filename) {
		
		// Check if this file already exists.
		if (typeof this.fileIndex[filename] !== 'undefined') {
			_StdOut.putText("File creation failed. '" + filename + "' already exists.");
			return;
		}
		
		// Find a free directory entry to store the file.
		var location = krnHddDriver.read('0', '0', '0').substr(1,3);
		
		// Find a free data block to store the newly created file's data.
		var dataBlkAddr = this.freeList.dequeue();
		
		if (dataBlkAddr === null) {
			_StdOut.putText("File creation failed.");
			_StdOut.putText("Insufficient storage. Try deleting unnecessary files using the delete command.");
			return;
		}
		
		// We found a free directory entry so mark it used and record the filename.
		var entry = this.USED + dataBlkAddr + filename + this.NULL_TERMINATOR;
		krnHddDriver.write(location[0], location[1], location[2], entry);
		
		// Add this entry to the file index to speed-up access times.
		this.fileIndex[filename] = location;
		
		// Track usage statistics.
		this.nFiles += 1;
		
		// Indicate success.
		_StdOut.putText("File '" + filename + "' created. ");
	}
	
	this.read = function(filename) {
	
		// Get the address of the directory entry for this file from the file index.
		var location = this.fileIndex[filename];
		
		// Check if this file exists.
		if (typeof location  === 'undefined') {
			return null;
		}
		
		// Get the directory entry for the file.
		var entry = krnHddDriver.read(location[0], location[1], location[2]);
		
		// Get the address of the first data block.
		var dataBlkAddr = entry.substr(this.ADDRESS_BEGIN, this.ADDRESS_LENGTH);
		var buffer = '';
		
		// Follow the chain of data blocks, storing the data portion in a buffer.
		while (dataBlkAddr !== this.NULL_ADDRESS) {
			
			// Get the data at this block.
			var data = krnHddDriver.read(dataBlkAddr[0], dataBlkAddr[1], dataBlkAddr[2]);
			// Store it in the buffer.
			buffer += data.substr(this.DATA_BEGIN);
			// Get the address of the next data block.
			dataBlkAddr = data.substr(this.ADDRESS_BEGIN, this.ADDRESS_LENGTH);
		}
		
		return buffer;
	}
	
	this.write = function(filename, data) {
	
		// Get the address of the directory entry for this file from the file index.
		var location = this.fileIndex[filename];
		
		// Check if this file exists.
		if (typeof location  === 'undefined') {
			_StdOut.putText("Could not write to '" + filename + "'. The file does not exist.");
			return;
		}
	}
	
	this.deleteFile = function(filename) {
		
		// Get the address of the directory entry for this file from the file index.
		var location = this.fileIndex[filename];
		
		// Check if this file exists.
		if (typeof location  === 'undefined') {
			_StdOut.putText("File delete failed. '" + filename + "' does not exist.");
			return;
		}
		
		// Get the directory entry for the file.
		var entry = krnHddDriver.read(location[0], location[1], location[2]);
		
		// Get the address of the first data block.
		var dataBlkAddr = entry.substr(this.ADDRESS_BEGIN, this.ADDRESS_LENGTH);
		
		// Follow the chain of data blocks and mark them all as free.
		while (dataBlkAddr !== this.NULL_ADDRESS) {
			
			// Get the data at this block.
			var data = krnHddDriver.read(dataBlkAddr[0], dataBlkAddr[1], dataBlkAddr[2]);
			// Mark this block as free.
			krnHddDriver.write(dataBlkAddr[0], dataBlkAddr[1], dataBlkAddr[2], this.FREE + this.NULL_ADDRESS + this.NULL_TERMINATOR)
			// Add this block to the free list.
			this.freeList.enqueue(dataBlkAddr);
			// Get the address of the next data block.
			dataBlkAddr = data.substr(this.ADDRESS_BEGIN, this.ADDRESS_LENGTH);
		}
		
		// Clear the metadata for this file.
		krnHddDriver.write(
			location[0], location[1], location[2], 
			this.FREE + this.NULL_ADDRESS + this.NULL_TERMINATOR
		);
		
		// Remove this entry from the file index.
		delete this.fileIndex[filename];
		
		// Track usage statistics.
		this.nFiles -= 1;
		
		// Indicate success.
		_StdOut.putText("File '" + filename + "' deleted. ");
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