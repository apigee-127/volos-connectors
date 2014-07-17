var pgConnector = require('volos-pgsql');
var http = require('http');
var restMap = require('./queryToRestMap');

var profile = {
  username: 'volos',
  password: 'volos',
  host: "nsa.rds.amazon.com",
  port: "5432",
  database: "volos"
};

// optionally store the profile data in a separate file and add that file to .gitignore so it doesn't make it to git :)
// profile = require('./novault').profile;

var pgConnectorObject = new pgConnector.PgConnector({"profile": profile, "restMap": restMap});

var svr = http.createServer(function (req, resp) {
  pgConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9089, function () {
  pgConnectorObject.initializePaths(restMap);
  console.log(pgConnectorObject.applicationName + ' node server is listening');
});