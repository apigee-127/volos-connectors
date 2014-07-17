var pgConnector = require('volos-pgsql');
var http = require('http');
var vault = require('avault').createVault(__dirname);
var restMap = require('./queryToRestMap');

var pgConnectorObject;

vault.get('my_profile_key', function(profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);

        var svr = http.createServer(function(req, resp) {
            pgConnectorObject.dispatchRequest(req, resp);

        });

        svr.listen(9089, function() {
            pgConnectorObject = new pgConnector.PgConnector({"profile": profile, "restMap": restMap});
            pgConnectorObject.initializePaths(restMap);
            console.log(pgConnectorObject.applicationName + ' node server is listening');
        });
    }
});
