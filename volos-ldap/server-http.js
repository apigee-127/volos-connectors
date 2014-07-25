var configuration = require('./configuration.js');
var ldapConnector = require('volos-ldap');
var http = require('http');
var vault = require('avault').createVault(__dirname);

var ldap;

vault.get('ldap', function(profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);
        var svr = http.createServer(function(req, resp) {
            ldap.dispatchRequest(req, resp);
        });

        svr.listen(9056, function() {
            ldap = new ldapConnector.LdapConnector({"profile": profile, "configuration": configuration});
            ldap.initializePaths(configuration.restMap, 'member');
            console.log(ldap.applicationName + ' server is listening');
        });
    }
});
