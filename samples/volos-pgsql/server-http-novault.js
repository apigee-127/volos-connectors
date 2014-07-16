var pgConnector = require('volos-pgsql');
var http = require('http');
var vault = require('avault').createVault(__dirname);
var restMap = require('./queryToRestMap');

var profile = {
  username: 'apigee',
  password: '97DqcjBSDE8m',
  host: "a360dw.c7b2twrxxjtc.us-west-2.rds.amazonaws.com",
  port: "5432",
  database: "ace"
};

var pgConnectorObject = new pgConnector.PgConnector({"profile": profile, "restMap": restMap});

var svr = http.createServer(function (req, resp) {
  pgConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9089, function () {
  pgConnectorObject.initializePaths(restMap);
  console.log(pgConnectorObject.applicationName + ' node server is listening');
});