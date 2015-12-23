// Copyright (c) 2015 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
// This software is licensed under a MIT License
// https://github.com/workhorsy/uncompress.js

"use strict";

// Polyfill for missing array slice method (IE 11)
if (typeof Uint8Array !== 'undefined') {
if (! Uint8Array.prototype.slice) {
	Uint8Array.prototype.slice = function(start, end) {
		var retval = new Uint8Array(end - start);
		var j = 0;
		for (var i=start; i<end; ++i) {
			retval[j] = this[i];
			j++;
		}
		return retval;
	};
}
}

// FIXME: This function is super inefficient
function saneJoin(array, separator) {
	var retval = '';
	for (var i=0; i<array.length; ++i) {
		if (i === 0) {
			retval += array[i];
		} else {
			retval += separator + array[i];
		}
	}
	return retval;
}

function saneMap(array, cb) {
	var retval = new Array(array.length);
	for (var i=0; i<retval.length; ++i) {
		retval[i] = cb(array[i]);
	}
	return retval;
}

function archiveOpen(file_name, array_buffer) {
	// Get the archive type
	var archive_type = null;
	if (isRarFile(array_buffer)) {
		archive_type = 'rar';
	} else if(isZipFile(array_buffer)) {
		archive_type = 'zip';
	} else if(isTarFile(array_buffer)) {
		archive_type = 'tar';
	} else {
		return null;
	}

	// Get the entries
	var handle = null;
	var entries = [];
	switch (archive_type) {
		case 'rar':
			handle = _rarOpen(file_name, array_buffer);
			entries = _rarGetEntries(handle);
			break;
		case 'zip':
			handle = _zipOpen(file_name, array_buffer);
			entries = _zipGetEntries(handle);
			break;
		case 'tar':
			handle = _tarOpen(file_name, array_buffer);
			entries = _tarGetEntries(handle);
			break;
	}

	// Sort the entries by name
	entries.sort(function(a, b) {
		if(a.name < b.name) return -1;
		if(a.name > b.name) return 1;
		return 0;
	});

	// Return the archive object
	return {
		file_name: file_name,
		archive_type: archive_type,
		array_buffer: array_buffer,
		entries: entries,
		handle: handle
	};
}

function archiveClose(archive) {
	archive.file_name = null;
	archive.archive_type = null;
	archive.array_buffer = null;
	archive.entries = null;
	archive.handle = null;
}

function _rarOpen(file_name, array_buffer) {
	// Create an array of rar files
	var rar_files = [{
		name: file_name,
		size: array_buffer.byteLength,
		type: '',
		content: new Uint8Array(array_buffer)
	}];

	// Return rar handle
	return {
		file_name: file_name,
		array_buffer: array_buffer,
		password: null,
		rar_files: rar_files
	};
}

function _zipOpen(file_name, array_buffer) {
	var zip = new JSZip(array_buffer);

	// Return zip handle
	return {
		file_name: file_name,
		array_buffer: array_buffer,
		password: null,
		zip: zip
	};
}

function _tarOpen(file_name, array_buffer) {
	// Return tar handle
	return {
		file_name: file_name,
		array_buffer: array_buffer,
		password: null
	};
}

function _rarGetEntries(rar_handle) {
	// Get the entries
	var info = readRARFileNames(rar_handle.rar_files, rar_handle.password);
	var entries = [];
	Object.keys(info).forEach(function(i) {
		var name = info[i].name;
		var is_file = info[i].is_file;

		entries.push({
			name: name,
			is_file: info[i].is_file,
			readData: function(cb) {
				if (is_file) {
					readRARContent(rar_handle.rar_files, rar_handle.password, name, cb);
				} else {
					cb(null);
				}
			}
		});
	});

	return entries;
}

function _zipGetEntries(zip_handle) {
	var zip = zip_handle.zip;

	// Get all the entries
	var entries = [];
	Object.keys(zip.files).forEach(function(i) {
		var zip_entry = zip.files[i];
		var name = zip_entry.name;
		var is_file = ! zip_entry.dir;

		entries.push({
			name: name,
			is_file: is_file,
			readData: function(cb) {
				if (is_file) {
					var data = zip_entry.asArrayBuffer();
					cb(data);
				} else {
					cb(null);
				}
			}
		});
	});

	return entries;
}

function _tarGetEntries(tar_handle) {
	var tar_entries = tarGetEntries(tar_handle.file_name, tar_handle.array_buffer);

	// Get all the entries
	var entries = [];
	tar_entries.forEach(function(entry) {
		var is_file = true;

		entries.push({
			name: entry.name,
			is_file: is_file,
			readData: function(cb) {
				if (is_file) {
					var data = tarGetEntryData(entry, tar_handle.array_buffer);
					cb(data.buffer);
				} else {
					cb(null);
				}
			}
		});
	});

	return entries;
}

function isRarFile(array_buffer) {
	// The three styles of RAR headers
	var rar_header1 = [0x52, 0x45, 0x7E, 0x5E].join(', '); // old
	var rar_header2 = [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00].join(', '); // 1.5 to 4.0
	var rar_header3 = [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00].join(', '); // 5.0

	// Just return false if the file is smaller than the header
	if (array_buffer.byteLength < 8) {
		return false;
	}

	// Return true if the header matches one of the RAR headers
	var header1 = saneJoin(new Uint8Array(array_buffer).slice(0, 4), ', ');
	var header2 = saneJoin(new Uint8Array(array_buffer).slice(0, 7), ', ');
	var header3 = saneJoin(new Uint8Array(array_buffer).slice(0, 8), ', ');
	return (header1 === rar_header1 || header2 === rar_header2 || header3 === rar_header3);
}

function isZipFile(array_buffer) {
	// The ZIP header
	var zip_header = [0x50, 0x4b, 0x03, 0x04].join(', ');

	// Just return false if the file is smaller than the header
	if (array_buffer.byteLength < 4) {
		return false;
	}

	// Return true if the header matches the ZIP header
	var header = saneJoin(new Uint8Array(array_buffer).slice(0, 4), ', ');
	return (header === zip_header);
}

function isTarFile(array_buffer) {
	// The TAR header
	var tar_header = ['u', 's', 't', 'a', 'r'].join(', ');

	// Just return false if the file is smaller than the header size
	if (array_buffer.byteLength < 512) {
		return false;
	}

	// Return true if the header matches the TAR header
	var header = saneMap(new Uint8Array(array_buffer).slice(257, 257 + 5), String.fromCharCode).join(', ');
	return (header === tar_header);
}
