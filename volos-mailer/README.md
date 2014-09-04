# Volos Mailer connector

The Volos Mailer connector lets you send email messages through a RESTful API. It is one of the Volos Node.js modules from Apigee. The module is designed to work on Apigee Edge but can be run anywhere Node.js applications can run.  You can use this module without any dependency on Apigee.

### Quick example

To send an email with this connector, simply send an HTTP request to the ``/mail`` resource. A set of query parameters are used to specify the parts of the email such as from, to, subject, and message. 

For example, you might send an email through the connector like this:

```
curl 'http://localhost:9089/mail?from=me@example.com&to=you@example.com&subject=Hello%20world&html=<b>Just%20saying%20hello!</b>'
```

Alternatively, you can send email using POST through the connector like this:

```
curl -X POST http://localhost:9057/mail -d '{"from": "me at the corner.com<blah@mememe.com>", "to": "someguy@somecompany.com", "subject": "Just% Saying Goodbye", "html": "<b>yes sir</b>"}' -H 'Content-Type: application/json
```

# Installation

The ``volos-mailer`` module is designed for Node.js and is available through npm:

```
$ npm install volos-mailer
```

# Usage

There are two examples below, one basic example and one that uses the ``avault`` (Apigee Vault) Node.js module, which is a secure local storage module. Apigee Vault is used to encrypt sensitive login credentials sent to the backend mail service.

### Simple example without Apigee Vault

The example below shows a simple usage of the ``volos-mailer`` connector using the ``http`` module to proxy requests to the connector.  

>In this example, credentials and the mail server endpoint are specified in plaintext. This is not a best practice.


```
var nodemailerConnector = require('volos-mailer');
var http = require('http');

var profile = {
  host: 'mymailserver.example.com',
  port: '5432',
  auth: {"user":"myusername","pass":"mypass"}
};

var nodemailerConnectorObject = new nodemailerConnector.NodemailerConnector({"profile": profile});

var svr = http.createServer(function (req, resp) {
  nodemailerConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9089, function () {
  nodemailerConnectorObject.initializePaths(nodemailerConnectorObject.configuration.restMap);
  console.log(nodemailerConnectorObject.applicationName + ' node server is listening');
});

```


### Simple example using the Apigee Vault for local secure storage

This example shows the usage of the ``avault`` module to provide a secure local storage option for credentials and endpoint configuration.  

This example assumes you have configured a vault and loaded a configuration profile with a key '*my_profile_key*'. See the section "[Mailer connection profile](#mailer-connection-profile)" below for a quick example. For a complete description of the ``avault`` module see the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

```
var mailerConnector = require('volos-mailer');
var http = require('http');
var vault = require('avault').createVault(__dirname);

var mailerConnectorObject;

vault.get('my_profile_key', function (profileString) {
  if (!profileString) {
    console.log('Error: required vault not found.');
  } else {
    var profile = JSON.parse(profileString);

    var svr = http.createServer(function (req, resp) {
      mailerConnectorObject.dispatchRequest(req, resp);
    });

    svr.listen(9089, function () {
      mailerConnectorObject = new mailerConnector.mailerConnector({"profile": profile});
      console.log(nodemailerConnectorObject.applicationName + ' node server is listening');
    });
  }
});
```


# Getting started with your app

To use this connector you need to configure the Volos Mailer connection profile, start the Node.js server, and then you can start sending emails.

### Mailer connection profile

This connector is requires the Node.js module called ``nodemailer``. This module allows you to connect directly to an SMTP server or to some "well known" mail services, like Gmail and Hotmail. 

You can find a complete list of these connection parameters at https://www.npmjs.org/package/nodemailer.

To configure the connection, you'll need this information:

* **host** - The hostname of the SMTP server. 
* **port** - The port number for the SMTP server. (default: 25; only needed if you are connecting to a SMPT server)
* **auth** - A JSON object with two elements:
    - **user** - The username you use for your email service.
    - **pass** - The password for you email service. 

**Example:**
If you are connecting directly to a SMTP server, follow this pattern:
```
var profile = {
  host: 'mymailserver.example.com',
  port: '5432',
  auth: {"user":"myusername","pass":"mypass"}
};
```

**Example:**
If you are connecting directly through one of the well known mail services, follow this pattern:
```
var profile = {
  host: 'Gmail',
  auth: {"user":"myusername","pass":"mypass"}
};
```

### Optional: Encrypting the connection profile with Apigee Vault 

The ``avault`` module provides local, double-key encrypted storage of sensitive information such as credentials and system endpoints.  This provides an option to store these kinds of data in a format other than `text/plain`.

In order to insert a value into the vault a command-line tool is provided called `vaultcli`.  This tool comes with the `avault` module.  Here's an example:

```
    ./node_modules/avault/vaultcli.js --verbose --value='{"host":"my-smtp-server-address", "port": "my-smtp-server-port", "auth": {"user": "my-email username", "pass":"my-email-password"}}' my-profile-name
```

If you are using one of the well known email services, the command-line usage follows this pattern:

```
    ./node_modules/avault/vaultcli.js --verbose --value='{"host":"Gmail",  "auth": {"user": "my-gmail-username", "pass":"my-gmail-password"}}' my-vault-name
```

>These are the same keys that are required in the plaintext version of the profile.  If this command completes successfully you will find two new files: `store.js` and `keys.js`. Place them in the root directory of the ``volos-mailer`` module. 

For more detailed usage of the `avault` module refer to the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

### Sending an email

To send an email through the API, simply send a request to the ``/mail`` resource and provide these **required** query parameters:

* **from** - Who the email is from.
* **to** - The email address to send to.
* **subject** - Text that will appear in the email Subject line.
* **html** or **text** -- The body of the message (can be either in HTML or plain text formats). 

Remember to escape invalid URL characters, like white space. For example:

```
curl 'http://localhost:9057/mail?from=myemail@gmail.com&to=youremail@gmail.com&subject=Hello%20world&html=<b>Just%20saying%20hello!</b>'
```

> **Tip:** You can also specify any of these optional query parameters:

'cc', 'bcc', 'replyTo', 'inReplyTo', 'references', 'generateTextFromHTML', 'envelope', 'messageId', 'date', 'encoding', 'charset'

A successful response looks something like this:

```
Message sent: 250 2.0.0 OK 1405104395 d4sm8260652igc.5 - gsmtp
{
    "message": "250 2.0.0 OK 1405104395 d4sm8260652igc.5 - gsmtp",
    "messageId": "c4864d7712f67066f79962191344e4@my-macbook-air.local"
}
```

For more information about Nodemailer, see the [Nodemailer page on GitHub](https://github.com/andris9/Nodemailer).

# License

MIT

