# Volos Salesforce connector

The Volos Salesforce connector is a Node.js module that lets you fetch data from Salesforce using a RESTful API.  It is one of the Volos Node.js modules from Apigee. The module is designed to work on Apigee Edge but can be run anywhere Node.js applications can run.  You can use this module without any dependency on Apigee.

### Quick example

The module maps Salesforce SOQL queries to RESTful API resources and query parameters. For example, a properly configured Salesforce connector might map a SOQL query like this:

``SELECT id, Owner.Name FROM Opportunity WHERE Owner.Email='jdoe@example.com'``

to a RESTful API that you could call like this:

``curl http://localhost:9009/opportunity?ownerEmail=jdoe@example.com``

and which might generate a JSON response like this:

```[
   {
        "attributes": {
            "type": "Opportunity",
            "url": "/services/data/v2.0/sobjects/Opportunity/00670000XcYHJ3"
        },
        "Id": "00670000XcYHJ3",
        "Owner": {
            "attributes": {
                "type": "User",
                "url": "/services/data/v2.0/sobjects/User/005700002hJ12"
            },
            "Name": "John Doe"
        }
    },
 ...
]
```

The SOQL-to-REST mapping is enabled by simple JSON configuration. Here is a sample:

```
    'opportunity': {
        queryStringBasic: 'SELECT id, Owner.Name FROM Opportunity',
        queryStringExpanded: 'SELECT id, AccountId, Account.Name, RecordType.Name, Owner.Name, Owner.Email FROM Opportunity',
        idName: 'id',
        queryParameters: {
            lastDays: 'lastmodifieddate=LAST_N_DAYS: {lastDays}',
            accountName: 'Account.Name = \'{accountName}\'',
            ownerName: 'Owner.Name = \'{ownerName}\'',
            ownerEmail: 'Owner.Email = \'{ownerEmail}\''
        }
    }
```

To get a larger set of fields per row, use the query parameter ``expand=true``. This option uses the ``queryStringExpanded`` SOQL mapping statment instead of the default ``queryStringBasic`` statement.  This option gives you the flexibility to have a small message payload for a subset of fields if those are all that are required.

# Installation

The ``volos-salesforce`` module is designed for Node.js and is available through npm:

```
$ npm install volos-salesforce
```

# Usage

There are two examples below, one basic example and one that uses the ``avault`` (Apigee Vault) Node.js module, which is a secure local storage module. Apigee Vault is used to encrypt sensitive login credentials sent to the backend database.

### Simple example without Apigee Vault

The example below shows a simple usage of the ``volos-salesforce`` connector using the ``http`` module to proxy requests to the connector.  

>**Note:** In this example, the Salesforce credentials are specified in plaintext. This is not a best practice. 


```
var salesforceConnector = require('volos-salesforce');
var http = require('http');

var profile = {
  username: 'volos',
  password: 'volos',
  securityToken: "mySalesforceSecurityToken"
};

var salesforceConnectorObject = new salesforceConnector.salesforceConnector({"profile": profile});

var svr = http.createServer(function (req, resp) {
  salesforceConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9089, function () {
  console.log('volos-salesforce node server is listening');
});

```

### Simple example using the Apigee Vault for local secure storage

This example shows the usage of the ``avault`` module to provide a secure local storage option for credentials and endpoint configuration.  

This example assumes you have configured a vault and loaded a configuration profile with a key '*my_profile_key*'. See the section "[Salesforce connection profile](#salesforce-connection-profile)" below for a quick example. For a complete description of the ``avault`` module see the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

```
var salesforceConnector = require('volos-salesforce');
var http = require('http');
var vault = require('avault').createVault(__dirname);

var salesforceConnectorObject;

vault.get('my_profile_key', function (profileString) {
  if (!profileString) {
    console.log('Error: required vault not found.');
  } else {
    var profile = JSON.parse(profileString);

    var svr = http.createServer(function (req, resp) {
      salesforceConnectorObject.dispatchRequest(req, resp);
    });

    svr.listen(9089, function () {
      salesforceConnectorObject = new salesforceConnector.salesforceConnector({"profile": profile});
      console.log('volos-salesforce node server is listening');
    });
  }
});
```

# Getting started with your app

To use this connector you need two things:  

* A correctly configured database connection profile _*and*_
* A customized SOQL-to-REST mapping file

### Salesforce connection profile

The database configuration profile is used by the connector to establish a connection to the backend database. The profile includes the following fields:

* **username** - The username you use to log on to your Salesforce account.
* **password** - The password you use to log on to your Salesforce account.
* **securityToken** - The security token for your Salesforce account. 

