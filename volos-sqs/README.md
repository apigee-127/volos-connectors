# Volos SQS connector

The Volos SQS connector is a Node.js module that lets you use Amazon Simple Queue Service (SQS) through a RESTful API. The module is designed to work on Apigee Edge but can be run anywhere Node.js applications can run.  You can use this module without any dependency on Apigee.

### Quick example

This module allows maps SQS operations to RESTful API resources and query parameters. You can perform CRUD operations on objects like messages and queues. 

For example, you might ask for a list of your SQS subscriptions like this:

``curl http://localhost:9099/queues``

and get back a JSON response like this:

```
{
    "action": "GET",
    "params": {
        "qp": {}
    },
    "path": "/queues",
    "url": "/queues",
    "list": {
        "ResponseMetadata": {
            "RequestId": "799655555-55555-55555-55555-cf14b4bc55555"
        },
        "QueueUrls": [
            "https://sqs.us-east-1.amazonaws.com/650324455555/another2",
            "https://sqs.us-east-1.amazonaws.com/650324455555/another3",
            "https://sqs.us-east-1.amazonaws.com/650324455555/myqueue"
        ]
    },
    "timestamp": 1405525899498,
    "duration": 1545,
    "applicationName": "volos-sqs"
}
    ...
```

To get a larger set of attributes, use the query parameter ``expand=true``.  This option gives you the flexibility to have a small message payload for a subset of fields if those are all that are required. For example:

``curl http://localhost:9058/subscriptions?expand=true``

# Installation

The ``volos-sqs`` module is designed for Node.js and is available through npm:

```
$ npm install volos-sqs
```

# Usage

There are two examples below, one basic example and one that uses the ``avault`` (Apigee Vault) Node.js module, which is a secure local storage module. Apigee Vault is used to encrypt sensitive login credentials sent to the backend database.

### Simple example without Apigee Vault

The example below shows a simple usage of the ``volos-sqs`` connector using the ``http`` module to proxy requests to the connector.  

> **Note:** In this example, the SQS credentials are specified in plaintext. This is not a best practice. 


```
var sqsConnector = require('volos-sqs');
var http = require('http');

var profile = {
  region: 'myregion'
  accessKeyId: 'myaccesskeyid',
  secretAccessKey: 'mysecretkey'
};

var sqsConnectorObject = new sqsConnector.SqsConnector({"profile": profile, "restMap": restMap});

var svr = http.createServer(function (req, resp) {
  sqsConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9089, function () {
  sqsConnectorObject.initializePaths(restMap);
  console.log(sqsConnectorObject.applicationName + ' node server is listening');
});

```


### Simple example using the Apigee Vault for local secure storage

This example shows the usage of the ``avault`` module to provide a secure local storage option for credentials and endpoint configuration.  

This example assumes you have configured a vault and loaded a configuration profile with a key '*my_profile_key*'. See the section "[SQS connection profile](#sns-connection-profile)" below for a quick example. For a complete description of the ``avault`` module see the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

```
var sqsConnector = require('volos-sqs');
var http = require('http');
var vault = require('avault').createVault(__dirname);

var sqs;

vault.get('my-profile-key', function(profileString) {
    if (!profileString) {
        console.log('Error: required vault not found.');
    } else {
        var profile = JSON.parse(profileString);
        var svr = http.createServer(function(req, resp) {
            sqs.dispatchRequest(req, resp);
        });

        svr.listen(9100, function() {
            sqs = new snsConnector.SqsConnector({"profile": profile, configuration: configuration, receiveMessageCallback: receiveMessageCallback});
            sqs.initializePaths(configuration.restMap);
            console.log(sqs.applicationName + ' server is listening');
        });
    }

    function receiveMessageCallback(body, message) {
        var dfd = Q.defer();
        console.log('body: ' + body + ', message: ' + message);
        dfd.resolve('');
        return(dfd.promise);
    }
});
```


# Getting started with your app

To use this connector you need a correctly configured SQS connection for your AWS SQS account. 

### SQS connection profile

The SQS configuration profile is used by the connector to establish a connection to the backend SQS account. The profile includes the following fields:

* **region** - The AWS region. 
* **acessKeyId** - The access key ID for your Amazon Web Services SQS account.
* **secretAccessKey** - The secret access key for your Amazon Web Services SQS account. 

**Tip:** Log in to your SQS account to find your security credentials, including AWS access keys.

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

Note that these are the same keys that are required in the plaintext version of the profile.  If this command completes successfully you will find two new files: `store.js` and `keys.js`. Place them in the root directory of the ``volos-sqs`` module. 

For more detailed usage of the `avault` module refer to the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

# Using the SQS connector

If you run the Node.js server and call the API like this:

``curl http://localhost:9100/``

The server will return the following API usage information:


```
{
    "usage": {
        "Commands": [
            "GET /messages  Query Parameters: queueUrl, maxNumberOfMessages, visibilityTimeout, waitTimeSeconds",
            "POST /messages  FormVars: queueUrl, messageBody  Optioanl FormVars: delaySeconds",
            "DELETE /messages  Query Parameters: queueUrl, receiptHandle",
            "GET /queues/:id",
            "GET /queues  Query Parameters: prefix",
            "POST /queues  FormVars: queueName",
            "PUT /queues  FormVars: queueUrl",
            "DELETE /queues  Query Parameters: queueUrl"
        ],
        "Common Optional Parameters": [
            "limit=<maxResults>",
            "expand=true"
        ]
    }
}
```


For example, to get a list of all of your queues:

``curl http://localhost:9099/queues``

To get a list of all the messages in a specific queue:

```
curl http://localhost:9100/messages?queueUrl=https://sqs.us-east-1.amazonaws.com/555555555555/myqueue
```

You might get a response like this:

````
{
    "action": "GET",
    "params": {
        "qp": {
            "queueUrl": "https://sqs.us-east-1.amazonaws.com/555555555555/myqueue"
        }
    },
    "path": "/messages",
    "url": "/messages?queueUrl=https://sqs.us-east-1.amazonaws.com/555555555555/myqueue",
    "list": {
        "receiveResult": {
            "ResponseMetadata": {
                "RequestId": "5555-5555-5555-ad1e-ec975555364c"
            },
            "Messages": [
                {
                    "MessageId": "437b5555-5555-5555-5555-6c44015555",
                    "ReceiptHandle": "+eXJYhj5rDo/1645555a7fW5555uezfvnYi9PE6gx4m+43C5555/obWbtYqGi5TA5555ndGsE2UpeIh5555s1J1mjyHEFHCzxxP0G9XxPq9T95555Yxc/BQj5555FKwlXqR5555b2ZZnY++JyD/IGQIJgduD2D5555/Ulc7qD9WKkSoCGQXT5555rycoG1NlJuW9wz/mG75555/YS5555I7NMm2msK2DlArdYXnzD535Jw8G51pR55551EGJ6vEMtgNNXQQ=",
                    "MD5OfBody": "9b55552f99d25c52f175b55553c",
                    "Body": "Hello world"
                }
            ]
        },
        "dequeueResult": {
            "ResponseMetadata": {
                "RequestId": "a61ca5555-5555-5555-5555-6c118555525"
            }
        }
    },
    "timestamp": 1405527082391,
    "duration": 4018,
    "applicationName": "volos-sqs"
}
````













