// Copyright (c) 2015 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
// This software is licensed under a MIT License
// https://github.com/workhorsy/uncompress.js

window.onload = function() {
	var fileInput = document.getElementById('fileInput');
	var entryList = document.getElementById('entryList');

	function onArchiveLoaded(archive) {
		archive.entries.forEach(function(entry) {
			entryList.innerHTML +=
			'<b>Name:</b> ' + entry.name + '<br />' +
			'<b>Size:</b> ' + entry.size + '<br />' +
			'<b>Is File:</b> ' + entry.is_file + '<br />';

			if (entry.is_file) {
				entry.readData(function(data) {
					var url = URL.createObjectURL(new Blob([data]));
					entryList.innerHTML += '<a href="' + url + '">download</a>' + '<br />';
				});
			}
			entryList.innerHTML += '<hr />';
		});
	}

	fileInput.onchange = function() {
		// Just return if there is no file selected
		if (fileInput.files.length === 0) {
			entryList.innerHTML = 'No file selected';
			return;
		}

		// Get the file's info
		var file = fileInput.files[0];
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
				entryList.innerHTML = '';
				onArchiveLoaded(archive);
			} else {
				entryList.innerHTML = 'Failed to uncompress file';
			}
		};
		reader.readAsArrayBuffer(blob);
	};
};
