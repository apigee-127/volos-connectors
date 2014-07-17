var configuration = require('./configuration.js');
var s3Connector = require('volos-s3');
var http = require('http');
var vault = require('avault').createVault(__dirname);

var s3;

vault.get('aws', function(profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);
        var svr = http.createServer(function(req, resp) {
            s3.dispatchRequest(req, resp);

        });

        svr.listen(9058, function() {
            s3 = new s3Connector.S3Connector({"profile": profile, "configuration": configuration});
            s3.initializePaths(configuration.restMap);
            console.log(s3.applicationName + '  server is listening');
        });
    }
});
