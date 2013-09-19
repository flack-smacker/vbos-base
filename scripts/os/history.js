/* ------------
   history.js

	Provides the command history recall functionality.

   ------------ */

function HistoryList() {

	// a data structure for storing commands
	this.cmdList = new Array();

	// an index to the current command
	this.currentPtr = 0;

	this.saveCommand = function(cmd) {
		// check if the command to be added is the same as the last command.
		//   There is no reason to have the same command listed twice in a row.
		if (this.cmdList[this.cmdList.length-1] != cmd) {
			this.cmdList.push(cmd);
			this.currentPtr = this.cmdList.length-1;
		}
	}

	this.searchUp = function() {
		// Check if there are any commands in the history.
		if (this.cmdList.length == 0) {
			return "";
		} else {
			// Return the current command
			var retVal = this.cmdList[this.currentPtr];
			// Move the history pointer to the left
			//  unless it is already at the beginning.
			if (this.currentPtr != 0) {
				this.currentPtr -= 1;
			}
			return retVal;
		}
	};

	this.searchDown = function() {
		if (this.cmdList.length == 0) {
			return "";
		} else {
			var retVal = this.cmdList[this.currentPtr];
			// Move the history pointer to the left
			//  unless it is already at the end.
			if (this.currentPtr != this.cmdList.length-1) {
				this.currentPtr += 1;
			}
			return retVal;
		}
	};
}