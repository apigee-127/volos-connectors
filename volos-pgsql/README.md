# Volos PostgreSQL connector 


The Volos PostgreSQL connector is a Node.js module that lets you fetch data from a Postgres database using a RESTful API.  It is one of the Volos Node.js modules from Apigee. The module is designed to work on Apigee Edge but can be run anywhere Node.js applications can run.  You can use this module without any dependency on Apigee.

### Quick example

The module allows you to map SQL queries to RESTful API resources and query parameters. For example, a properly configured SQL connector could map a SQL query like this:

```
SELECT emp_name, emp_id FROM employees WHERE emp_id='jdoe'
```
to a RESTful API that you could call like this:

```
$ curl http://localhost:9089/employees/jdoe
```

which generates a JSON response like this:
    
```
{
    "action": "GET",
    "params": {
        "qp": {}
    },
    "path": "/employees/jdoe",
    "url": "/employees/jdoe",
    "data": [
        {
            "id_emp": "jdoe",
            "emp_name": "John Doe"
        }
    ],
    "timestamp": 1405541648766,
    "duration": 248,
    "applicationName": "volos-pgsql",
    "count": 1,
    "sql": "SELECT id_emp, emp_name FROM public.employees WHERE id_emp='jdoe' LIMIT 100"
}
```

The SQL-to-REST mapping is enabled by simple JSON configuration:

```
  'employees': {
    queryStringBasic: 'SELECT id_emp, emp_name FROM public.employees',
    queryStringExpanded: 'SELECT * FROM public.employees',
    idName: 'id_emp',
    queryParameters: {
      role: 'id_role = \'{role}\'',
      hire_date: 'hire_date = \'{hire_date}\''
    }
  },
```


To get a larger set of fields per row, use the query parameter ``expand=true``. This option uses the ``queryStringExpanded`` SQL mapping statment instead of the default ``queryStringBasic`` statement.  This option gives you the flexibility to have a small message payload for a subset of fields if those are all that are required.

```
{
    "action": "GET",
    "params": {
        "qp": {
            "expand": "true"
        }
    },
    "path": "/employees/jdoe",
    "url": "/employees/jdoe?expand=true",
    "data": [
        {
            "id_emp": "jdoe",
            "emp_name": "John Doe",
            "hire_date": "1978-06-27T07:00:00.000Z",
            "id_role": "mechanic"
        }
    ],
    "timestamp": 1405541760716,
    "duration": 382,
    "applicationName": "volos-pgsql",
    "count": 1,
    "sql": "SELECT * FROM public.employees WHERE id_emp='jdoe' LIMIT 100"
}
```

# Installation

The ``volos-pgsql`` module is designed for Node.js and is available through npm:

```
$ npm install volos-pgsql
```

# Usage

There are two examples below, one basic example and one that uses the ``avault`` (Apigee Vault) Node.js module, which is a secure local storage module. Apigee Vault is used to encrypt sensitive login credentials sent to the backend service.


### Simple example without Apigee Vault

The example below shows a simple usage of the ``volos-pgsql`` connector using the ``http`` module to proxy requests to the connector.  

>In this simple example, creditials and the database endpoint are specified in plaintext. This is not a best practice.

```
var pgConnector = require('volos-pgsql');
var http = require('http');
var restMap = require('./queryToRestMap');

var profile = {
  username: 'volos',
  password: 'volos',
  host: "nsa.rds.amazon.com",
  port: "5432",
  database: "volos"
};

var pgConnectorObject = new pgConnector.PgConnector({"profile": profile, "restMap": restMap});

var svr = http.createServer(function (req, resp) {
  pgConnectorObject.dispatchRequest(req, resp);
});

svr.listen(9089, function () {
  pgConnectorObject.initializePaths(restMap);
  console.log(pgConnectorObject.applicationName + ' node server is listening');
});

```

### Simple example using the Apigee Vault for local secure storage

This example shows how to use the ``avault`` module to provide a secure local storage option for credentials and endpoint configuration.  

