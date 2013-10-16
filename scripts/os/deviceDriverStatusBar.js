/* ----------------------------------
   deviceDriverStatusBar.js
   
   Requires deviceDriver.js
   
   The device driver for the status bar hardware device.
   ---------------------------------- */

DeviceDriverStatusBar.prototype = new DeviceDriver;  // "Inherit" from prototype DeviceDriver in deviceDriver.js.

function DeviceDriverStatusBar()                     // Add or override specific attributes and method pointers.
{
    // "subclass"-specific attributes.
    // this.buffer = "";    // TODO: Do we need this?
    // Override the base method pointers.
    this.driverEntry = krnStatusBarDriverEntry;
    this.isr = null;
    // "Constructor" code.
	this.timerID = null;
	this.font = null; 
}

function krnStatusBarDriverEntry() {
    // Initialization routine for the kernel-mode Status Bar Device Driver.
    this.status = "loaded";
	this.timerID = setInterval(updateClockDisplay, 1000);
    updateStatusMessage("RUNNING");
}

// Write a status message.
function updateStatusMessage(msg) {
	_statusBar.clearRect(0, 0, 305, 25)
	_statusBar.font = "normal 15px monospace";
	_statusBar.strokeText("SYSTEM STATUS: " + msg.substring(0,18).toUpperCase(), 0, 20);
}

// Updated the date/time portion of the display.
function updateClockDisplay() {
	_statusBar.clearRect(305, 0, 500, 25);
	_statusBar.font = "normal 15px monospace";
	_statusBar.strokeText(getFormattedDateString(), 300, 20);
}

function getFormattedDateString() {
	// What time is it?
	var now = new Date();
	// Build a date formatted as mm/dd/YYYY 
	var dateString = "";
	dateString += now.getMonth() + 1;
	dateString += "/" + now.getDate();
	dateString += "/" + now.getFullYear();
	// ...then append the current time.
	dateString += " " + now.toLocaleTimeString();
	// return the goods
	return dateString;
}