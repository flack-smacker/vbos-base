/* ----------------------------------
 DeviceDriverMemoryDisplay.js

 Requires deviceDriver.js

 The Memory Display Device Driver.
 ---------------------------------- */

DeviceDriverMemoryDisplay.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js.

function DeviceDriverMemoryDisplay() { // Add or override specific attributes and method pointers

    // Override the base method pointers.
    this.driverEntry = krnMemDispDriverEntry;

    // "Constructor" code.
    this.DISPLAY_WIDTH = 8;  // Each row displays eight bytes.
    this.ROW_STEP_VALUE = 8; // Used to calculate the value of the label - which is the first column in the table.
}

function krnMemDispDriverEntry() {
    initializeDisplay();
    this.status = "loaded";
}

/**
 * Initializes the memory display by writing out the row labels and setting each row to the default value of "00".
 */
function initializeDisplay() {

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


function refreshDisplay() {

    var nRows = _memoryDisplayDevice.rows.length;

    for (var i=0, j=0; i < nRows && j < _MainMemory.bytes.length; i+=1) {
        var rowData = _memoryDisplayDevice.rows[i].cells;

        for (var x=1; x < rowData.length; x+=1, j+=1) {
            var data = _MainMemory.bytes[j];
            rowData[x].innerHTML = data;
        }
    }
}

/**
 * Resets all displayed memory cells to "00".
 */
function resetDisplay() {
    var nRows = _memoryDisplayDevice.rows.length;

    for (var i=0; i < nRows; i+=1) {
        var currentRow = _memoryDisplayDevice.rows[i];

        for (var j=1; j < currentRow.children.length; j+=1) {
            currentRow.children[j].innerHTML = "00";
        }
    }
}