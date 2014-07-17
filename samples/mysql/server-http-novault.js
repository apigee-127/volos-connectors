var http = require('http');
var restMap = require('./queryToRestMap.js');
var mysqlConnector = require('volos-mysql');

var mysqlConnectorObject;

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
  mysqlConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9090, function () {
  mysqlConnectorObject = new mysqlConnector.MySqlConnector({profile: profile, restMap: restMap, includeMetaDeta: false});
  mysqlConnectorObject.initializePaths(restMap);
  console.log(mysqlConnectorObject.applicationName + ' node server is listening');
});
