var util = require('util');
var querystring = require('querystring');
var crypto = require('crypto');
var http = require('http');

var xor_table = [
	1, 0x62, 0x36, 0x6a, 0x6a, 0x38, 0x75, 15, 0x4c, 0x40, 0x4c, 0x6a, 0x3d, 0x3f, 0x36, 0x57, 
	0x23, 0x44, 0x2f, 0x71, 1, 0x6d, 0x4c, 110, 0x61, 0x57, 1, 0x62, 0x65, 0x6d, 6, 0x7c, 
	0x6a, 0x61, 0x65, 0x5b, 0x63, 0x2b, 0x4d, 0x24, 0x67, 0x49, 0x24, 11, 0x1a, 0x3e, 0x2a, 0x39, 
	0x43, 100, 0x24, 0x49, 0x4a, 0x6f, 0x5f, 60, 0x11, 0x2f, 0x3b, 0x7b, 0x5c, 0x23, 0x53, 0x4f, 
	0x1a, 0x24, 0x24, 4, 10, 0x63, 120, 0x73, 0x4c, 0x56, 100, 0x40, 13, 0x6f, 0x7f, 0x7b, 
	0x70, 0x39, 0x7b, 15, 0x4f, 0x13, 0x13, 0x27, 0x6a, 2, 0x27, 0x1f, 0x29, 0x56, 0x27, 11, 
	0x5b, 0x1c, 0x31, 0x60
];

function base64_encode(param) {
	var b = new Buffer(param);
	return b.toString('base64');
}

function base64_decode(param) {
	var b = new Buffer(param, 'base64');
	return b.toString();
}

function md5(param) {
	var md5hash = crypto.createHash('md5');
	md5hash.update(param);
	return md5hash.digest('hex');
}

function encode(param) {
	var buf = new Buffer(param.length);
	for (var i=0; i<param.length; i++) {
		key = xor_table[i % xor_table.length];
		buf[i] = param.charCodeAt(i);
		buf[i] = key ^ buf[i];
	}
	return md5(param)+base64_encode(buf.toString());
}

function decode(param) {
	var decode = base64_decode(param);
	var buf = new Buffer(decode.length);
	for (var i=0; i<decode.length; i++) {
		key = xor_table[i % xor_table.length];
		buf[i] = decode.charCodeAt(i);
		buf[i] = key ^ buf[i];
	}
	return buf.toString();
}

function server_push(host, path, post, callback) {
	var options = {
		hostname: host,
		port: 80,
		path: path,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': post.length,
			'User-Agent': 'Dalvik/1.6.0 (Linux; U; Android 4.1.2; SHV-E210S Build/JZO54K)',
			'Host': 'monster-server.netmarble.net',
			'Connection': 'Keep-Alive',
			'Accept-Encoding': 'gzip'
		}
	};

	var data = '';
	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			data += chunk;
		});
		res.on('end', function() {
			callback(false, data);
		});
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
		callback(true, e.message);
	});

	req.write(post);
	req.end();
}

var srlib = {
	debug: false,
	server: function(action, param, callback) {
		var path = '/SR/' + action;
		var query = querystring.stringify(param);
		var post = "epp="+encodeURIComponent(encode(query));
		if (srlib.debug) console.log(query);
		server_push("monster-server.netmarble.net", path, post, function(error, result) {
			if (error) {
				callback(false, {error:result});
				return;
			}

			var retval = '';
			var retobj = {};
			try {
				retval = decode(result);
				retobj = JSON.parse(retval);
			} catch (e) {
				console.log('server-push-exception');
				console.log(e.toString());
				callback(false, {err:-2, reason:'script-exception'});
				return;
			}
			if (!retobj) {
				callback(false, {err:-2, reason:'connect-error'});
				return;
			}
			if (retobj.err) {
				callback(false, retobj);
				return;
			}

			callback(true, retobj);
		});
	},
	login: function(param, callback) {
		srlib.server('login', param, callback);
	},
	startgame: function(param, callback) {
		srlib.server('startgame', param, callback);
	},
	gameover: function(param, callback) {
		srlib.server('gameover', param, callback);
	},
	getdropitem: function(param, callback) {
		srlib.server('getdropitem', param, callback);
	},
	getdungeoncleartime: function(param, callback) {
		srlib.server('getdungeoncleartime', param, callback);
	},
};

module.exports = srlib;
