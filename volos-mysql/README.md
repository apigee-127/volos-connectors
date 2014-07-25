# Volos MySQL connector

The Volos MySQL connector is a Node.js module that lets you perform CRUD operations on a MySQL database using a RESTful API.  It is one of the Volos Node.js modules from Apigee. The module is designed to work on Apigee Edge but can be run anywhere Node.js applications can run.  You can use this module without any dependency on Apigee.

### Quick example

This module allows you to map SQL queries to RESTful API resources and query parameters. For example, a properly configured SQL connector could map a SQL query like this:

```
'SELECT idpeople FROM example.people'
```
to a RESTful API that you could call like this:

```
$ curl http://localhost:9089/people
```

which generates a JSON response like this:
    
```
{
    "action": "GET",
    "params": {
        "qp": {}
    },
    "path": "/people",
    "url": "/people",
    "data": [
        {
            "idpeople": 0
        },
        {
            "idpeople": 1
        },
        {
            "idpeople": 2
        }
    ],
    "targetMetadata": {},
    "timestamp": 1406238731690,
    "duration": 1576,
    "applicationName": "volos-mysql",
    "count": 3,
    "sql": "SELECT idpeople FROM example.people LIMIT 100"
}
```

The SQL-to-REST mapping is enabled by simple JSON configuration. Here is a sample:

```
'people': {
        queryStringBasic: 'SELECT idpeople FROM example.people',
        queryStringExpanded: 'SELECT * FROM example.people',
        idName: 'idpeople',
        queryParameters: {
            firstname: 'firstname = \'{firstname}\'',
            lastname: 'lastname = \'{lastname}\''
        }
    }
```


To get a larger set of fields per row, use the query parameter ``expand=true``. This option uses the ``queryStringExpanded`` SQL mapping statement instead of the default ``queryStringBasic`` statement.  This option gives you the flexibility to have a small message payload for a subset of fields if those are all that are required.

```
{
    "action": "GET",
    "params": {
        "qp": {
            "expand": "true"
        }
    },
    "path": "/people",
    "url": "/people?expand=true",
    "data": [
        {
            "idpeople": 0,
            "firstname": "John",
            "lastname": "Doe"
        },
        {
            "idpeople": 1,
            "firstname": "Chris",
            "lastname": "Logan"
        },
        {
            "idpeople": 2,
            "firstname": "Susan",
            "lastname": "North"
        }
    ],
    "targetMetadata": {},
    "timestamp": 1406306063184,
    "duration": 894,
    "applicationName": "volos-mysql",
    "count": 11,
    "sql": "SELECT * FROM example.people LIMIT 100"
}
```

# Installation

The ``volos-mysql`` module is designed for Node.js and is available through npm:

```
$ npm install volos-mysql
```

# Usage
There are two examples below, one basic example and one that uses the ``avault`` (Apigee Vault) Node.js module, which is a secure local storage module. Apigee Vault is used to encrypt sensitive login credentials sent to the backend database.

### Simple example without Apigee Vault

The example below shows a simple usage of the ``volos-mysql`` connector using the ``http`` module to proxy requests to the connector.  

>**Note:** In this example, credentials and the database endpoint are specified in plaintext. This is not a best practice.

```
var mysqlConnector = require('volos-mysql');
var http = require('http');
var restMap = require('./queryToRestMap');

var profile = {
    user: 'volos',
    password: 'volos',
    host: "nsa.rds.amazon.com",
    port: "5432"
};

 var mysqlConnectorObject = new mysqlConnector.MySqlConnector({"profile": profile, "restMap": restMap});

var svr = http.createServer(function (req, resp) {
    mysqlConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9089, function () {
    mysqlConnectorObject.initializePaths(restMap);
    console.log(mysqlConnectorObject.applicationName + ' node server is listening');
});

```

### Simple example using the Apigee Vault for local secure storage

This example shows the usage of the ``avault`` module to provide a secure local storage option for credentials and endpoint configuration.  

This example assumes you have configured a vault and loaded a configuration profile with a key '*my_profile_key*'. See the section "[Database connection profile](#database-connection-profile)" below for a quick example. For a complete description of the ``avault`` module see the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

```
var mysqlConnector = require('volos-mysql');
var http = require('http');
var vault = require('avault').createVault(__dirname);
var restMap = require('./queryToRestMap');

ar mysqlConnectorObject;

vault.get('my_profile_key', function (profileString) {
  if (!profileString) {
    console.log('Error: required vault not found.');
  } else {
    var profile = JSON.parse(profileString);

    var svr = http.createServer(function (req, resp) {
      mysqlConnectorObject.dispatchRequest(req, resp);
    });

    svr.listen(9089, function () {
            mysqlConnectorObject = new mysqlConnector.MySqlConnector({"profile": profile, "restMap": restMap});
            mysqlConnectorObject.initializePaths(restMap);
            console.log(mysqlConnectorObject.applicationName + ' node server is listening');
    });
  }
});
```

# Getting started with your app

To use this connector you need two things:  

* A correctly configured database connection profile _*and*_
* A customized SQL-to-REST mapping file

### Database connection profile

The database configuration profile is used by the connector to establish a connection to the backend database. The profile includes the following fields:

* **user** - The username you use to log on to the database.
* **password** - The password you use to log on to the database.
* **host** - The database host IP address. For example: ``nsa.rds.amazonaws.com``
* **port** - The port of the database.  For example: ``5432``

**Example:**
```
var profile = {
  username: 'volos',
  password: 'volos',
  host: "nsa.rds.amazon.com",
};
```

### Optional: Encrypting the connection profile with Apigee Vault 

