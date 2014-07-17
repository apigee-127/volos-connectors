var express = require('express');
var sfConnector = require('volos-salesforce');
var restMap = require('./queryToRestMap.js');
var app = express();
var avault = require('avault').createVault(__dirname);

avault.get('sf', function (profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);
        var sfConnectorObject = createSfConnector();
        sfConnectorObject.registerPathsExpress(app, restMap);
        app.listen(9009);
        console.log(sfConnectorObject.applicationName + ' node server is listening');
    }

    function createSfConnector() {
        var sfConnectorObject = new sfConnector.SfConnector({"profile": profile, restMap: restMap});
        return(sfConnectorObject);
    }
});
