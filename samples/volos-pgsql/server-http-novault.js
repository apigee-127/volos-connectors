var pgConnector = require('volos-pgsql');
var http = require('http');
var vault = require('avault').createVault(__dirname);
var restMap = require('./queryToRestMap');

var profile = {
  username: 'volos',
  password: 'volos',
  host: "nsa.rds.amazon.com",
  port: "5432",
  database: "volos"
};

profile = require('./dbprofile').profile;

var pgConnectorObject = new pgConnector.PgConnector({"profile": profile, "restMap": restMap});

var svr = http.createServer(function (req, resp) {
  pgConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9089, function () {
  pgConnectorObject.initializePaths(restMap);
  console.log(pgConnectorObject.applicationName + ' node server is listening');
});