# Volos SNS connector

The Volos SNS connector is a Node.js module that lets you use Amazon Simple Notification Service (SNS) through a RESTful API. The module is designed to work on Apigee Edge but can be run anywhere Node.js applications can run.  You can use this module without any dependency on Apigee.

### Quick example

This module allows maps SNS operations to RESTful API resources and query parameters. You can perform CRUD operations on objects like subscriptions, publications, and topics. 

For example, you might ask for a list of your SNS subscriptions like this:

``curl http://localhost:9099/subscriptions``

and get back a JSON response like this:

```
{
    "ResponseMetadata": {
        "RequestId": "d6cc8493-8c95-5389-bbe4-c8a9e4de09ec"
    },
    "Subscriptions": [
        {
            "SubscriptionArn": "arn:aws:sns:us-east-1:650324470758:connector-test2:5c3f491e-5c4c-4bed-965f-666c95287211",
            "Owner": "650324470758",
            "Protocol": "sms",
            "Endpoint": "15105526538",
            "TopicArn": "arn:aws:sns:us-east-1:650324470758:connector-test2"
        },
    ...
```

To get a larger set of attributes, use the query parameter ``expand=true``.  This option gives you the flexibility to have a small message payload for a subset of fields if those are all that are required. For example:

``curl http://localhost:9058/subscriptions?expand=true``

# Installation

The ``volos-sns`` module is designed for Node.js and is available through npm:

```
$ npm install volos-sns
```

# Usage

There are two examples below, one basic example and one that uses the ``avault`` (Apigee Vault) Node.js module, which is a secure local storage module. Apigee Vault is used to encrypt sensitive login credentials sent to the backend database.

### Simple example without Apigee Vault

The example below shows a simple usage of the ``volos-sns`` connector using the ``http`` module to proxy requests to the connector.  Note that you need to specify your SNS credentials (not a best practice).


```
var snsConnector = require('volos-sns');
var http = require('http');

var profile = {
  region: 'myregion'
  accessKeyId: 'myaccesskeyid',
  secretAccessKey: 'mysecretkey'
};

var snsConnectorObject = new snsConnector.snsConnector({"profile": profile});

var svr = http.createServer(function (req, resp) {
  snsConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9089, function () {
  console.log('volos-sns node server is listening');
});

```


### Simple example using the Apigee Vault for local secure storage

This example shows the usage of the ``avault`` module to provide a secure local storage option for credentials and endpoint configuration.  

This example assumes you have configured a vault and loaded a configuration profile with a key '*my_profile_key*'. See the section "SNS configuration profile" below for a quick example. For a complete description of the ``avault`` module see the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

```
var snsConnector = require('volos-sns');
var http = require('http');
var vault = require('avault').createVault(__dirname);

var snsConnectorObject;

vault.get('my_profile_key', function (profileString) {
  if (!profileString) {
    console.log('Error: required vault not found.');
  } else {
    var profile = JSON.parse(profileString);

    var svr = http.createServer(function (req, resp) {
      snsConnectorObject.dispatchRequest(req, resp);
    });

    svr.listen(9089, function () {
      snsConnectorObject = new snsConnector.snsConnector({"profile": profile});
      console.log('volos-sns node server is listening');
    });
  }
});
```


# Getting started with your app

To use this connector you need a correctly configured SNS connection for your AWS SNS account. 

### SNS connection profile

The SNS configuration profile is used by the connector to establish a connection to the backend SNS account. The profile includes the following fields:

* **region** - The AWS region. 
* **acessKeyId** - The access key ID for your Amazon Web Services SNS account.
* **secretAccessKey** - The secret access key for your Amazon Web Services SNS account. 

**Tip:** Log in to your SNS account to find your security credentials, including AWS access keys.

**Example:**
```
var profile = {
  region: 'myregion',
  accessKeyId: 'myaccesskeyid',
  secretAccessKey: 'mysecretkey'
};
```

### Optional: Encrypting the connection profile with Apigee Vault 

The ``avault`` module provides local, double-key encrypted storage of sensetive information such as credentials and system endpoints.  This provides an option to store these kinds of data in a format other than `text/plain`.

In order to insert a value into the vault a command-line tool is provided called `vaultcli`.  This tool comes with the `avault` module.  Here's an example:

```
    $ vaultcli --verbose --value='{"region"; "myregion", "accessKeyId":"myaccesskeyid", "secretAccessKey": "mysecretaccesskey"}' my-vault-name
```

Note that these are the same keys that are required in the plaintext version of the profile.  If this command completes successfully you will find two new files: `store.js` and `keys.js`. Place them in the root directory of the ``volos-sns`` module. 

For more detailed usage of the `avault` module refer to the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

# Using the S3 connector

If you run the Node.js server and call the API like this:

``curl http://localhost:9058/``

The server will return the following API usage information:


```
{
    "usage": {
        "Commands": [
            "GET /subscriptions  Query Parameters: arn",
            "POST /subscriptions  FormVars: arn, phone",
            "DELETE /subscriptions  Query Parameters: arn",
            "POST /publications  FormVars: message, subject, arn",
            "POST /topics  FormVars: name, displayName",
            "GET /topics  Query Parameters: arn",
            "GET /platformApplications  Query Parameters: arn"
        ],
        "Common Optional Parameters": [
            "limit=<maxResults>",
            "expand=true"
        ]
    }
}
```


For example, to get a list of all of your subscriptions:

``curl http://localhost:9099/subscriptions``

To get a list of all the objects in a specific subscription:

``curl http://localhost:9099/subscriptions?arn=arn:aws:sns:us-east-1:650324470758:emailsupport:cd7ac02f-07a2-410a-b3c4-6ea6b51cdfb5``

You might get a response like this:

````
{
    "ResponseMetadata": {
        "RequestId": "afdad9f2-edad-591f-b71c-95c88b8afca2"
    },
    "Attributes": {
        "Owner": "650324470758",
        "ConfirmationWasAuthenticated": "false",
        "Endpoint": "support@apigee.com",
        "RawMessageDelivery": "false",
        "Protocol": "email",
        "TopicArn": "arn:aws:sns:us-east-1:650324470758:emailsupport",
        "SubscriptionArn": "arn:aws:sns:us-east-1:650324470758:emailsupport:cd7ac02f-07a2-410a-b3c4-6ea6b51cdfb5"
    }
}
````


To send a push notification to a phone:

??? need to get the correct call for this???

``curl -X POST 'http://localhost:9099/subscriptions?arn=arn:aws:sns:us-east-1:650324470758:emailsupport:cd7ac02f-07a2-410a-b3c4-6ea6b51cdfb5&phone=13035555555' -d {???} ``











