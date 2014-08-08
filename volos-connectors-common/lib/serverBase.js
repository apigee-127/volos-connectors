var http = require('http');
var Q = require('q');
var url = require('url');
var _ = require('lodash');

var ServerBase = function () {
    this.init = false;
    this.doParseBody = true;
    this.regExpForRestMap = [];
    this.defaults = {includeMetadata: true};
}

ServerBase.prototype = Object.create(null);

/**
 * Default Orchestration controller for create a connection, executing a command and tearing down a connection.
 *
 * @param req http request object
 * @param resp http response object
 */
ServerBase.prototype.dispatchRequest = function (req, resp) {
    req._timeIn = new Date();
    if (req.url === '/') { //help?
        this.outputHelp(resp);
    }
    else {
        var self = this;
        this.parseUrl(req);
        this.setup(req, resp).then(
            function (setupResult) {
                self.executeOperation(req, resp, setupResult).then(
                    function (executeOperationResult) {
                        self.teardown(req, resp, setupResult, executeOperationResult).then(
                            function (teardownResult) {
                                dfd.resolve(teardownResult);
                            },
                            function (err) {
                                handleError(req, resp, err, 400, '"teardown" failed');
                            }
                        );
                    },
                    function (err) {
                        handleError(req, resp, err, 400, '"executeOperation" failed');
                    },
                    function (progress) {

                    }
                );
            },
            function (err) {
                self.handleError(req, resp, err, 400, '"setup" failed');
            }
        );
    }
}

// interface -->

/**
 * Creates a connection and authenticates.
 * Upon successful completion, an optional result object can be passed from dfd.resolve(resultObject);
 *
 * @param req http request object
 * @param resp http response object
 */
ServerBase.prototype.initialize = function (restMap) {

}

/**
 * Creates a connection and authenticates.
 * Upon successful completion, an optional result object can be passed from dfd.resolve(resultObject);
 *
 * @param req http request object
 * @param resp http response object
 */
ServerBase.prototype.setup = function (req, resp) {
    var dfd = Q.defer();
    var errorMessage = '"setup" method not implemented';
    var error = {
        errorCode: "500",
        errorMessage: errorMessage

    };
    console.error(errorMessage);
    dfd.reject(error);

    return(dfd.promise);
}

/**
 * Performs operation designated by setup
 * upon successful completion, an optional result object can be passed from dfd.resolve(resultObject);
 *
 * @param req http request object
 * @param resp http response object
 * @param setupResult result object obtained from setup call.
 */
ServerBase.prototype.executeOperation = function (req, resp, setupResult) {
    var dfd = Q.defer();
    var errorMessage = '"executeOperation" method not implemented';
    var error = {
        errorCode: "500",
        errorMessage: errorMessage

    };
    console.error(errorMessage);
    dfd.reject(error);

    return(dfd.promise);
}

/**
 * Performs any necessary cleanup needed to tear down the call.
 * Upon successful completion, an optional result object can be passed from dfd.resolve(resultObject);
 *
 * @param req http request object
 * @param resp http response object
 * @param setupResult result object obtained from setup call.
 * @param executeOperationResult result object obtained from setup call.
 */
ServerBase.prototype.teaddown = function (req, resp, setupResult, executeOperationResult) {
    var dfd = Q.defer();

    // teardown() is optional - ok not to implement.
    dfd.resolve('');

    return(dfd.promise);
}

ServerBase.prototype.supplyHelpObject = function () {
    return({"usage": "No help available"})
}

ServerBase.prototype.getCommonParameters = function () {
    return(['limit=<maxResults>', 'expand=true', 'orderby=<colunmNameList>']);
}


/**
 * Default help formatter - Produces usage help in JSON format.
 * upon successful completion, an optional result object can be passed from dfd.resolve(resultObject);
 *
 * @param restMap object that maps REST facade to backend service
 *
 */
ServerBase.prototype.getHelp = function (restMap) {
    var commands = [];

    for (var i in restMap) {
        var item = restMap[i];
        var path = item.path ? item.path : ('/' + i);
        var restSemantic = item.restSemantic ? item.restSemantic : 'GET';
        var commandline = restSemantic + ' ' + path;
        var first = true;
        for (var qp in item.queryParameters) {
            if (first) {
                commandline += '  Query Parameters: ';
                first = false;
            } else {
                commandline += ', ';
            }
            commandline += this.getTemplateName(item.queryParameters[qp]);
        }

        first = true;
        for (var qp in item.optionalQueryParameters) {
            if (first) {
                commandline += '  Optioanl Query Parameters: ';
                first = false;
            } else {
                commandline += ', ';
            }
            commandline += this.getTemplateName(item.optionalQueryParameters[qp]);
        }

        first = true;
        for (var fv in item.formVars) {
            if (first) {
                commandline += '  FormVars: ';
                first = false;
            } else {
                commandline += ', ';
            }
            commandline += this.getTemplateName(item.formVars[fv]);
        }


        first = true;
        for (var fv in item.optionalFormVars) {
            if (first) {
                commandline += '  Optioanl FormVars: ';
                first = false;
            } else {
                commandline += ', ';
            }
            commandline += this.getTemplateName(item.optionalFormVars[fv]);
        }
        commands.push(commandline);
    }
    var commonParameters = this.getCommonParameters();
    return({"usage": {'Commands': commands, 'Common Optional Parameters': commonParameters}});

}
// <- interface

