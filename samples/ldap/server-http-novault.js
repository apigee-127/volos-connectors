var configuration = require('./configuration.js');
var ldapConnector = require('volos-ldap');
var http = require('http');

var ldap;

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
  ldap.dispatchRequest(req, resp);
});

svr.listen(9056, function () {
  ldap = new ldapConnector.LdapConnector({"profile": profile, "configuration": configuration});
  ldap.initializePaths(configuration.restMap, 'member');
  console.log(ldap.applicationName + ' server is listening');
});