This example assumes you have configured a vault and loaded a configuration profile with a key '*my_profile_key*'. See the section "[Database connection profile](#database-connection-profile)" below for a quick example showing how to create a vault. For a complete description of the ``avault`` module see the [Apigee Vault page on GitHub](https://github.com/apigee-127/avault). 

```
var pgConnector = require('volos-pgsql');
var http = require('http');
var vault = require('avault').createVault(__dirname);
var restMap = require('./queryToRestMap');

var pgConnectorObject;

vault.get('my_profile_key', function(profileString) {
  if (!profileString) {
    console.log('Error: required vault not found.');
  } else {
    var profile = JSON.parse(profileString);

    var svr = http.createServer(function(req, resp) {
      pgConnectorObject.dispatchRequest(req, resp);

    });

    svr.listen(9089, function() {
      pgConnectorObject = new pgConnector.PgConnector({"profile": profile, "restMap": restMap});
      pgConnectorObject.initializePaths(restMap);
      console.log(pgConnectorObject.applicationName + ' node server is listening');
    });
  }
});
```

# Getting started with your app

To use this connector you need two things:  

* A correctly configured database connection profile _*and*_
* A customized SQL-to-REST mapping file


## Database connection profile

The database configuration profile is used by the connector to establish a connection to the backend database. The profile includes the following fields:

* **username** - The username you use to log on to the database.
* **password** - The password you use to log on to the database.
* **host** - The database host IP address. For example: ``nsa.rds.amazonaws.com``
* **port** - The port of the database.  For example: ``5432``
* **database** - The name of the database you wish to access. 

**Example:**
```
var profile = {
  username: 'volos',
  password: 'volos',
  host: "nsa.rds.amazon.com",
  port: "5432",
  database: "volos"
};
```

### Optional: Encrypting the connection profile with Apigee Vault 

The ``avault`` module provides local, double-key encrypted storage of sensetive information such as credentials and system endpoints.  This provides an option to store these kinds of data in a format other than `text/plain`.

In order to insert a value into the vault a command-line tool is provided called `vaultcli`.  This tool comes with the `avault` module.  Here's an example, to be executed from your project directory::

```
    $ ./node_modules/avault/vaultcli --verbose --value='{"username":"volos", "password": "volos", "host": "nsa.rds.amazon.com", "port":"5432", "database":"volos"}' my-profile-name
```

Note that these are the same keys that are required in the plaintext version of the profile.  If this command completes successfully you will find two new files: `store.js` and `keys.js`. Place them in the root directory of the ``volos-pgsql`` module. 

For more detailed usage of the `avault` module please refer to the avault page on GitHub.

# SQL to REST mapping

The file ``queryToRestMap.js`` maps SQL query parameters to RESTful API resources. The file is JSON, and the pattern you need to follow to configure your mappings is fairly straightforward. Let's see how this works.

> *Note:* For Version 1.0 the ``volos-pgsql`` module only supports Read queries.  Updates will be made in the future for Create, Update and Delete.

### Understanding the mapping file structure

The ``queryToRestMap.js`` mapping file consists of a repeating pattern of JSON elements that map  SQL queries to REST API resources and query parameters. A sample pattern for retrieving employee information (GET requests) might look like this:

```
module.exports = {
  'employees': {
    queryStringBasic: 'SELECT id_emp, emp_name FROM public.employees',
    queryStringExpanded: 'SELECT * FROM public.employees',
    idName: 'id_emp',
    queryParameters: {
      role: 'id_role = \'{role}\'',
      hire_date: 'hire_date = \'{hire_date}\''
    }
  },
  'roles': {
    queryStringBasic: 'SELECT id_role, role_name FROM public.roles',
    queryStringExpanded: 'SELECT * FROM public.roles',
    idName: 'id_role',
    queryParameters: {
      pay_grade: 'pay_grade={pay_grade}'
    }
  },
  'emp_roles': {
    queryStringBasic: 'SELECT e.id_emp, e.emp_name, r.pay_grade FROM public.employees e LEFT OUTER JOIN public.roles r ON e.id_role = r.id_role',
    queryStringExpanded: 'SELECT e.*, r.* FROM public.employees e LEFT OUTER JOIN public.roles r ON e.id_role = r.id_role',
    idName: 'e.id_emp',
    queryParameters: {
      role: 'id_role = \'{role}\'',
      hire_date: 'hire_date = \'{hire_date}\''
    }
  }
}
```

Let's look at the parts one by one:

* **employees** and **roles** - The element names become the REST resource names. So, you might call this API like this: 
  
    ```
    $ curl http://localhost:9089/employees` or `curl http://localhost:9089/roles
    ```

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
    SELECT * FROM public.employees WHERE hire_date='2014-01-01'
    ```
    You can also use multiple query parameters, as you might expect.  This example would return a list of all employees with the role of "manager" hired on January 1, 2014:

    ```
    $ curl http://localhost:9089/employees?hire_date=2014-01-01&role=manager
    ```
    This would result in the following SQL being executed:
    ```
    SELECT * FROM public.employees WHERE hire_date='2014-01-01' AND role='manager'
    ```

>**Note:** You can customize the query parameter names and they *do not* need to map directly to column names. For example, look at this set of query parameters for our employees example:

```
    queryParameters: {
      foobar: 'id_emp = \'{foobar}\'',
      lower_id: 'id_emp = lower(\'{id_emp}\'',
      role: 'id_role = \'{role}\'',
      hire_date: 'hire_date = \'{hire_date}\''
    }
```

In this case the query parameter `foobar` would be mapped to the WHERE clause of the SQL statement for the `id_emp` column.  Also note that `lower_id` includes a call to the `lower(string)` function of PostgreSQL.

### Note the following with regard to query parameters:
* If you have a join query you may need to include table aliases for your query parameter statements.
* Don't neglect the escaped quotes (`\'`) if you want the values of your query parameters to be interpreted as strings.

License
-------
MIT

[avault page on GitHub]:https://github.com/apigee-127/avault