/**
 * Helper function that, given an array of query parameters, returns the value for a given named parameter
 *
 * @param parameters parameters array of parameters, derived from query parameters
 * @param name parameter of interest
 * @param defaultValue the default value to be returned in the event that the named query parameter was not used.
 */
ServerBase.prototype.getParameter = function (parameters, name, defaultValue) {
    return(parameters[name] !== undefined ? parameters[name] : defaultValue);
}

/**
 * Helper function that, inspects the http request path, and breaks into path fragments: (1) collection(s) and (2) collection ID(s)
 *
 * @param req http request object
 */
ServerBase.prototype.parseUrl = function (req) {
    // use express-compatible names
    var parsedUrl =  url.parse(req.url, true);
    if (!req._parsedUrl) {
        req._parsedUrl = parsedUrl;
    }
    req.query = parsedUrl.query;
    if (!req.params) {
        req.params = {};
    }

    var results = this.findPath(req.url, req.method);
    if (results) {
        req._parsedUrl.key = results.regExpForRestMapItem.key;

        var pathParts = results.regExpForRestMapItem.pathParts;
        req._ids = [];
        var valueIndex = 1;
        for (var i = 0; i < pathParts.length; ++i) {
            var name = pathParts[i];
            if (name.indexOf(':') > -1) {
                var key = name.substring(1);
                var value = results.parts[valueIndex++];
                req._ids.push(value);
                req.params[key] = value; // create express-compatible key-values
            }
        }
    }

}

/**
 * Helper function to parse POSTed or PUTed formvars
 *
 * @param data 'application/x-www-form-urlencoded' key value pairs from POST or PUT.
 */
ServerBase.prototype.parseFormvars = function (data) {
    var formVarsObjects = {}
    var formVars = data.split('&');

    for (var i = 0; i < formVars.length; ++i) {
        var formVar = formVars[i];
        var nameValue = formVar.split('=');
        formVarsObjects[nameValue[0]] = nameValue.length > 1 ? nameValue[1] : '';
    }
    return(formVarsObjects);
}

/**
 * Helper function to validate that all required form variables are present
 *
 * @param req http request object
 * @param resp http response object
 * @param expectedFormVars form variables that are required
 * @param actualFormVars form variables that were POST or PUT
 */
ServerBase.prototype.validateFormVars = function (req, resp, expectedFormVars, actualFormVars) {
    var promise = null;

    var missingNames = [];
    for (var fv in expectedFormVars) {
        var name = this.getTemplateName(expectedFormVars[fv]);
        if (actualFormVars[name] === undefined) {
            missingNames.push(name);
        }
    }
    if (missingNames.length > 0) {
        var dfd = Q.defer();
        promise = dfd.promise;

        this.handleError(req, resp, null, 400,
                         'Required formvar' + (missingNames.length > 1 ? 's' : '') + ' missing: ' +
                             missingNames.join(', '));
        dfd.reject();
    }
    return(promise);
}

ServerBase.prototype.registerPathsExpress = function (app, queryToRestMap) {
    this.restMap = queryToRestMap;
    var self = this;
    for (var key in queryToRestMap) {
        //
        // partially apply the request handler to carry the key parameter with it,
        // allowing it to serve all path registrations
        var entry = queryToRestMap[key];
        var restSemantic = entry.restSemantic ? entry.restSemantic : 'GET';
        var path = entry.path ? entry.path : '/' + key;
        var method = null;
        switch(restSemantic) {
            case 'GET':
                method = eval('app.get');
                break;
            case 'POST':
                method = eval('app.post');
                break;
            case 'PUT':
                method = eval('app.put');
                break;
            case 'DELETE':
                method = eval('app.delete');
                break;
        }

        if (method === null) {
            // TODO - don't be silent!
        } else {
            method.call(app, path, function (key, req, resp) {
                req._parsedUrl.key = key;
                self.dispatchRequestExpress(key, queryToRestMap, req, resp);
            }.bind(null, key));
            method.call(app, path + '/:id', function (key, req, resp) {
                self.dispatchRequestExpress(key, queryToRestMap, req, resp);
            }.bind(null, key));
        }
    }

    app.get('/', function (req, resp) {
        resp.send(JSON.stringify(self.getHelp(queryToRestMap), undefined, '\t'));
    });
}

