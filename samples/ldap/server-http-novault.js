var configuration = require('./configuration.js');
var ldapConnector = require('volos-ldap');
var http = require('http');

var ldap;

var profile = {
  host: 'myldapserver.com',
  port: '5323',
  binddn: "cn=Manager,dc=api-connectors,dc=com",
  credentials: "myldap-password"
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
