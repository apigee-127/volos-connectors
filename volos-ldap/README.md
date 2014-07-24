# Volos LDAP connector

The Volos LDAP connector connector lets you search and update an LDAP server through a RESTful API. It is one of the Volos Node.js modules from Apigee. The module is designed to work on Apigee Edge but can be run anywhere Node.js applications can run. You can use this module without any dependency on Apigee.

### Quick example

This module maps LDAP search and update operations to RESTful API resources and query parameters. For example, a properly configured LDAP connector might map this LDAP entry:

``cn=engineering,ou=departments,dc=api-connectors,dc=com``

to a REST resource called ``/engineering``, which you might call like this:

``curl http://localhost:9056/departments/engineering``

and which might generate a JSON response like this:

```
{
    "action": "GET",
    "params": {
        "qp": {}
    },
    "path": "/departments/engineeering",
    "url": "/departments/engineeering",
    "data": [
        {
            "distinguishedName": {
                "cn": "engineering",
                "ou": "departments",
                "dc": [
                    "api-connectors",
                    "com"
                ]
            },
            "commonName": "engineering",
            "member": {
                "cn": "jdoe",
                "ou": "people",
                "dc": [
                    "api-connectors",
                    "com"
                ]
            }
        },
        {
            "distinguishedName": {
                "cn": "products",
                "ou": "departments",
                "dc": [
                    "api-connectors",
                    "com"
                ]
            },
            "commonName": "products",
            "member": {
                "cn": "kumarv",
                "ou": "people",
                "dc": [
                    "api-connectors",
                    "com"
                ]
            }
        }
    ],
    "targetMetadata": {},
    "timestamp": 1406155542438,
    "duration": 781,
    "applicationName": "volos-ldap",
    "count": 2
}
```

The LDAP-to-REST mapping is enabled by simple JSON configuration. Here is a sample:

```
   "restMap" : {
        "engineering":  {
            base: "cn=engineering,ou=departments,dc=api-connectors,dc=com",
            attributesBasic:  {'dn' : 'distinguishedName', 'member' : 'member'},
            attributesExpanded: '*',
            attributesId: '*',
            queryParameters : {
            },
            path: '/departments/engineering'
        },
        "products":  {
            base: "cn=products,ou=departments,dc=api-connectors,dc=com",
            attributesBasic:  {'dn' : 'distinguishedName', 'member' : 'member'},
            attributesExpanded: '*',
            attributesId: '*',
            queryParameters : {
            },
            path: '/departments/products'
        }
```

To get a larger result set, use the query parameter ``expand=true``. This option uses the ``attributesExpanded`` mapping statment instead of the default ``attributesBasic`` statement.  This option gives you the flexibility to have a small message payload for a subset of attributes if those are all that are required.

# Installation

The ``volos-ldap`` module is designed for Node.js and is available through npm:

```
$ npm install volos-ldap
```


# Usage

There are two examples below, one basic example and one that uses the ``avault`` (Apigee Vault) Node.js module, which is a secure local storage module. Apigee Vault is used to encrypt sensitive login credentials sent to the backend database.

### Simple example without Apigee Vault

The example below shows a simple usage of the ``volos-ldap`` connector using the ``http`` module to proxy requests to the connector.  

>In this example, credentials and the LDAP server endpoint are specified in plaintext. This is not a best practice.ß

```
var ldapConnector = require('volos-ldap');
var http = require('http');
var restMap = require('./configuration.js');

var profile = {
  host: 'myldapserver.com',
  port: '5323',
  binddn: "cn=Manager,dc=api-connectors,dc=com",
  credentials: "myldap-password"
};

var ldapConnectorObject = new ldapConnector.LdapConnector({"profile": profile, "configuration": configuration});

var svr = http.createServer(function (req, resp) {
  ldapConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9089, function () {
    ldapConnectorObject.initializePaths(restMap);
    console.log(ldapConnectorObject.applicationName + ' node server is listening');
});

```


### Simple example using the Apigee Vault for local secure storage

This example shows the usage of the ``avault`` module to provide a secure local storage option for credentials and endpoint configuration.  

This example assumes you have configured a vault and loaded a configuration profile with a key '*my_profile_key*'. See the section "[LDAP connection profile](#ldap-connection-profile)" below for a quick example. For a complete description of the ``avault`` module see the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

```
var ldapConnector = require('volos-ldap');
var http = require('http');
var vault = require('avault').createVault(__dirname);
var restMap = require('./configurations.js');

var ldapConnectorObject;

vault.get('my_profile_key', function (profileString) {
  if (!profileString) {
    console.log('Error: required vault not found.');
  } else {
    var profile = JSON.parse(profileString);

    var svr = http.createServer(function (req, resp) {
      ldapConnectorObject.dispatchRequest(req, resp);
    });

    svr.listen(9089, function () {
            ldapConnectorObject = new ldapConnector.LdapConnector({"profile": profile, "restMap": restMap});
            ldapConnectorObject.initializePaths(restMap);
            console.log(ldapConnectorObject.applicationName + ' node server is listening');
    });
  }
});
```


