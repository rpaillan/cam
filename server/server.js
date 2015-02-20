#!/usr/bin/env node
'use strict';

var https = require('https'),
	http = require('http'),
	path = require('path'),
	port = process.argv[2] || 443,
	//insecurePort = process.argv[3] || 4080,
	fs = require('fs'),
	path = require('path'),
	checkip = require('check-ip-address'),
	server,
	insecureServer,
	options,
	certsPath = path.join(__dirname, 'certs', 'server'),
  config = JSON.parse(fs.readFileSync('../../config.json'));


console.log('CONFIG:', config);

//
// SSL Certificates
//
options = {
	key: fs.readFileSync(config.certs_key_pem),  //path.join(config.certs_key_pem, 'my-server.key.pem')),
	ca: [ fs.readFileSync(config.certs_ca_cert_pem) ],  //path.join(caCertsPath, 'my-root-ca.crt.pem')) ],
	cert: fs.readFileSync(config.certs_cert_pem),   //path.join(certsPath, 'my-server.crt.pem')),
	requestCert: false,
	rejectUnauthorized: false,
};


//
// Serve an Express App securely with HTTPS
//
server = https.createServer(options);
checkip.getExternalIp().then(function (ip) {
  var host = ip || 'localhost';

  function listen(app) {
    server.on('request', app);
    server.listen(port, function () {
      port = server.address().port;
      //if (ip) {
        console.log('Listening on https://' + host + ':' + port);
      //}
    });
  }

  var publicDir = path.join(__dirname, '../site');
  var app = require('./app').create(server, host, port, publicDir, config);
  listen(app);
});



//
// Redirect HTTP ot HTTPS
//
// This simply redirects from the current insecure location to the encrypted location
//

/*
insecureServer = http.createServer();
insecureServer.on('request', function (req, res) {
  // TODO also redirect websocket upgrades
  res.setHeader(
    'Location',
    'https://' + req.headers.host.replace(/:\d+/, ':' + port) + req.url
  );
  res.statusCode = 302;
  res.end();
});
insecureServer.listen(insecurePort, function(){
  console.log("\nRedirecting all http traffic to https\n");
});
*/