// Copyright (c) 2017 Matthew Brennan Jones <matthew.brennan.jones@gmail.com>
// This software is licensed under a MIT License
// https://github.com/workhorsy/uncompress.js

// Load all the archive formats
// NOTE: This loads asynchronously, and will have to complete before the
// library can be used. So this should be run when the program first starts.
loadArchiveFormats(['rar', 'zip', 'tar']);


function httpRequest(url, method, cb, timeout) {
	timeout = timeout || 10000;
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState === 4) {
			cb(this.response, this.status);
		} else if (this.readyState === 0) {
			cb(null);
		}
	};
	xhr.onerror = function() {
		cb(null);
	};
	xhr.open(method, url, true);
	xhr.timeout = timeout;
	xhr.responseType = 'blob';
	xhr.send(null);
}

function onArchiveLoaded(archive) {
	var entryList = document.getElementById('entryList');

	archive.entries.forEach(function(entry) {
		if (! entry.is_file) return;

		entry.readData(function(data, err) {
			entryList.innerHTML +=
			'<b>Name:</b> ' + entry.name + '<br />' +
			'<b>Compressed Size:</b> ' + entry.size_compressed + '<br />' +
			'<b>Uncompressed Size:</b> ' + entry.size_uncompressed + '<br />' +
			'<b>Is File:</b> ' + entry.is_file + '<br />';

			var url = URL.createObjectURL(new Blob([data]));
			entryList.innerHTML += '<a href="' + url + '">download</a>' + '<br />';

			entryList.innerHTML += '<hr />';
		});
	});
}

document.getElementById('go').addEventListener('click', function() {
	var entryList = document.getElementById('entryList');
	entryList.innerHTML = '';

	var url = document.getElementById('download_url').value;
	httpRequest(url, 'GET', function(response, status) {
		if (status === 200) {
			var fileReader = new FileReader();
			fileReader.onload = function() {
				var array_buffer = this.result;

				// Open the file as an archive
				var archive = archiveOpenArrayBuffer("example.rar", array_buffer);
				if (archive) {
					console.info('Uncompressing ' + archive.archive_type + ' ...');
					entryList.innerHTML = '';
					onArchiveLoaded(archive);
				} else {
					entryList.innerHTML = '<span style="color: red">' + err + '</span>';
				}
			};
			fileReader.readAsArrayBuffer(response);
		} else {
			console.error("Failed to download file with status: ", status);
		}
	});
});
