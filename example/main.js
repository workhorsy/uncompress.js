// Copyright (c) 2015 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
// This software is licensed under a MIT License
// https://github.com/workhorsy/uncompress.js



function getFileMimeType(file_name) {
	file_name = file_name.toLowerCase();
	if (file_name.endsWith('.jpeg') || file_name.endsWith('.jpg')) {
		return 'image/jpeg';
	} else if (file_name.endsWith('.png')) {
		return 'image/png';
	} else if (file_name.endsWith('.bmp')) {
		return 'image/bmp';
	} else if (file_name.endsWith('.gif')) {
		return 'image/gif';
	} else {
		// Uses jpeg as default mime type
		return 'image/jpeg';
	}
}

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

function onEach(archive, i) {
	// If this is the last entry, close the archive
	if (i >= archive.entries.length) {
		archiveClose(archive);
		return;
	}

	// Read the data for this entry
	var entry = archive.entries[i];
	entry.readData(function(data) {
		// Convert the data into a Object URL
		var blob = new Blob([data], {type: getFileMimeType(entry.name)});
		var url = URL.createObjectURL(blob);

		// Add a br to the document
		document.body.appendChild(document.createElement('br'));

		// Add a link to the Object URL
		var a = document.createElement('a');
		a.href = url;
		a.innerHTML = entry.name + ' (' + toFriendlySize(data.byteLength) + ')';
		document.body.appendChild(a);

		// Start the next iteration
		setTimeout(function() {
			onEach(archive, i + 1);
		}, 0);
	});
}

window.onload = function() {
	document.getElementById('fileInput').onchange = function() {
		// Just return if there is no file selected
		var file_input = document.getElementById('fileInput');
		if (file_input.files.length === 0) {
			return;
		}

		// Get the file's info
		var file = file_input.files[0];
		var blob = file.slice();
		var file_name = file.name;

		// Convert the blob into an array buffer
		var reader = new FileReader();
		reader.onload = function(evt) {
			var array_buffer = reader.result;

			// Open the file as an archive
			var archive = archiveOpen(file_name, array_buffer);
			if (archive) {
				console.info('Uncompressing ' + archive.archive_type + ' ...');

				// Start iterating over each entry in the archive
				onEach(archive, 0);
			}
		};
		reader.readAsArrayBuffer(blob);
	};
};