**Example:**
```
var profile = {
  username: 'volos',
  password: 'volos',
  securityToken: "mySalesforceSecurityToken"
};
```

### Optional: Encrypting the connection profile with Apigee Vault 

The ``avault`` module provides local, double-key encrypted storage of sensetive information such as credentials and system endpoints.  This provides an option to store these kinds of data in a format other than `text/plain`.

In order to insert a value into the vault a command-line tool is provided called `vaultcli`.  This tool comes with the `avault` module.  Here's an example:

```
    ./node_modules/avault/vaultcli.js --verbose --value='{"username":"my-username", "password": "my-password", "securityToken": "my-security-token"}' my-vault-name
```

Note that these are the same keys that are required in the plaintext version of the profile.  If this command completes successfully you will find two new files: `store.js` and `keys.js`. Place them in the root directory of the ``volos-salesforce`` module. 

For more detailed usage of the `avault` module refer to the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

# Salesforce SOQL to REST mapping

The file ``queryToRestMap.js`` contains the infomation that maps SOQL query parameters to RESTful API resources. The file is JSON, and the pattern you need to follow to configure your mappings is fairly straightforward. Let's see how this works.

### Understanding the mapping file structure

The ``queryToRestMap.js`` file consists of a repeating pattern of JSON elements that map  SOQL queries to REST API resources and query parameters. A sample pattern for retrieving data from a Salesforce account might look like this:

```
    'opportunity': {
        queryStringBasic: 'SELECT id, Owner.Name FROM Opportunity',
        queryStringExpanded: 'SELECT id, AccountId, Account.Name, RecordType.Name, Owner.Name, Owner.Email FROM Opportunity',
        idName: 'id',
        queryParameters: {
            lastDays: 'lastmodifieddate=LAST_N_DAYS: {lastDays}',
            accountName: 'Account.Name = \'{accountName}\'',
            ownerName: 'Owner.Name = \'{ownerName}\'',
            ownerEmail: 'Owner.Email = \'{ownerEmail}\''
        }
    },
    'account': {
        queryStringBasic: 'SELECT id, Owner.Name FROM Account',
        queryStringExpanded: 'SELECT id, Owner.Id, Owner.Name, Owner.Email,Owner.Region__c FROM Account',
        idName: 'Id',
        queryParameters: {
            lastDays: 'lastmodifieddate=LAST_N_DAYS: {lastDays}'
        }
    }
    ...
```


Let's look at the parts one by one:

* `'opportunity'` and `'account'` - The element names become the REST resource names. So, you might call this API like this: 
  
    `http://localhost:9089/oportunity?ownerEmail=jdoe@example.com` or

    `http://locahost:9089/account?lastDays=30`

* ``queryStringBasic`` - A SOQL query that can be used to return a subset of the information of the `queryStringExpanded`, if desired. 
                      
* ``queryStringExpanded`` - An unfiltered (or less filtered) query. The connector uses this query string when you specify the query parameter ``?expand=true``. For example:

    ```
    $ curl http://localhost:9089/opportunity?expand=true
    ```

* ``idName`` - The name of the database column to query against.
* ``queryParameters`` - These let you filter the results of the SOQL statement that gets executed. They are translated to WHERE clauses of the SOQL statement.  For example, to return a list of opportunities for a given owner you could make this call:

    ```
    $ curl http://localhost:9089/oportunity?ownerEmail=jdoe@example.com
    ```
    This would result in the following SOQL being executed:
    ```
    SELECT id, Owner.Name FROM Opportunity WHERE Owner.Email='jdoe@example.com'
    ```
    You can also use multiple query parameters as you might expect.  This example would return a list of all opportunities for a given owner over the last 30 days:

    ```
    $ curl http://localhost:9089/opportunity?Owner.Email='jdoe@example.com&lastDays=30
    ```
    This would result in the following SOQL being executed:
    ```
    SELECT id, Owner.Name FROM Opportunity WHERE Owner.Email='jdoe@example.com&LAST_N_DAYS:30
    ```
**Note:** You can customize the query parameter names and they *do not* need to map directly to column names. For example, look at this set of query parameters for our employees example:

```
    queryParameters : {
        name: 'name = \'{name}\'',
        foobar: 'id = \'{foobar}\'',
        role: 'role = \'{role}\'',
        hire_date: 'hire_date = \'{hire_date}\''
    }
```

In this case the query parameter `foobar` would be mapped to the WHERE clause of the SOQL statement for the `id` column.  

### Note the following with regard to query parameters:
* If you have a join query you may need to include table aliases for your query parameter statements
* Don't neglect the escaped quotes (`\'`) if you want the values of your query parameters to be interpreted as strings

License
-------
MIT


