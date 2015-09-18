"use strict";

/* Shared test helper for the Jasmine test suite that simplifies
	 the dependencies by providing common methods in a single dependency */

define(['spec/common/modules/testapp_module', 'spec/common/modules/client_module', 'spec/common/modules/testapp_manager', 'async'],
	function(testAppModule, clientModule, testAppManager, async) {
		var displayError = function(err) {
			if(typeof(err) == 'string')
				return err;

			var result = '';
			if(err.statusCode)
				result += err.statusCode + '; ';
			if(typeof(err.message) == 'string')
				result += err.message;
			if(typeof(err.message) == 'object')
				result += JSON.stringify(err.message);

			return result;
		};

		var monitorConnection = function(test, realtime) {
			['failed', 'suspended'].forEach(function(state) {
				realtime.connection.on(state, function () {
					test.ok(false, 'connection to server ' + state);
					test.done();
					realtime.close();
				});
			});
		};

		var closeAndFinish = function(test, realtime) {
			if(typeof realtime === 'undefined') {
				// Likely called in a catch block for an exception
				// that occured before realtime was initialised
				test.done();
				return;
			}
			if(Object.prototype.toString.call(realtime) == '[object Array]') {
				closeAndFinishSeveral(test, realtime);
				return;
			}
			callbackOnClose(realtime, function(){ test.done(); })
		};

		var simulateDroppedConnection = function(realtime) {
			// Go into the 'disconnected' state before actually disconnecting the transports
			// to avoid the instantaneous reconnect attempt that would be triggered in
			// notifyState by the active transport getting disconnected from a connected state
			realtime.connection.once('disconnected', function(){
				realtime.connection.connectionManager.disconnectAllTransports();
			});
			realtime.connection.connectionManager.requestState({state: 'disconnected'});
		}

		function callbackOnClose(realtime, callback) {
			if(realtime.connection.connectionManager.activeProtocol === null) {
				console.log("No transport established; closing connection and calling test.done()")
				realtime.close();
				callback();
				return;
			}
			realtime.connection.connectionManager.activeProtocol.transport.on('disposed', function() {
				console.log("Transport disposed; calling test.done()")
				callback();
			});
			realtime.close();
		}

		function closeAndFinishSeveral(test, realtimeArray) {
			async.map(realtimeArray, function(realtime, mapCb){
				var parallelItem = function(parallelCb) {
					callbackOnClose(realtime, function(){ parallelCb(); })
				};
				mapCb(null, parallelItem)
			}, function(err, parallelItems) {
				async.parallel(parallelItems, function() {
					test.done();
				});
			}
		 )
		};

		/* Wraps all tests with a timeout so that they don't run indefinitely */
		var withTimeout = function(exports, defaultTimeout) {
			var timeout = defaultTimeout || 60 * 1000;

			for (var needle in exports) {
				if (exports.hasOwnProperty(needle)) {
					(function(originalFn) {
						exports[needle] = function(test) {
							var originalDone = test.done;
							test.done = function() {
								clearTimeout(timer);
								originalDone.apply(test, arguments);
							};
							var timer = setTimeout(function() {
								test.ok(false, "Test timed out after " + (timeout / 1000) + "s");
								test.done();
							}, timeout);
							originalFn(test);
						};
					})(exports[needle]);
				}
			}

			return exports;
		};

		return module.exports = {
			setupApp:     testAppModule.setup,
			tearDownApp:  testAppModule.tearDown,
			createStats:  testAppModule.createStatsFixtureData,
			getTestApp:   testAppModule.getTestApp,

			Ably:         clientModule.Ably,
			AblyRest:     clientModule.AblyRest,
			AblyRealtime: clientModule.AblyRealtime,

			loadTestData: testAppManager.loadJsonData,

			displayError:              displayError,
			monitorConnection:         monitorConnection,
			closeAndFinish:            closeAndFinish,
			simulateDroppedConnection: simulateDroppedConnection,
			withTimeout:               withTimeout
		};
	});
