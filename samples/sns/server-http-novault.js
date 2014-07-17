var configuration = require('./configuration.js');
var snsConnector = require('volos-sns');
var http = require('http');

var sns;

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
  sns.dispatchRequest(req, resp);
});

svr.listen(9099, function () {
  sns = new snsConnector.SnsConnector({"profile": profile, configuration: configuration});
  sns.initializePaths(configuration.restMap);
  console.log(sns.applicationName + ' server is listening');
});
