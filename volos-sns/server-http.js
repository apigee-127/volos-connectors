var snsConnector = require('volos-sns');
var vault = require('avault').createVault(__dirname);
var http = require('http');

var sns;

vault.get('aws', function(profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);
        var svr = http.createServer(function(req, resp) {
            sns.dispatchRequest(req, resp);
        });

        svr.listen(9099, function() {
            sns = new snsConnector.SnsConnector({"profile": profile, configuration: undefined});
            sns.initializePaths(sns.configuration.restMap);
            console.log(sns.applicationName + ' server is listening');
        });
    }
});
