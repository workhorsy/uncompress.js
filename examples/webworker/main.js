// Copyright (c) 2015 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
// This software is licensed under a MIT License
// https://github.com/workhorsy/uncompress.js

var entryList = null;

function toFriendlySize(size) {
	if (size >= 1024000000) {
		return (size / 1024000000).toFixed(2) + ' GB';
	} else if (size >= 1024000) {
		return (size / 1024000).toFixed(2) + ' MB';
	} else if (size >= 1024) {
		return (size / 1024).toFixed(2) + ' KB';
	} else if (size >= 1) {
		return (size / 1).toFixed(2) + ' B';
	} else if (size === 0) {
		return '0 B';
	}

	return '?';
}

window.onload = function() {
	entryList = document.getElementById('entryList');

	// Create the web worker
	var worker = new Worker('worker.js');
	worker.onmessage = function(e) {
		switch (e.data.action) {
			case 'uncompress_each':
				var file_name = e.data.file_name;
				var url = e.data.url;
				var size = e.data.size;

				// Add a BR to the document
				entryList.appendChild(document.createElement('br'));

				// Add a link to the Object URL
				var a = document.createElement('a');
				a.href = '#' + file_name;
				a.innerHTML = file_name + ' (' + toFriendlySize(size) + ')';
				a.addEventListener('click', function(e) {
					var img = document.getElementById('currentImage');
					img.src = url;
				});

				entryList.appendChild(a);
				break;
			case 'invalid_file':
				entryList.innerHTML = e.data.error;
				break;
		}
	};

	// Try loading each archive that is selected
	document.getElementById('fileInput').onchange = function() {
		// Just return if there is no file selected
		var file_input = document.getElementById('fileInput');
		if (file_input.files.length === 0) {
			entryList.innerHTML = 'No file selected';
			return;
		}
		entryList.innerHTML = '';

		// Remove any loaded image
		window.location.hash = '';
		document.getElementById('currentImage').src = '';

		// Get the file's info
		var file = file_input.files[0];
		var blob = file.slice();
		var file_name = file.name;

		// Convert the blob into an array buffer
		var reader = new FileReader();
		reader.onload = function(evt) {
			var array_buffer = reader.result;

			// Send the file name and array buffer to the web worker
			var message = {
				action: 'uncompress_start',
				file_name: file_name,
				array_buffer: array_buffer
			};
			worker.postMessage(message);
		};
		reader.readAsArrayBuffer(blob);
	};
};
