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

function onEach(archive, i) {
	if (i >= archive.entries.length) {
		return;
	}

	var entry = archive.entries[i];

	entry.readData(function(data) {
		var blob = new Blob([data], {type: getFileMimeType(entry.name)});
		var url = URL.createObjectURL(blob);

		document.body.appendChild(document.createElement('br'));

		var a = document.createElement('a');
		a.href = url;
		a.innerHTML = entry.name;
		document.body.appendChild(a);

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

		// Convert the file into an array buffer
		var reader = new FileReader();
		reader.onload = function(evt) {
			var array_buffer = reader.result;
			var archive = archiveOpen(file_name, array_buffer);
			if (archive) {
				console.info('Uncompressing ' + archive.archive_type + ' ...');

				onEach(archive, 0);
			}
		};
		reader.readAsArrayBuffer(blob);
	};
};
