var http = require('http');
var avault = require('avault').createVault(__dirname);
var sfConnector = require('volos-salesforce');

var sfConnectorObject;

avault.get('sf', function (profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);
        var svr = http.createServer(function (req, resp) {
            sfConnectorObject.dispatchRequest(req, resp);
        });

        svr.listen(9009, function () {
            //
            // to override default configuration:
            // var restMap = require('./queryToRestMap.js');
            // and then pass restMap in constructor options.
            //
            sfConnectorObject = new sfConnector.SfConnector({"profile": profile, restMap: undefined});
            sfConnectorObject.initializePaths(sfConnectorObject.restMap);
            console.log(sfConnectorObject.applicationName + ' node server is listening');
        });
    }
});
