// Copyright (c) 2015 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
// This software is licensed under a MIT License
// https://github.com/workhorsy/uncompress.js

"use strict";

// Based on the information from:
// https://en.wikipedia.org/wiki/Tar_(computing)

function tarGetEntries(filename, array_buffer) {
	var view = new Uint8Array(array_buffer);
	var offset = 0;
	var entries = [];

	while (offset + 512 < view.byteLength) {
		// Get entry name
		var entry_name = saneMap(view.slice(offset + 0, offset + 0 + 100), String.fromCharCode);
		entry_name = entry_name.join('').replace(/\0/g, '');

		// No entry name, so probably the last block
		if (entry_name.length === 0) {
			break;
		}

		// Get entry size
		var entry_size = parseInt(saneJoin(saneMap(view.slice(offset + 124, offset + 124 + 12), String.fromCharCode), ''), 8);
		var entry_type = saneMap(view.slice(offset + 156, offset + 156 + 1), String.fromCharCode) | 0;

		// Save this as en entry if it is a file or directory
		if (entry_type === 0 || entry_type === 5) {
			var entry = {
				name: entry_name,
				size: entry_size,
				is_file: entry_type == 0,
				offset: offset
			};
			entries.push(entry);
		}

		// Round the offset up to be divisible by 512
		offset += (entry_size + 512);
		if (offset % 512 > 0) {
			var even = (offset / 512) | 0; // number of times it goes evenly into 512
			offset = (even + 1) * 512;
		}
	}

	return entries;
}

function tarGetEntryData(entry, array_buffer) {
	var view = new Uint8Array(array_buffer);
	var offset = entry.offset;
	var size = entry.size;

	// Get entry data
	var entry_data = view.slice(offset + 512, offset + 512 + size);
	return entry_data;
}
