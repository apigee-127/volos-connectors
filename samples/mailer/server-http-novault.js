var nodemailerConnector = require('volos-mailer');
var http = require('http');

var profile = {
  host: 'mymailserver.example.com',
  port: '5432',
  auth: {"user":"myusername","pass":"mypass"}
};


// optionally store the profile data in a separate file and add that file to .gitignore so it doesn't make it to git :)
// profile = require('./novault').profile;

//
// sample usage:
//
// curl '{host}?from=me%20at%20thecorner.com<blah@mememe.com>&to=someguy@somecompany.com&subject=Just%20Saying%20Goodbye&html=<b>yes%20sir</b>'
//
console.log('connector-nodemailer application starting...');

var nodemailerConnectorObject;

var svr = http.createServer(function (req, resp) {
  nodemailerConnectorObject.dispatchRequest(req, resp, "member");
});

svr.listen(9057, function () {
  nodemailerConnectorObject = new nodemailerConnector.NodemailerConnector({"profile": profile});
  console.log(nodemailerConnectorObject.applicationName + ' server is listening');
});
