var configuration = require('./configuration.js');
var snsConnector = require('volos-sqs');
var vault = require('avault').createVault(__dirname);
var http = require('http');
var Q = require('q');

var sqs;

vault.get('aws', function(profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);
        var svr = http.createServer(function(req, resp) {
            sqs.dispatchRequest(req, resp);
        });

        svr.listen(9100, function() {
            sqs = new snsConnector.SqsConnector({"profile": profile, configuration: configuration, receiveMessageCallback: receiveMessageCallback});
            sqs.initializePaths(configuration.restMap);
            console.log(sqs.applicationName + ' server is listening');
        });
    }

    function receiveMessageCallback(body, message) {
        var dfd = Q.defer();
        console.log('body: ' + body + ', message: ' + message);
        dfd.resolve('');
        return(dfd.promise);
    }
});