ServerBase.prototype.dispatchRequestExpress = function(key, queryToRestMap, req, resp) {
    req._parsedUrl.key = key;
    var queryInfo = queryToRestMap[key];
    this.dispatchRequest(req, resp);
}


ServerBase.prototype.getParameter = function (parameters, name, defaultValue) {
    return(parameters[name] !== undefined ? parameters[name] : defaultValue);
}

/**
 * Given a restmap, creates regexp path for each path by replacing each templated ':id' with a regexp pattern for each id.
 * Also takes care of creating regexp paths for implicit ids and implicit collections.
 *
 * @param req http request object
 */
ServerBase.prototype.initializePaths = function (restMap, implicitCollectionName) {

    if (!this.init) {
        this.init = true;
        this.restMap = restMap
        var regExpWord = '([a-zA-Z\@\%_\\-\\s0-9\\.]+)';
        var templateChar = ':';

        for (var key in restMap) {
            var entry = restMap[key];
            var restSemantic = entry.restSemantic ? entry.restSemantic : "GET";
            var path = entry.path == undefined ? ('/' + key) : entry.path;
            var pathParts = [];
            var pathIdImplicit = undefined;
            var pathIdImplicitParts = [];

            // replace all occurrences of ':id'' with '\w+'
            var pos = path.indexOf(templateChar); // look for template
            var beginPos = 0;
            if (pos > -1) {
                do {
                    var pos2 = path.indexOf('/', pos);
                    if (pos2 === -1) {
                        pos2 = path.length;
                    }

                    pathParts.push(path.slice(beginPos, pos));
                    pathParts.push(path.slice(pos, pos2));

                    path = path.substring(0, pos) + regExpWord + path.substring(pos2);

                    beginPos = pos + regExpWord.length + 1;

                    pos = path.indexOf(templateChar); // look for template
                } while (pos > -1);
            } else {
                if (entry.idName != undefined) {
                    pathIdImplicitParts.push(path);
                    pathIdImplicitParts.push(':id');
                    pathIdImplicit = path + '/' + regExpWord;
                }
                pathParts.push(path);
            }

            if (pathIdImplicit) {
                if (implicitCollectionName) {
                    var pathIdImplicitCollectionImplicitParts = _.clone(pathIdImplicitParts);
                    pathIdImplicitCollectionImplicitParts.push(implicitCollectionName);
                    pathIdImplicitCollectionImplicitParts.push(':' + implicitCollectionName + 'id');
                    var pathIdImplicitCollectionImplicit = pathIdImplicit +
                        ('/' + implicitCollectionName + '/' + regExpWord);
                    this.regExpForRestMap.push({regExp: new RegExp(pathIdImplicitCollectionImplicit), pathParts: pathIdImplicitCollectionImplicitParts, path: pathIdImplicitCollectionImplicit, key: key, restSemantic: restSemantic});
                }
                this.regExpForRestMap.push({regExp: new RegExp(pathIdImplicit), pathParts: pathIdImplicitParts, path: pathIdImplicit, key: key, restSemantic: restSemantic});
            }

            if (implicitCollectionName) {
                pathPartsImplicitCollection = _.clone(pathParts);
                pathPartsImplicitCollection.push(implicitCollectionName);
                pathPartsImplicitCollection.push(':' + implicitCollectionName + 'id');
                var pathImplicitCollection = path + '/' + implicitCollectionName + '/' + regExpWord;
                this.regExpForRestMap.push({regExp: new RegExp(pathImplicitCollection), pathParts: pathPartsImplicitCollection, path: pathImplicitCollection, key: key, restSemantic: restSemantic});
            }
            this.regExpForRestMap.push({regExp: new RegExp(path), pathParts: pathParts, path: path, key: key, restSemantic: restSemantic});

        }
    }
}

ServerBase.prototype.findPath = function (path, requestMethod) {
    var results = null;

    for (var i = 0; i < this.regExpForRestMap.length && !parts; ++i) {
        var entry = this.regExpForRestMap[i];
        var restSemantic = entry.restSemantic;
        if (restSemantic === requestMethod) {
            var regExp = entry.regExp;
            var parts = regExp.exec(path);
            if (parts != null) {
                results = {
                    regExpForRestMapItem: this.regExpForRestMap[i],
                    parts: parts
                };
            }
        }
    }
    return(results);
}

ServerBase.prototype.outputHelp = function (resp) {
    responseString = JSON.stringify(this.getHelp(this.supplyHelpObject()), undefined, '\t');

    resp.writeHead(200, responseString, {'content-type': 'application/json'});
    resp.end(responseString);
}

