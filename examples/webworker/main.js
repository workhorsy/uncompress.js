// Copyright (c) 2017 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
// This software is licensed under a MIT License
// https://github.com/workhorsy/uncompress.js

let entryList = null;

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
	let worker = new Worker('worker.js');
	worker.onmessage = function(e) {
		switch (e.data.action) {
			case 'uncompress_each':
				let file_name = e.data.file_name;
				let url = e.data.url;
				let size = e.data.size;

				// Add a BR to the document
				entryList.appendChild(document.createElement('br'));

				// Add a link to the Object URL
				let a = document.createElement('a');
				a.href = '#' + file_name;
				a.innerHTML = file_name + ' (' + toFriendlySize(size) + ')';
				a.addEventListener('click', function(e) {
					let img = document.getElementById('currentImage');
					img.src = url;
				});

				entryList.appendChild(a);
				break;
			case 'error':
				entryList.innerHTML = '<span style="color: red">' + e.data.error + '</span>';
				break;
		}
	};

	// Try loading each archive that is selected
	document.getElementById('fileInput').onchange = function() {
		// Just return if there is no file selected
		let file_input = document.getElementById('fileInput');
		if (file_input.files.length === 0) {
			entryList.innerHTML = 'No file selected';
			return;
		}
		entryList.innerHTML = '';

		// Remove any loaded image
		window.location.hash = '';
		document.getElementById('currentImage').src = '';

		// Get the file's info
		let file = file_input.files[0];
		let blob = file.slice();
		let file_name = file.name;
		let password = document.getElementById('filePassword').value;

		// Convert the blob into an array buffer
		let reader = new FileReader();
		reader.onload = function(evt) {
			let array_buffer = reader.result;

			// Send the file name and array buffer to the web worker
			let message = {
				action: 'uncompress_start',
				file_name: file_name,
				array_buffer: array_buffer,
				password: password
			};
			worker.postMessage(message);
		};
		reader.readAsArrayBuffer(blob);
	};
};
