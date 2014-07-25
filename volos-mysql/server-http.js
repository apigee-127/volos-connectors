var http = require('http');
var vault = require('avault').createVault(__dirname);
var restMap = require('./queryToRestMap.js');
var mysqlConnector = require('volos-mysql');

var mysqlConnectorObject;

vault.get('mysql', function(profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);
        var svr = http.createServer(function(req, resp) {
            mysqlConnectorObject.dispatchRequest(req, resp);
        });

        svr.listen(9090, function() {
            mysqlConnectorObject = new mysqlConnector.MySqlConnector({profile: profile, restMap : restMap, defaults: {limit:5, expand: true, includeMetaDeta: false}});
            mysqlConnectorObject.initializePaths(restMap);
            console.log(mysqlConnectorObject.applicationName + ' node server is listening');
        });
    }
});
