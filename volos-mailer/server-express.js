var nodemailerConnector = require('volos-mailer');
var avault = require('avault').createVault(__dirname);
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())

//
// sample usage:
//
// curl '{host}?from=me%20at%20thecorner.com<blah@mememe.com>&to=someguy@somecompany.com&subject=Just%20Saying%20Goodbye&html=<b>yes%20sir</b>'
// or
// curl -X POST http://localhost:9057/mail -d '{"from": "me at the corner.com<blah@mememe.com>", "to": "someguy@somecompany.com", "subject": "Just% Saying Goodbye", "html": "<b>yes sir</b>"}' -H 'Content-Type: application/json
//

var nodemailerConnectorObject;

avault.get('mySmtpServer', function(profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);
        //
        // to override default configuration:
        // var configuration = require('./configuration.js');
        // and then pass configuration in constructor options.
        //
        nodemailerConnectorObject =
            new nodemailerConnector.NodemailerConnector({profile: profile, configuration: undefined});
        nodemailerConnectorObject.registerPathsExpress(app, nodemailerConnectorObject.configuration.restMap);

        app.listen(9057);
    }
});
