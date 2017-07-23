// Copyright (c) 2017 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
// This software is licensed under a MIT License
// https://github.com/workhorsy/uncompress.js
"use strict";

importScripts("polyfill.js");
importScripts("../../js/uncompress.js");

// Load all the archive formats
loadArchiveFormats(['rar', 'zip', 'tar'], function() {
	console.info("Worker ready ...");
});

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

function onUncompress(archive) {
	// Get only the entries that are images
	let entries = [];
	archive.entries.forEach(function(entry) {
		if (isValidImageType(entry.name)) {
			entries.push(entry);
		}
	});

	// Uncompress each entry and send it to the client
	let onEach = function(i) {
		if (i >= entries.length) {
			return;
		}

		let entry = entries[i];
		entry.readData(function(data, err) {
			if (err) {
				let message = {
					action: 'error',
					error: err
				};
				self.postMessage(message);
				return;
			}

			if (entry.is_file && data) {
				let blob = new Blob([data], {type: getFileMimeType(entry.name)});
				let url = URL.createObjectURL(blob);

				let message = {
					action: 'uncompress_each',
					file_name: entry.name,
					url: url,
					index: i,
					size: data.byteLength
				};
				self.postMessage(message);
			}

			onEach(i + 1);
		});
	};
	onEach(0);
}

self.addEventListener('message', function(e) {
	switch (e.data.action) {
		case 'uncompress_start':
			// Get the file data
			let array_buffer = e.data.array_buffer;
			let file_name = e.data.file_name;
			let password = e.data.password;

			// Open the array buffer as an archive
			try {
				let archive = archiveOpenArrayBuffer(file_name, password, array_buffer);
				console.info('Uncompressing ' + archive.archive_type + ' ...');
				onUncompress(archive);
			// Otherwise show an error
			} catch (e) {
				let message = {
					action: 'error',
					error: e.message
				};
				self.postMessage(message);
			}
			break;
	}
}, false);
