var nodemailerConnector = require('volos-mailer');
var http = require('http');
var avault = require('avault').createVault(__dirname);

//
// sample usage:
//
// curl '{host}?from=me%20at%20thecorner.com<blah@mememe.com>&to=someguy@somecompany.com&subject=Just%20Saying%20Goodbye&html=<b>yes%20sir</b>'
//
console.log('connector-nodemailer application starting...');

var nodemailerConnectorObject;

avault.get('mySmtpServer', function(profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);
        var svr = http.createServer(function (req, resp) {
            nodemailerConnectorObject.dispatchRequest(req, resp, "member");
        });

        svr.listen(9057, function () {
            nodemailerConnectorObject = new nodemailerConnector.NodemailerConnector({"profile": profile});
            console.log(nodemailerConnectorObject.applicationName + ' server is listening');
        });
    }
});
