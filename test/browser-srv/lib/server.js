var fs = require('fs');
var http = require('http');
var net = require('net');
var path = require('path');
var url = require('url');
var util = require('util');
var testvars = require('../framework/testvars');
var existsSync = fs.existsSync || path.existsSync;
var console2 = require('../lib/quietconsole');
var setup = require('../framework/setup');
var teardown = require('../framework/teardown');

var testAccounts = {}; // keep track of all accounts set up that have not yet been torn down

var external = {
	'ably.js' : path.normalize(__dirname + '../../../../browser/lib/ably.js'),
	'nodeunit.js' : path.normalize(__dirname + '../../../../node_modules/nodeunit/examples/browser/nodeunit.js'),
	'nodeunit.css' : path.normalize(__dirname + '../../../../node_modules/nodeunit/share/nodeunit.css'),
	'^(?:test/swf/)WebSocketMainInsecure(.*)\.swf$' : path.normalize(__dirname + '../../../../browser/lib/swf/WebSocketMainInsecure*.swf')
};

var startsWith = function(string, substr) {
	return string.substr(0, substr.length) == substr;
};

var endsWith = function(string, substr) {
	return string.substr(string.length - substr.length) == substr;
};

var guessContentType = function(string) {
	var contentType = 'text/html';
	if(endsWith(string, '.css'))
		contentType = 'text/css';
	else if(endsWith(string, '.js'))
		contentType = 'application/javascript';
	else if(endsWith(string, '.json'))
		contentType = 'application/json';
	else if(endsWith(string, '.swf'))
		contentType = 'application/x-shockwave-flash';
	return contentType;
};

var policyText  =
	'<?xml version="1.0"?>' +
	'<!DOCTYPE cross-domain-policy SYSTEM "/xml/dtds/cross-domain-policy.dtd">' +
	'<cross-domain-policy>' +
	'<site-control permitted-cross-domain-policies="master-only"/>' +
	'<allow-access-from domain="*" to-ports="*"/>' +
	'</cross-domain-policy>';

