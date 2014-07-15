# Volos S3 connector

The ``volos-s3`` connector lets you perform CRUD operations on an Amazon Web Services Simple Storage Service (S3) account through a RESTful API. 

The Volos S3 connector is a Node.js module that lets you perform CRUD operations an Amazon Web Services Simple Storage Service (S3) account through a RESTful API. It is one of the Volos Node.js modules from Apigee. The module is designed to work on Apigee Edge but can be run anywhere Node.js applications can run.  You can use this module without any dependency on Apigee.

## Quick example

This module maps S3 operations to RESTful API resources and query parameters. For example, this API call asks for a list of buckets:

``curl http://localhost:9058/buckets``

and you get back a JSON response like this:

````[{
    "Buckets": [
        {
            "Name": "com.mycompany.bucket",
            "CreationDate": "2014-07-10T17:23:57.000Z"
        }
    ],
    "Owner": {
        "DisplayName": "jdoe",
        "ID": "<a long string>"
    }
}
````

To get a larger set of attributes, use the query parameter ``expand=true``.  This option gives you the flexibility to have a small message payload for a subset of fields if those are all that are required. For example:

``curl http://localhost:9058/buckets?expand=true``

# Installation

The ``volos-s3`` module is designed for Node.js and is available through npm:

```
$ npm install volos-s3
```

# Usage

There are two examples below, one basic example and one that uses the ``avault`` (Apigee Vault) Node.js module, which is a secure local storage module. Apigee Vault is used to encrypt sensitive login credentials sent to the backend database.

## Simple example without Apigee Vault

The example below shows a simple usage of the ``volos-s3`` connector using the ``http`` module to proxy requests to the connector.  Note that you need to specify your S3 credentials (not a best practice).


```
var s3Connector = require('volos-s3');
var http = require('http');

var profile = {
  accessKeyId: 'myaccesskeyid',
  secretAccessKey: 'mysecretkey'
};

var s3ConnectorObject = new s3Connector.s3Connector({"profile": profile});

var svr = http.createServer(function (req, resp) {
  s3ConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9089, function () {
  console.log('volos-s3 node server is listening');
});

```

## Simple example using the Apigee Vault for local secure storage

This example shows the usage of the ``avault`` module to provide a secure local storage option for credentials and endpoint configuration.  

This example assumes you have configured a vault and loaded a configuration profile with a key '*my_profile_key*'. See the section "S3 configuration profile" below for a quick example. For a complete description of the ``avault`` module see the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

```
var s3Connector = require('volos-s3');
var http = require('http');
var vault = require('avault').createVault(__dirname);

var s3ConnectorObject;

vault.get('my_profile_key', function (profileString) {
  if (!profileString) {
    console.log('Error: required vault not found.');
  } else {
    var profile = JSON.parse(profileString);

    var svr = http.createServer(function (req, resp) {
      s3ConnectorObject.dispatchRequest(req, resp);
    });

    svr.listen(9089, function () {
      s3ConnectorObject = new s3Connector.s3Connector({"profile": profile});
      console.log('volos-s3 node server is listening');
    });
  }
});
```

# Getting started with your app

To use this connector you need a correctly configured S3 connection for your AWS S3 account.

## S3 connection profile

The S3 configuration profile is used by the connector to establish a connection to the backend S3 data store. The profile includes the following fields:

* **acessKeyId** - The access key ID for your Amazon Web Services S3 account.
* **secretAccessKey** - The secret access key for your Amazon Web Services S3 account. 

**Tip:** Log in to your S3 account to find your security credentials, including AWS access keys.

**Example:**
```
var profile = {
  accessKeyId: 'myaccesskeyid',
  secretAccessKey: 'mysecretkey'
};
```

## Optional: Encrypting the connection profile with Apigee Vault 

The ``avault`` module provides local, double-key encrypted storage of sensetive information such as credentials and system endpoints.  This provides an option to store these kinds of data in a format other than `text/plain`.

In order to insert a value into the vault a command-line tool is provided called `vaultcli`.  This tool comes with the `avault` module.  Here's an example:

```
    $ vaultcli --verbose --value='{"accessKeyId":"myaccesskeyid", "secretAccessKey": "mysecretaccesskey"}' my-vault-name
```

Note that these are the same keys that are required in the plaintext version of the profile.  If this command completes successfully you will find two new files: `store.js` and `keys.js`. Place them in the root directory of the ``volos-s3`` module. 

For more detailed usage of the `avault` module refer to the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

# Using the S3 connector

If you run the Node.js server and call the API like this:

``curl http://localhost:9058/``

The server will return the following API usage information:

```
{
    "usage": {
        "Commands": [
            "GET /buckets/:bucketid/object  Query Parameters: delimiter, encodingType, key",
            "PUT /buckets/:bucketid/object",
            "DELETE /buckets/:bucketid/object",
            "GET /buckets/:bucketid  Query Parameters: delimiter, encodingType, marker, prefix",
            "GET /buckets"
        ],
        "Common Optional Parameters": [
            "limit=<maxResults>",
            "expand=true"
        ]
    }
}
```

For example, to get a list of all of your buckets:

``curl http://localhost:9056/buckets``

To get a list of all the objects in a bucket, try this command:

``curl http://localhost:9056/buckets/mybucketid``

You'll get a response that looks something like this:

````
{
    "IsTruncated": false,
    "Marker": null,
    "Contents": [
        {
            "Key": "glyphicons_064_lightbulb.png",
            "LastModified": "2014-07-10T23:38:32.000Z",
            "ETag": "\"19e7761f59806fe3b74ab72edcfbf4ba\"",
            "Size": 1553,
            "StorageClass": "STANDARD",
            "Owner": {
                "DisplayName": "<myname>",
                "ID": "<a long string>"
            }
        },
        {
            "Key": "glyphicons_181_download_alt.png",
            "LastModified": "2014-07-10T23:38:35.000Z",
            "ETag": "\"2e801ecde8b8706e8c8ecda63ba3aca3\"",
            "Size": 1289,
            "StorageClass": "STANDARD",
            "Owner": {
                "DisplayName": "<myname>",
                "ID": "<a long string>"
            }
        },
    ...
````


To add an object to a bucket:

``curl -X PUT -H Content-Type: application/json http://localhost:9056/buckets/<bucketId>/object?Key=<theObjectKey> -d {./myfile}

# License

MIT