# Getting started with your app

To use this connector you need two things: 

* a correctly configured LDAP server connection, and 
* an LDAP-to-REST mapping file. 

Let's start by configuring a connection and testing it with the default mapping file. After that, we'll dive into the details of customizing the mapping file. 


### LDAP connection profile

The LDAP configuration profile is used by the connector to establish a connection to the backend LDAP server. The profile includes the following fields:

* **host** - The host IP address for the LDAP server.
* **port** - The port number for the LDAP server. 
* **binddn** - The distinguished name for an LDAP entry. For example,  `cn=Manager,dc=api-connectors,dc=com`
* **credentials** - The password used to access the LDAP server. 

**Example:**
```
var profile = {
  host: 'myldapserver.com',
  port: '5323',
  binddn: "cn=Manager,dc=api-connectors,dc=com",
  credentials: "myldap-password"
};
```

### Optional: Encrypting the connection profile with Apigee Vault 

The ``avault`` module provides local, double-key encrypted storage of sensitive information such as credentials and system endpoints.  This provides an option to store these kinds of data in a format other than `text/plain`.

In order to insert a value into the vault a command-line tool is provided called `vaultcli`.  This tool comes with the `avault` module.  Here's an example:

```
    ./node_modules/avault/vaultcli.js --verbose --value='{"host":"my-ldap-server-ip", "port": "my-ldap-port", "binddn": "my-dn", "credentials": my-ldap-password"}' my-profile-name
```

Note that these are the same keys that are required in the plaintext version of the profile.  If this command completes successfully you will find two new files: `store.js` and `keys.js`. Place them in the root directory of the ``volos-ldap`` module. 

For more detailed usage of the `avault` module refer to the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

# LDAP to REST mapping

The file ``configurations.js`` contains the information that maps LDAP distinguished name attributes to RESTful API resources. The file is JSON, and the pattern you need to follow to configure your mappings is fairly straightforward. Let's see how this works.

### Understanding the mapping file structure

The ``configurations.js`` mapping file consists of a repeating pattern of JSON elements that map  LDAP queries to REST API resources and query parameters. The pattern looks like this (your mappings will be specific to your LDAP database):

```
    "engineering":  {
            base: "cn=engineering,ou=departments,dc=api-connectors,dc=com",
            attributesBasic:  {'dn' : 'distinguishedName', 'member' : 'member'},
            attributesExpanded: '*',
            attributesId: '*',
            queryParameters : {
            },
            path: '/departments/engineering'
    },
```

Let's look at the parts one by one:

* **engineering** - The element is the REST resource name that will map to the specified LDAP attributes. So, you might call this API like this: `http://localhost:9056/engineering`.
* **base** - Specifies the LDAP relative distinguished names that will be mapped to the resource name. These RDNs must be in the LDAP entry specified when you configured the connection.
* **attributesBasic** - Specifies a subset of attribute names that you wish to return.
* **attributesExpanded** - Specifies an expanded list of attributes. The wildcard returns all attributes. 
* **attributesId** - Lets you search for attributes by their id.
* **queryParameters** - Lets you filter the response. 
* **path** - The REST resource path for this API.

### POSTing to the LDAP server

You can define a mapping that does a POST to the LDAP server. For example, the following mapping lets you add a person by POSTing to ``/people``:

````
"postpeople": {
            restSemantic: "POST",
            idName: 'cn',
            base: "ou=people,dc=api-connectors,dc=com",
            attributesBasic: [{'cn' : 'cn'}],
            attributesExpanded: {'dn' : 'distinguishedName', 'cn' : 'commonName', 'sn' : 'surname'},
            attributesId: {'dn' : 'distinguishedName', 'cn' : 'commonName', 'sn' : 'surname', 'userPassword' : 'password'},
            queryParameters : {
                verify: '{verify}'
            },
            credentialsInformation : {
                attributeNameUser: "cn",
                attributeNamePassword: "userPassword",
                canEdit: true
            },
            path: '/people'
        }
````
* **restSemantic** - The HTTP verb for this API. 
* **idName** - ???
* **base** - Specifies the LDAP relative distinguished names that will be mapped to the resource name. These RDNs must be in the LDAP entry specified when you configured the connection.
* **attributesBasic** - Specifies a subset of attribute names that you wish to POST.
* **attributesExpanded** - Specifies an expanded list of attributes to POST. The wildcard returns all attributes. 
* **attributesId** - ??
* **queryParameters** - ??
* **credentialsInformation** - ??
* **path** - Specifies the URI resource endpoint for the REST call. 

The API call for this mapping might look like this:
??? do we have a test POST I can paste in here? Not sure how to form the payload.

````
    curl -H "Content-type:application/json" -X POST \
    http://localhost:9056/people \
    -d { ??? }
````

License
-------
MIT
