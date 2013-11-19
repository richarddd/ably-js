var FlashTransport = (function() {
	var isBrowser = (typeof(window) == 'object');

	/* public constructor */
	function FlashTransport(connectionManager, auth, params) {
		params.binary = false;
		WebSocketTransport.call(this, connectionManager, auth, params);
	}
	Utils.inherits(FlashTransport, WebSocketTransport);

	FlashTransport.isAvailable = function() {
		return isBrowser && swfobject && swfobject.getFlashPlayerVersion().major >= 10 && FlashWebSocket;
	};

	if(FlashTransport.isAvailable())
		ConnectionManager.transports.flash_socket = FlashTransport;

	FlashTransport.tryConnect = function(connectionManager, auth, params, callback) {
		/* load the swf if not already loaded */
		var swfLocation = Defaults.flashTransport.swfLocation,
				policyPort = Defaults.flashTransport.policyPort;
		if (connectionManager.options.flashTransport) {
			if (connectionManager.options.flashTransport.swfLocation)
				swfLocation = connectionManager.options.flashTransport.swfLocation;
			if (connectionManager.options.flashTransport.policyPort)
				swfLocation = connectionManager.options.flashTransport.swfLocation;
		}
		FlashWebSocket.__initialize(swfLocation);
		var transport = new FlashTransport(connectionManager, auth, params);
		if(policyPort)
			FlashWebSocket.loadFlashPolicyFile('xmlsocket://' + transport.wsHost + ':' + policyPort);
		errorCb = function(err) { callback(err); };
		transport.on('wserror', errorCb);
		transport.on('wsopen', function() {
			Logger.logAction(Logger.LOG_MINOR, 'FlashTransport.tryConnect()', 'viable transport ' + transport);
			transport.off('wserror', errorCb);
			callback(null, transport);
		});
		transport.connect();
	};

	FlashTransport.prototype.createWebSocket = function(uri, connectParams) {
		var paramCount = 0;
		if(connectParams) {
			for(var key in connectParams)
				uri += (paramCount++ ? '&' : '?') + key + '=' + connectParams[key];
		}
		this.uri = uri;
		var options = this.params.options;
		return new FlashWebSocket(uri, [], options.proxyHost, options.proxyPort);
	};

	FlashTransport.prototype.toString = function() {
		return 'FlashTransport; uri=' + this.uri;
	};

	return FlashTransport;
})();