The ``avault`` module provides local, double-key encrypted storage of sensitive information such as credentials and system endpoints.  This provides an option to store these kinds of data in a format other than `text/plain`.

In order to insert a value into the vault a command-line tool is provided called `vaultcli`.  This tool comes with the `avault` module.  Here's an example:

```
    $ vaultcli --verbose --value='{"username":"volos", "password": "volos", "host": "nsa.rds.amazon.com", "port":"5432", "database":"volos"}' my-vault-name
```

> **Note:** These are the same keys that are required in the plaintext version of the profile.  If this command completes successfully you will find two new files: `store.js` and `keys.js`. Place them in the root directory of the ``volos-mysql`` module. 

For more detailed usage of the `avault` module refer to the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

# SQL to REST mapping

The file ``queryToRestMap.js`` maps SQL query parameters to RESTful API resources. The file is JSON, and the pattern you need to follow to configure your mappings is fairly straightforward. Let's see how this works.

### Understanding the mapping file structure

The ``queryToRestMap.js`` mapping file consists of a repeating pattern of JSON elements that map  SQL queries to REST API resources and query parameters. A sample pattern for retrieving employee information (GET requests) might look like this:

```
    'employees': {
        queryStringBasic: 'SELECT name, id, hire_date FROM employees',
        queryStringExpanded: 'SELECT * from employees',
        idName: 'employees',
        queryParameters : {
            name: 'name = \'{name}\'',
            id: 'id = \'{id}\'',
            role: 'role = \'{role}\'',
            hire_date: 'hire_date = \'{hire_date}\'',
        }
    },
    'roles': {
        queryStringBasic: 'SELECT role_name, role_id FROM hr.roles',
        queryStringExpanded: 'SELECT * FROM hr.roles',
        idName: 'role_id',
        queryParameters : {
            name: 'role_name = \'{name}\'',
            pay_grade: 'grade = \'{pay_grade}\''
        }
    }
```

Let's look at the parts one by one:

* **employees** and **roles** - The element names become the REST resource names. So, you might call this API like this: 
  
    `curl http://localhost:9089/employees` or `curl http://localhost:9089/roles`

* **queryStringBasic** - A SQL query that can be used to return a subset of the information of the `queryStringExpanded`, if desired. 
                      
* **queryStringExpanded** - An unfiltered (or less filtered) query. The connector uses this query string when you specify the query parameter ``?expand=true``. For example:

    ```
    $ curl http://localhost:9089/employees?expand=true
    ```

* **idName** - The name of the database column to query against.
* **queryParameters** - These let you filter the results of the SQL statement that gets executed. They are translated to WHERE clauses of the SQL statement.  For example, to return a list of employees that were hired on January 1, 2014 you could make this call:

    ```
    $ curl http://localhost:9089/employees?hire_date=2014-01-01
    ```
    This would result in the following SQL being executed:
    ```
    SELECT * FROM hr.employees WHERE hire_date='2014-01-01'
    ```
    You can also use multiple query parameters as you might expect.  This example would return a list of all employees with the role of "manager" hired on January 1, 2014:

    ```
    $ curl http://localhost:9089/employees?hire_date=2014-01-01&role=manager
    ```
    This would result in the following SQL being executed:
    ```
    SELECT * FROM hr.employees WHERE hire_date='2014-01-01' AND role='manager'
    ```

>**Note:** You can customize the query parameter names and they *do not* need to map directly to column names. For example, look at this set of query parameters for our employees example:

```
    queryParameters : {
        name: 'name = \'{name}\'',
        foobar: 'id = \'{foobar}\'',
        lower_id: 'lower(id) = lower(\'{foobar}\')',
        role: 'role = \'{role}\'',
        hire_date: 'hire_date = \'{hire_date}\''
    }
```

In this case the query parameter `foobar` would be mapped to the WHERE clause of the SQL statement for the `id` column.  Also note that `lower_id` includes a call to the `lower(string)` function of MySQL.

### Configuring POST, PUT, and DELETE operations

You configure POST, PUT, and DELETE operations in the same ``queryToRestMap.js`` file. Again, you can follow the example pattern for each verb in the default file. 

Here's an example PUT configuration:

````
 'updateEmployee': {
        restSemantic: "PUT",
        table: 'mycompany.employees',
        path: '/employees',
        queryParameters : {
            name: 'name = \'{name}\'',
            id: 'id = \'{id}\'',
            hire_date: 'hire_date = \'{hire_date}\'',
            department: 'department' = \'{department}\''
        }
    }
````

* **updatePerson** - The name of this element.
* **restSemantic** - Specifies the HTTP verb for this operation.
* **table** - The database table you wish to query.
* **path** - The REST API resource for this operation.
* **queryParameters** - Lets you specify which values to update. 

For example, this call changes an employee's department:

``curl 'http://locahost:9090/employees?id=jdoe&department=hr'``

Here's an example POST mapping. It adds a new employee to the database:

````
'addEmployee': {
        restSemantic: "POST",
        table: 'mycompany.employees',
        path: '/employees'
    }
````

For example:

```
curl -X POST -Content-Type: application/json http://localhost:9090/employees -d {"id": "jdoe", "firstname": "Jim", "lastname": "Doe"} 
```

Follow the same pattern for DELETE operations. Refer to the default ``queryToRestMap.js`` file for more examples. 

### Note the following with regard to query parameters
* If you have a join query you may need to include table aliases for your query parameter statements.
* Don't neglect the escaped quotes (`\'`) if you want the values of your query parameters to be interpreted as strings.

# License

MIT


 