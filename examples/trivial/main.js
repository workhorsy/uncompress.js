// Copyright (c) 2015 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
// This software is licensed under a MIT License
// https://github.com/workhorsy/uncompress.js

window.onload = function() {
	// Load all the archive formats
	loadArchiveFormats(['rar', 'zip', 'tar']);

	var fileInput = document.getElementById('fileInput');
	var entryList = document.getElementById('entryList');

	function onArchiveLoaded(archive) {
		archive.entries.forEach(function(entry) {
			if (! entry.is_file) return;

			entry.readData(function(data) {
				entryList.innerHTML +=
				'<b>Name:</b> ' + entry.name + '<br />' +
				'<b>Size:</b> ' + entry.size + '<br />' +
				'<b>Is File:</b> ' + entry.is_file + '<br />';

				var url = URL.createObjectURL(new Blob([data]));
				entryList.innerHTML += '<a href="' + url + '">download</a>' + '<br />';

				entryList.innerHTML += '<hr />';
			});
		});
	}

	fileInput.onchange = function() {
		// Just return if there is no file selected
		if (fileInput.files.length === 0) {
			entryList.innerHTML = 'No file selected';
			return;
		}

		// Get the selected file
		var file = fileInput.files[0];

		// Open the file as an archive
		archiveOpenFile(file, function(archive) {
			if (archive) {
				console.info('Uncompressing ' + archive.archive_type + ' ...');
				entryList.innerHTML = '';
				onArchiveLoaded(archive);
			} else {
				entryList.innerHTML = 'Failed to uncompress file';
			}
		});
	};
};
