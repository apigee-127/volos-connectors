var configuration = require('./configuration.js');
var s3Connector = require('volos-s3');
var http = require('http');

var s3;

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
  s3.dispatchRequest(req, resp);

});

svr.listen(9058, function () {
  s3 = new s3Connector.S3Connector({"profile": profile, "configuration": configuration});
  s3.initializePaths(configuration.restMap);
  console.log(s3.applicationName + '  server is listening');
});
