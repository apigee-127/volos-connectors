var http = require('http');
var restMap = require('./queryToRestMap.js');
var sfConnector = require('volos-salesforce');

var sfConnectorObject;

var profile = {
  username: 'volos',
  password: 'volos',
  host: "nsa.rds.amazon.com",
  port: "5432",
  database: "volos"
};

// optionally store the profile data in a separate file and add that file to .gitignore so it doesn't make it to git :)
// profile = require('./novault').profile;

var svr = http.createServer(function (req, resp) {
  sfConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9009, function () {
  sfConnectorObject = new sfConnector.SfConnector({"profile": profile, restMap: restMap});
  sfConnectorObject.initializePaths(restMap);
  console.log(sfConnectorObject.applicationName + ' node server is listening');
});
