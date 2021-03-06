/* ----------------------------------
 DeviceDriverMemoryDisplay.js

 Requires deviceDriver.js

 The Memory Display Device Driver.
 ---------------------------------- */

DeviceDriverMemoryDisplay.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js.

function DeviceDriverMemoryDisplay() { // Add or override specific attributes and method pointers

    // "Constructor" code.
    this.DISPLAY_WIDTH = 8;  // Each row displays eight bytes.
    this.ROW_STEP_VALUE = 8; // Used to calculate the value of the label - which is the first column in the table.

	// Override the base method pointers.
    this.driverEntry = function() {
		this.initializeDisplay();
		this.status = "loaded";
	}
	
	/**
	* Initializes the memory display by writing out the row labels and setting each row to the default value of "00".
	*/
	this.initializeDisplay = function() {

		var partitions = _memoryDisplayDevice.getElementsByTagName('table');
	
		for (var i=0; i < partitions.length; i+=1) {
			// The outer for loop is responsible for creating the row and initializing the row label.
			for (var j=0; j < ADDRESS_SPACE_MAX; j += 8) {
				// Insert a new row into the table.
				var jthRow = partitions[i].insertRow(-1);
				// Initialize the first cell in the row with a label.
				var label = jthRow.insertCell(-1);
				label.innerHTML = "0x" + ("0" + j.toString(16).toUpperCase()).substr(-2); // Pads each label.
				label.style.fontWeight = "900"; // Differentiates the label cells from the data cells.
				//The inner for loop initializes each cell in the row to "00".
				for (var k=0; k < 8; k++) {
					var dataCell = jthRow.insertCell(-1);
					dataCell.innerHTML = "00";
				}
			}
		}
	}


	this.updateDisplay = function(address, value) {

		// Get the table to which this address belongs. (0, 1, or 2)
		var id = Math.floor(address / ADDRESS_SPACE_MAX);
		
		// Translate the absolute address to a relative address.
		address = address % ADDRESS_SPACE_MAX;
		
		// Divide by eight to calculate the row.
		var rowAddr =  Math.floor(address / this.DISPLAY_WIDTH);
		
		// Mod eight to calculate the offset into the row.
		// Add one to account for the row header.
		var offset = (address % this.DISPLAY_WIDTH) + 1;
		
		// Use the calculated id to get the appropriate HTML element. 
		var table = document.getElementById('partition' + id);

		// Get the rows in this table.
		var row = table.rows.item(rowAddr);
		
		// Update the value.
		row.cells[offset].innerHTML = value;
	}
}