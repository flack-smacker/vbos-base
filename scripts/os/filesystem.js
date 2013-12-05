/* ----------------------------------
   FileSystem.js
   
   The kernel module responsible for implementing and managing the file system.
   ---------------------------------- */

function FileSystem() {
	
	/* Variables. */
	this.isFormatted = false; // Indicates whether the drive has been formatted.
	this.usedBlocks = 0; // Tracks the number of data blocks currently holding user data.
	this.nFiles = 0; // Tracks the number of files stored by this file system.
	this.fileIndex = {}; // Maps filenames to directory track addresses.
	this.freeList = new Queue(); // Contains addresses of free data blocks.
	
	/* Data Constants. */
	this.FREE = '0'; // Indicates an unused block.
	this.USED = '1'; // Indicates a block containing user data.
	this.ADDRESS_BEGIN = 1; // Represents the offset into a data block where the next pointer exists.
	this.ADDRESS_LENGTH = 3; // Represents the length of the next pointer stored at each data block.
	this.DATA_BEGIN = 4; // Represents the offset into a data block where the user data is stored.
	this.NULL_ADDRESS = '---'; // Used to indicate a null block address.
	this.NULL_TERMINATOR = '\\0'; // Indicates the end of the data portion of a block.
	this.DIRECTORY_TRACK = '0'; // The track containing the file metadata.
	this.BLOCK_STATUS_BYTE = '0' // The index where the status byte is located.
	this.BYTES_PER_BLOCK = 60; // The amount of bytes available per block for storing user data.
	this.SWAP_FILE_BEGIN = '100'; // The location of the first block dedicated to the 300-byte swap file.
	this.SWAP_FILE_END = '104'; // The location of the last block dedicated to the swap file.
	
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
		
		// Create the swap file.
		this.initSwapfile(_SwapFile);
		
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
		var location = this.findFree();
		
		// Check if there exists a free location for this file.
		if (!location) {
			_StdOut.putText("Could not create file - insufficient storage.");
			_StdOut.putText("Use the \'delete\' command to free up storage.");
			return;	
		}
		
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
		this.usedBlocks += 1;
		
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
			// Store the user data portion in a buffer.
			buffer += data.substr(this.DATA_BEGIN).split(this.NULL_TERMINATOR)[0];
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
			_StdOut.putText("Use the \'create\' command to create a new file.");
			return;	
		}
		
		// Get the directory entry for the file.
		var entry = krnHddDriver.read(location[0], location[1], location[2]);
		// Get the address of the first free data block.
		var freeBlk = entry.substr(this.ADDRESS_BEGIN, this.ADDRESS_LENGTH);
		
		// Calculate the number of additional blocks required to store the data.
		var nBlocks = Math.floor(data.length / this.BYTES_PER_BLOCK);
		
		// Check if there is sufficient storage for this data.
		if (nBlocks > this.freeList.getSize()) {
			_StdOut.putText("File write failed. Insufficient storage.");
			_StdOut.putText("Use the delete command to free up space.");
			return;
		}
		
		// Allocate the required storage up front.
		// This will make it easier to chain the data blocks together.
		var blockPtrs = [];
		// The address of the first free block is in the directory entry.
		blockPtrs[0] = freeBlk; 
		for (var i = 1; i < (nBlocks + 1); i+=1) {
			blockPtrs[i] = this.freeList.dequeue();
			this.usedBlocks += 1;
		}
		// The next pointer for the last block in the chain should be null.
		blockPtrs[blockPtrs.length] = this.NULL_ADDRESS;
		
		
		var dataOffset = 0;
		var buffer = '';
		var blkAddr = '';
		var nextPtr = '';
		// Perform the write, chaining the data blocks as we go.
		for (var i=0; i < (blockPtrs.length - 1); i+=1) {
			// Grab the free block address.
			blkAddr = blockPtrs[i];
			// Grab the pointer to the next free block address.
			nextPtr = blockPtrs[i+1];
			// Fill the buffer with 60 bytes of data.
			buffer = data.substr(dataOffset, this.BYTES_PER_BLOCK);
			// Write 60 bytes to the current block.
			krnHddDriver.write(blkAddr[0], blkAddr[1], blkAddr[2], this.USED + nextPtr + buffer);
			// Increate the offset
			dataOffset += this.BYTES_PER_BLOCK;
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
			// Track block usage.
			this.usedBlocks -= 1;
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
	
	this.initSwapfile = function(filename) {
	
		// Create a directory entry for the swap file.
		var entry = this.USED + this.SWAP_FILE_BEGIN + filename + this.NULL_TERMINATOR;
		krnHddDriver.write('0', '7', '7', entry);
		
		// Add this entry to the file index to speed-up access times.
		this.fileIndex[filename] = '077';
		
		// Allocate five blocks for the swap file.
		var data_blocks = [];
		for (var i=0; i < 5; i+=1) {
			data_blocks[i] = this.freeList.dequeue();
		}
		krnHddDriver.write('1', '0', '0', this.USED + '101' + this.NULL_TERMINATOR);
		krnHddDriver.write('1', '0', '1', this.USED + '102' + this.NULL_TERMINATOR);
		krnHddDriver.write('1', '0', '2', this.USED + '103' + this.NULL_TERMINATOR);
		krnHddDriver.write('1', '0', '3', this.USED + '104' + this.NULL_TERMINATOR);
		krnHddDriver.write('1', '0', '4', this.USED + '---' + this.NULL_TERMINATOR);
		
		// Track usage statistics.
		this.nFiles += 1;
		this.usedBlocks += 5;
	}
	
	this.writeToSwap = function(data) {
		
		var buffer = '';
	
		// Convert the data from an array to a string.
		for (var offset=0; offset < data.length; offset+=1) {
			buffer += data[offset];
		}
	
		var blkAddr = this.SWAP_FILE_BEGIN;
		var offset = 0;
		
		// Write the data to the swap file.
		while (blkAddr !== this.NULL_ADDRESS) {
			
			var nextBlkAddr = (parseInt(blkAddr) + 1).toString();
			krnHddDriver.write(blkAddr.charAt(0), blkAddr.charAt(1), blkAddr.charAt(2), this.USED + nextBlkAddr + buffer.substr(offset, this.BYTES_PER_BLOCK));
			offset += this.BYTES_PER_BLOCK;
			
			if (nextBlkAddr === this.SWAP_FILE_END) {
				blkAddr = this.NULL_ADDRESS;
			} else {
				blkAddr = nextBlkAddr;
			}
		}
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
					return [this.DIRECTORY_TRACK, sec.toString(), blk.toString()];
				}
			}
		}
		// There are no free directory entries. 
		return null;
	}
}