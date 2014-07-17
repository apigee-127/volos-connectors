var express = require('express');
var pgConnector = require('volos-pgsql');
var restMap = require('./queryToRestMap.js');
var Q = require('q');
var app = express();
var vault = require('avault').createVault(__dirname);

vault.get('my_profile_key', function(profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);
        var pgConnectorObject = createPgConnector();
        pgConnectorObject.registerPathsExpress(app, restMap);
        app.listen(9089);
        console.log(pgConnectorObject.applicationName + ' node server is listening');
    }

    function createPgConnector()  {
        var pgConnectorObject = new pgConnector.PgConnector({"profile": profile, "restMap": restMap});
        return(pgConnectorObject);
    }

});
