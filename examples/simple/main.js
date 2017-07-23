// Copyright (c) 2017 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
// This software is licensed under a MIT License
// https://github.com/workhorsy/uncompress.js


let entryList = null;

// FIXME: This function is super inefficient
function isValidImageType(file_name) {
	file_name = file_name.toLowerCase();
	return file_name.endsWith('.jpeg') ||
			file_name.endsWith('.jpg') ||
			file_name.endsWith('.png') ||
			file_name.endsWith('.bmp') ||
			file_name.endsWith('.webp') ||
			file_name.endsWith('.gif');
}

// FIXME: This function is super inefficient
function getFileMimeType(file_name) {
	file_name = file_name.toLowerCase();
	if (file_name.endsWith('.jpeg') || file_name.endsWith('.jpg')) {
		return 'image/jpeg';
	} else if (file_name.endsWith('.png')) {
		return 'image/png';
	} else if (file_name.endsWith('.bmp')) {
		return 'image/bmp';
	} else if (file_name.endsWith('.webp')) {
		return 'image/webp';
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

function onClick(entry) {
	let errorList = document.getElementById('errorList');
	let img = document.getElementById('currentImage');
	img.src = '';

	entry.readData(function(data, err) {
		if (err) {
			errorList.innerHTML = err;
			return;
		}

		// Convert the data into an Object URL
		let blob = new Blob([data], {type: getFileMimeType(entry.name)});
		let url = URL.createObjectURL(blob);

		img.src = url;
		img.onload = function() {
			URL.revokeObjectURL(url);
		};
	});
}

function createLinkForEachEntry(archive) {
	// Get only the entries that are images
	let entries = [];
	archive.entries.forEach(function(entry) {
		if (isValidImageType(entry.name)) {
			entries.push(entry);
		}
	});
	archive.entries = entries;

	archive.entries.forEach(function(entry) {
		if (entry.is_file) {
			// Add a BR to the document
			entryList.appendChild(document.createElement('br'));

			// Add a link to the Object URL
			let a = document.createElement('a');
			a.innerHTML = entry.name + ' (' + toFriendlySize(entry.size_uncompressed) + ')';
			a.href = '#' + entry.name;

			// Uncompress the entry when the link is clicked on
			a.addEventListener('click', function(e) {
				console.info('clicked .................');
				onClick(entry);
			});

			entryList.appendChild(a);
		}
	});

	//archiveClose(archive);
}

// Load all the archive formats
loadArchiveFormats(['rar', 'zip', 'tar'], function() {
	entryList = document.getElementById('entryList');
	let fileInput = document.getElementById('fileInput');

	fileInput.onchange = function() {
		// Just return if there is no file selected
		if (fileInput.files.length === 0) {
			entryList.innerHTML = 'No file selected';
			return;
		}

		// Remove any loaded image
		window.location.hash = '';
		document.getElementById('currentImage').src = '';

		// Get the file's info
		let file = fileInput.files[0];
		let password = document.getElementById('filePassword').value;

		// Open the file as an archive
		archiveOpenFile(file, password, function(archive, err) {
			if (archive) {
				console.info('Uncompressing ' + archive.archive_type + ' ...');
				entryList.innerHTML = '';
				document.getElementById('currentImage').src = '';
				createLinkForEachEntry(archive);
			} else {
				entryList.innerHTML = '<span style="color: red">' + err + '</span>';
			}
		});
	};
	
	fileInput.disabled = false;
});