ServerBase.prototype.getTemplateName = function (template) {
    var name = '';
    var pos1 = template.indexOf('{');
    if (pos1 > -1) {
        var pos2 = template.indexOf('}', pos1);
        if (pos2 > -1) {
            name = template.slice(pos1 + 1, pos2);
        }
    }
    return(name);
}
/**
 * Helper function that (1) validates the REST path,  (2) gather any POST or PUT data and (3) sets up the execute method.
 *
 * @param req http request object
 * @param resp http response object
 */
ServerBase.prototype.prepareRequest = function (req, resp) {
    var dfd = Q.defer();

    var stuff = {};

    var found = false;
    var key = req._parsedUrl.key;
    var restMap = this.restMap;
    if (restMap[key] != undefined) {
        stuff.found = true;
        stuff.queryInfo = restMap[key];
        switch (req.method) {
            case 'GET':
                found = true;
                try {
                    var method = eval('this.' + req._parsedUrl.key);
                    stuff.executeMethod = method ? method : this.unknownPath;
                } catch (e) {
                    stuff.executeMethod = this.unknownPath;
                }
                dfd.resolve(stuff);
                break;
            case 'POST':
            case 'PUT':
                found = true;
                if (req.body) { // already retrieved by Express ?
                    try {
                        var method = eval('this.' + req._parsedUrl.key);
                        stuff.executeMethod = method ? method : this.unknownPath;
                    } catch (e) {
                        stuff.executeMethod = this.unknownPath;
                    }
                    dfd.resolve(stuff);
                } else {
                    var self = this;
                    var body = '';
                    req.on('data', function (data) {
                        body += data;
                    });
                    req.on('end', function () {
                        stuff.postedBody = body;
                        var ok = self.doParseBody ? self.parseBody(req, body) : true;
                        if (ok) {
                            try {
                                var method = eval('self.' + req._parsedUrl.key);
                                stuff.executeMethod = method ? method : this.unknownPath;
                            } catch (e) {
                                stuff.executeMethod = this.unknownPath;
                            }
                            dfd.resolve(stuff);
                        } else {
                            dfd.reject({errorCode: 415, errorMessage: "Unsupported Media Type"});
                        }
                    });
                 }

                break;
            case 'DELETE':
                found = true;
                try {
                    var method = eval('this.' + req._parsedUrl.key);
                    stuff.executeMethod = method ? method : this.unknownPath;
                } catch (e) {
                    stuff.executeMethod = this.unknownPath;
                }
                dfd.resolve(stuff);
                break;
        }
    }
    if (!found) {
        var response = {
            errorCode: 404,
            errorMessage: "Not Found"
        };
        stuff.response = response;
        dfd.reject(stuff);
    }
    return(dfd.promise);
}

ServerBase.prototype.parseBody = function(req, body) {
    var ok = false;
    switch(req.headers['content-type']) {
        case 'application/x-www-form-urlencoded':
            req.body = this.parseFormvars(body);
            ok = true;
            break
        case 'application/json':
            try {
                req.body = JSON.parse(body);
                ok = true;
            } catch (e) {
                var x = 5;
            }
            break
        case 'application/xml':
            // TODO
            break;
    }
    return(ok);
}

ServerBase.prototype.unknownPath = function (req, resp) {
    var error = {
        errorCode: 404,
        errorMessage: "Not Found",
        path: req.url
    };
    responseString = JSON.stringify(error, undefined, '\t');
    resp.writeHead(404, responseString, {'content-type': 'application/json'});
    resp.end(responseString);
    var dfd = Q.defer();
    dfd.reject(error);

    return(dfd.promise);
}

ServerBase.prototype.handleError = function (req, resp, err, code, defaultMessage) {
    if (err) {
        console.log(err, err.stack);
    }
    var error = err || {errorCode: code, errorerrorMessage: defaultMessage};
    responseString = JSON.stringify(error, undefined, '\t');
    code = error.errorCode || "400";

    resp.writeHead(code, responseString, {'content-type': 'application/json'});
    resp.end(responseString);

}

ServerBase.prototype.handleSuccess = function (req, resp, result, code) {
    var responseString = JSON.stringify(result, undefined, '\t');
    resp.writeHead(code, responseString, {'content-type': 'application/json'});
    resp.end(responseString);
}

ServerBase.prototype.wrapResult = function(req, resp, result, applicationName, metadata, sql) {
    var timeOut = new Date();
    var wrappedResult = {
        "action" : req.method,
        "query" : req.query,
        "body" : req.body,
        "path" : req._parsedUrl.pathname,
        "url" : req.url,
        "data" : result,
        "timestamp" : new Date().valueOf(),
        "duration" : timeOut - req._timeIn,
        "applicationName" : applicationName,
        "count" : result.length
    }
    if (sql) {
        wrappedResult.sql = sql;
    }
    if (this.defaults.includeMetaDeta) {
        wrappedResult.targetMetadata = metadata || {};
    }

    return(wrappedResult);
}

exports.ServerBase = ServerBase;
