/* --------  
   Utils.js

   Utility functions.
   -------- */

function trim(str) {     // Use a regular expression to remove leading and trailing spaces.
	return str.replace(/^\s+ | \s+$/g, "");
	/* 
	Huh?  Take a breath.  Here we go:
	- The "|" separates this into two expressions, as in A or B.
	- "^\s+" matches a sequence of one or more whitespace characters at the beginning of a string.
    - "\s+$" is the same thing, but at the end of the string.
    - "g" makes is global, so we get all the whitespace.
    - "" is nothing, which is what we replace the whitespace with.
	*/
	
}

function rot13(str) {   // An easy-to understand implementation of the famous and common Rot13 obfuscator.
                        // You can do this in three lines with a complex regular expression, but I'd have
    var retVal = "";    // trouble explaining it in the future.  There's a lot to be said for obvious code.
    for (var i in str) {
        var ch = str[i];
        var code = 0;
        if ("abcedfghijklmABCDEFGHIJKLM".indexOf(ch) >= 0) {
            code = str.charCodeAt(i) + 13;  // It's okay to use 13.  It's not a magic number, it's called rot13.
            retVal = retVal + String.fromCharCode(code);
        } else if ("nopqrstuvwxyzNOPQRSTUVWXYZ".indexOf(ch) >= 0) {
            code = str.charCodeAt(i) - 13;  // It's okay to use 13.  See above.
            retVal = retVal + String.fromCharCode(code);
        } else {
            retVal = retVal + ch;
        }
    }
    return retVal;
}

function is_html5_storage_supported() {
	  try {
		return 'localStorage' in window && window['localStorage'] !== null;
	  } catch (e) {
		return false;
	  }
}

function showPartition(event, n) {
	
	/** Highlight the selected tab. **/
	var links = document.getElementById('memoryDisplay').getElementsByTagName('a');
	
	// Reset all unselected tabs back to the 'unselected' color.
	for (var i=0; i < links.length; i+=1) {
		links[i].style.color = 'black';
	}
	// Mark the selected tab.
	event.target.style.color = 'red';
	
	// Display the selected tab. 
	var partitionId = 'partition' + n;
	
	var tables = document.getElementById('memoryDisplay').getElementsByTagName('table');
	
	for (var i=0; i < tables.length; i+=1) { 
		if (tables[i].id === partitionId) {
			tables[i].style.display = 'inline';
		} else {
			tables[i].style.display = 'none';
		}
	}
}

