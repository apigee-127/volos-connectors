var debug = require('debug')('volos-serverbase');
var serverBase = require('./serverBase.js');
var Q = require('q');

var SqlServerBase = function() {
}

SqlServerBase.prototype = Object.create(new serverBase.ServerBase());
SqlServerBase.prototype = new serverBase.ServerBase();

SqlServerBase.prototype.supplyHelpObject = function() {
    return(this.restMap);
}

SqlServerBase.prototype.prepareRequest = function(req, resp) {
    var dfd = Q.defer();

    var stuff = {};
    var found = false;

    console.log('\nRequest: ' + req.method + ' ' + req.url);

    switch (req.method) {
        case 'GET':
        case 'DELETE':
            found = true;
            if (this.restMap[req._parsedUrl.key] != undefined) {
                stuff.found = true;
                var queryInfo = this.restMap[req._parsedUrl.key];
                stuff.queryInfo = queryInfo;
            }
            dfd.resolve(stuff);
            break;

        case 'POST':
        case 'PUT':
            found = true;
            var self = this;
            var body = '';
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
                stuff.found = true;
                stuff.postedBody = body;
                var queryInfo = self.restMap[req._parsedUrl.key];
                stuff.queryInfo = queryInfo;
                dfd.resolve(stuff);
            });
    }


    if (!found) {
        var response = {
            errorCode: 404,
            errorMessage: "Not Found"
        };
        stuff.response = response;
        dfd.reject();
    }
    return(dfd.promise);

}

SqlServerBase.prototype.buildQuery = function(req, resp, setupResult) {
    switch(req.method) {
        case 'GET':
            return(this.buildSelect(req, resp, setupResult));
            break;
        case 'PUT':
            return(this.buildUpdate(req, resp, setupResult));
            break;
        case 'POST':
            return(this.buildInsert(req, resp, setupResult));
            break;
        case 'DELETE':
            return(this.buildDelete(req, resp, setupResult));
            break;
        default:
            return('');
    }
}

SqlServerBase.prototype.buildSelect = function(req, resp, setupResult) {
    var queryInfo = setupResult.requestInfo.queryInfo;

    var isExpand = this.getParameter(req.query, 'expand') === "true";

    var queryString = isExpand ? queryInfo.queryStringExpanded : queryInfo.queryStringBasic;
    queryString = this.addWhereClause(req, queryInfo, queryString);

    var orderby = this.getParameter(req.query, 'orderby', null);
    if (orderby) {
        queryString = this.addOrderBy(queryString, orderby);
    }

    var limit = this.getParameter(req.query, 'limit', "100");
    queryString += " LIMIT " + limit;

    console.log("SQL Query:", queryString);
    return(queryString);
}

SqlServerBase.prototype.buildInsert = function(req, resp, setupResult) {
    var queryInfo = setupResult.requestInfo.queryInfo;

    //command: INSERT INTO apigee.people (idpeople,firstname, lastname) VALUES(5,"John", "Smith");

    var command = 'INSERT INTO ' + queryInfo.table + ' (';
    var body = setupResult.requestInfo.postedBody;
    var formVars = this.parseFormvars(body);

    // names -->
    var first = true;
    for (var item in formVars) {
        if (first) {
            first = false;
        } else {
            command += ',';
        }
        command += item;
    }
    // <-- names
    command += ') VALUES(';

    // values -->
    first = true;
    for (var item in formVars) {
        if (first) {
            first = false;
        } else {
            command += ',';
        }
        command += formVars[item];
    }
    // <-- values
    command += ')';

    console.log("SQL Statment:", command);
    return(command);

}

SqlServerBase.prototype.buildUpdate = function(req, resp, setupResult)
{
    var queryInfo = setupResult.requestInfo.queryInfo;

    //command: UPDATE table_name SET column1=value1,column2=value2,...WHERE some_column=some_value;

    var command = 'UPDATE ' + queryInfo.table + ' SET ';
    var body = setupResult.requestInfo.postedBody;
    var formVars = this.parseFormvars(body);

    var first = true;
    for (var item in formVars) {
        if (first) {
            first = false;
        } else {
            command += ',';
        }
        command += (item + '="' + formVars[item]) + '"';
    }
    command = this.addWhereClause(req, queryInfo, command);

    console.log("SQL Statment:", command);
    return(command);
}


SqlServerBase.prototype.buildDelete = function(req, resp, setupResult)
{
    var queryInfo = setupResult.requestInfo.queryInfo;

    //command: DELETE FROM table_name WHERE some_column=some_value;

    var command = 'DELETE FROM ' + queryInfo.table;
    command = this.addWhereClause(req, queryInfo, command);

    console.log("SQL Statment:", command);
    return(command);

}

SqlServerBase.prototype.addWhereClause = function(req, queryInfo, queryString)
{
    var nonstockQueryParameters = {};
    var query = req.query;

    for (var key in query) {
        if (query.hasOwnProperty(key) && key !== 'expand' && key !== 'limit' && key !== 'orderby') {
            nonstockQueryParameters[key] = query[key];
        }
    }

    var id = req.params.id;
    if (id) {
        queryString = this.addWhere(queryString, queryInfo.idName + '=\'' + id + '\'');
    }

    for (var key in nonstockQueryParameters) {
        if (queryInfo.queryParameters[key] != undefined) {
            var whereFragment =  queryInfo.queryParameters[key];
            var templatedWhereFragment = whereFragment.replace('{' + key + '}', nonstockQueryParameters[key]);
            queryString = this.addWhere(queryString, templatedWhereFragment);
        }
    }

    return(queryString);
}

SqlServerBase.prototype.addWhere = function(queryString, whereFragment)
{
    var where = ' WHERE ';
    var pos = queryString.toUpperCase().indexOf(where);
    if (pos > -1) {
        queryString = queryString.substring(0, pos + where.length) + whereFragment + ' AND ' + queryString.substring(pos + where.length);
    } else {
        queryString += (where + whereFragment);
    }
    return(queryString);
}

SqlServerBase.prototype.addOrderBy = function(queryString, orderByValue)
{
    var orderBy = ' ORDER BY ';
    var pos = queryString.toUpperCase().indexOf(orderBy);
    if (pos > -1) {
        queryString = queryString.substring(0, pos + orderBy.length) + orderByValue + ',' + queryString.substring(pos + orderBy.length);
    } else {
        queryString += (orderBy + orderByValue);
    }
    return(queryString);
}

exports.SqlServerBase = SqlServerBase;