exports.start = function(opts, callback) {
	if (opts.pipeJSON || opts.onTestResult) console2.quiet(true);

	/* handlers */
	var res500 = function(res, err) {
		res.writeHead(500);
		res.end(require('util').inspect(err));
	};
	var res404 = function(res) {
		res.writeHead(404);
		res.end('404 - file missing');
	};
	var res200 = function(res, type, text) {
		res.writeHead(200, {'Content-Type': type});
		res.end(text);
	};

	/* flash policy file server */
	var policySrv = net.createServer(function(socket) {
		socket.end(policyText);
	});
	policySrv.listen(843, function(err) {
		if (!err) console2.log('Policy server started on port 843');
	});
	policySrv.on('error', function(err) {
		if (err) {
			console2.error('Error - Flash policy server was not started on port 843!!!');
			console2.info('Have you started the server with root privileges?');
			callback(err, null);
			return;
		}
	});

	/* test server */
	var testSrv = http.createServer();
	testSrv.on('request', function(request, response) {
		console2.log(request.method + ' ' + request.url);
		var uri = url.parse(request.url, true);
		var req = uri.pathname.substr(1) || 'index.html';
		var params = uri.query;
		if(req == 'exit') {
			res200(response, 'text/plain', 'exiting...');
			process.nextTick(function() {
				testSrv.close();
				if(policySrv)
					policySrv.close();
			});
			return;
		}
		if(req == 'testvars') {
			if(params.callback)
				res200(response, 'application/javascript', params.callback + '(' + JSON.stringify(testvars) + ');');
			else
				res200(response, 'application/json', JSON.stringify(testvars, null, '\t'));
			return;
		}
		for (var externalFileId in external) {
			var filename, match;
			if (externalFileId == req) {
				filename = external[externalFileId];
			} else if ( (externalFileId[0] == '^') && (match = new RegExp(externalFileId).exec(req)) ) {
				filename = external[externalFileId].replace('*', match[1]);
			}
			if (filename) {
				fs.readFile(filename, function(err, file) {
					if(err)
						res500(response, err);
					else
						res200(response, guessContentType(filename), file);
				});
				return;
			}
		}
		if (req == 'test/setup') {
			setup.createAccountAppAndKeys(testvars, console2, function(err, testAccount) {
				if (err) {
					res500(response, err);
				} else {
					testAccount.startedAt = new Date().getTime();
					testAccounts[testAccount.acctId] = testAccount;
					res200(response, 'application/json', JSON.stringify(testAccount));
				}
			});
			return;
		}
		if(startsWith(req, 'test/')) {
			/* return test file */
			var filename = path.normalize(__dirname + '/../../browser/' + req.substr('test/'.length));
			if(!existsSync(filename)) {
				res404(response);
				return;
			}
			if(fs.statSync(filename).isFile()) {
				fs.readFile(filename, function(err, file) {
					if(err) {
						res500(response, err);
						return;
					}
					var type = guessContentType(filename);
					if(type == 'application/json' && params.callback) {
						type = 'application/javascript';
						file = params.callback + '(' + file + ');';
					}
					res200(response, type, file);
				});
				return;
			}
			res404(response);
			return;
		}
		if(req == 'tests-complete') {
			var body = '';
			request.on('data', function (data) {
				body += data;
			});
			request.on('end', function () {
				var postData = require('querystring').parse(body),
					testAccount = JSON.parse(postData.testAccount);
				res200(response, 'text/html', 'Test results received');
				if (testAccount) {
					if (testAccounts[testAccount.acctId]) {
						var timePassed = (new Date().getTime() - (testAccount.startedAt || 0) ) / 1000;
						console.log(' test with account ' + testAccount.acctId + ' finished in ' + Math.round(timePassed*10)/10 + 's');
						delete testAccounts[testAccount.acctId];
					}
					teardown.deleteAccount(testvars, testAccount, console2);
				}
				postData.tests = !isNaN(parseInt(postData.tests, 10)) ? Number(postData.tests) : 0;
				postData.failed = !isNaN(parseInt(postData.failed, 10)) ? Number(postData.failed) : 1;
				if (postData.tests === 0) {
					postData.failed++;
					postData.errors = postData.errors || [];
					postData.errors.push('No tests were run, something is wrong');
				}
				if (postData.failed === 0) {
					console2.log("Tests passed (" + postData.tests + ")");
					if (opts.pipeJSON) console.log(postData);
					if (opts.onTestResult) { opts.onTestResult(postData); }
					if (opts.exitAfterTests) process.exit();
				} else {
					console2.warn("Tests failed (" + postData.failed + " out of " + postData.tests + "):");
					console2.warn(postData);
					if (opts.pipeJSON) console.log(postData);
					if (opts.onTestResult) { opts.onTestResult(postData); }
					if (opts.exitAfterTests) process.exit(Number(postData.failed));
				}
			});
			return;
		}
		/* attempt to serve from static */
		var filename = path.resolve(__dirname + '/../static/', req);
		fs.readFile(filename, function(err, file) {
			if(err)
				res404(response);
			else
				res200(response, guessContentType(filename), file);
		});
	});
	testSrv.listen(opts.port, opts.host, function(err) {
		if(err) {
			callback(err, testSrv);
			return;
		}
		console2.log('Web server started with opts: ' + util.inspect(opts));
		callback(null, testSrv);
	});
	testSrv.on('close', function() {
		if(policySrv) {
			policySrv.close();
			console.log('Policy server closed');
		}
	});
};

function cleanUpAccounts() {
	for (var acctId in testAccounts) {
		var testAccount = testAccounts[acctId];
		console2.log('! Test Account ID: ' + testAccount.acctId + ' was not torn down, attempting to tear down now..');
		teardown.deleteAccount(testvars, testAccount, console2);
		delete testAccounts[acctId];
	}
}

process.on('exit', cleanUpAccounts);
process.on('SIGINT', function() {
	cleanUpAccounts();
	process.exit();
});
process.on('uncaughtException', function(err) {
  cleanUpAccounts();
});