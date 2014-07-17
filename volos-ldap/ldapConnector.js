var assert = require('assert');
var ldap = require('ldapjs');
var http = require('http');
var Q = require('q');
var serverBase = require('volos-connectors-common').serverBase;

var LdapConnector = function (options) {
    this.applicationName = "volos-ldap";
    var connector = this;
    this.options = options;
    this.configuration = options.configuration;

    // Overrides -->
    this.setup = function (req, resp) {
        return(this.establishConnection(req, resp));
    }

    this.executeOperation = function (req, resp, setupResult) {
        var queryInfo = setupResult.queryInfo;
        setupResult.executeMethod.call(this, req, resp, setupResult.client, queryInfo, setupResult.postedBody);

    }

    this.teardown = function (req, resp, setupResult, executeOperationResult) {
        var dfd = Q.defer();

        try {
        } catch (e) {
            throw e;
        }

        dfd.resolve('');
        return(dfd.promise);
    }
    this.supplyHelpObject = function () {
        return(this.configuration.restMap);
    }

    this.getCommonParameters = function () {
        return(['limit=<maxResults>', 'expand=true']);
    }
    // <-- Overrides

    this.establishConnection = function (req, resp) {
        var dfd = Q.defer();

        this.prepareRequest(req, resp).then(
            function (prepareRequestResult) {
                var profile = connector.options.profile;
                var client = ldap.createClient({
                                                   url: 'ldap://' + profile.host + ':' + profile.port
                                               });
                bind(client, profile).then(
                    function () {
                        prepareRequestResult.client = client;
                        dfd.resolve(prepareRequestResult);
                    }
                );
            },
            function (err) {
                handleError(req, resp, err, 400, '"executeOperation" failed');
                dfd.reject();
            },
            function (progress) {

            }
        );

        return dfd.promise;
    }

    this.engineering = function (req, resp, client, queryInfo) {
        return(this.search(req, resp, client, queryInfo));
    }

    this.products = function (req, resp, client, queryInfo) {
        return(this.search(req, resp, client, queryInfo));
    }

    this.departments = function (req, resp, client, queryInfo) {
        return(this.search(req, resp, client, queryInfo));
    }

    this.connectors = function (req, resp, client, queryInfo) {
        return(this.search(req, resp, client, queryInfo));
    }

    this.projects = function (req, resp, client, queryInfo) {
        return(this.search(req, resp, client, queryInfo));
    }

    this.people = function (req, resp, client, queryInfo) {
        return(this.search(req, resp, client, queryInfo));
    }

    this.search = function (req, resp, client, queryInfo) {
        var dfd = Q.defer();

        var id = req.params.memberid;
        var limit = this.getParameter(req.query, 'limit', "100");
        var isExpand = this.getParameter(req.query, 'expand') === "true";
        var attributes = id ? queryInfo.attributesId :
                         (isExpand ? queryInfo.attributesExpanded : queryInfo.attributesBasic);
        var expandLists = this.configuration.options.expandLists;

        req._parsedUrl.usesMember = (req.url.indexOf('member') > -1);

        var self = this;
        _search(client, queryInfo.base, id, queryInfo.idName, isExpand, limit, attributes, req._parsedUrl.usesMember,
                expandLists).then(function (data) {
            var wrappedResult = self.wrapResult(req, resp, data, self.applicationName);
            var responseString = JSON.stringify(wrappedResult, undefined, '\t');
            resp.writeHead(200, responseString, {'content-type': 'application/json'});
            resp.end(responseString);
            dfd.resolve();

        }, function (reason) {
            var wrappedResult = self.wrapResult(req, resp, reason, self.applicationName);
            var responseString = JSON.stringify(wrappedResult, undefined, '\t');
            resp.writeHead(404, responseString, {'content-type': 'application/json'});
            resp.end(responseString);
            dfd.reject();
        });

        return(dfd.promise);
    }

    this.postPeople = function (req, resp, client, queryInfo, body) {
        if (this.getParameter(req.query, 'verify', undefined)) {
            return(this.verifyCredentials(req, resp, client, queryInfo, body));
        } else {
            // TODO: error
        }
    }

    this.verifyCredentials = function (req, resp, client, queryInfo, body) {
        var formVars = this.parseFormvars(body);
        var promise = this.validateFormVars(req, resp, queryInfo.formVars, formVars);

        if (!promise) {
            var dfd = Q.defer();
            promise = dfd.promise;

            var credentialsInformation = queryInfo.credentialsInformation;
            var attributes = {};
            attributes[credentialsInformation.attributeNameUser] = credentialsInformation.attributeNameUser;
            attributes[credentialsInformation.attributeNamePassword] = credentialsInformation.attributeNamePassword;

            var self = this;
            _search(client, queryInfo.base, undefined, undefined, false, undefined, attributes).then(function (data) {
                var valid = false;
                if (req.headers['content-type'] &&
                    req.headers['content-type'] === 'application/x-www-form-urlencoded') {
                    // user=user&password=password
                    if (data instanceof Array) {
                        for (var i = 0; i < data.length && !valid; ++i) {
                            var item = data[i];
                            var user = item[credentialsInformation.attributeNameUser];
                            var password = item[credentialsInformation.attributeNamePassword];
                            if (formVars.user === user && formVars.password == password) {
                                valid = true;
                            }
                        }
                    }
                }
                var response = {
                    "valid": valid
                }
                self.handleSuccess(req, resp, response, 200);
                dfd.resolve();

            }, function (reason) {
                self.handleError(req, resp, reason, 404, '"search" failed')
                dfd.reject();
            }, this);

            return(promise);

        }
    };

    this.changePassword = function (req, resp, client, restMap) {
        // TODO
        var dfd = Q.defer();

        return(dfd.promise);
    }


    // private -->
    function bind(client, profile) {
        var dfd = Q.defer();
        client.bind(profile.binddn, profile.credentials, function (err) {
            assert.ifError(err);
            if (err) {
                console.error(err);
                dfd.reject();
            } else {
                dfd.resolve();
            }

        });
        return dfd.promise;
    }

    function _search(client, base, id, idName, expand, limit, attributes, usesMember, expandLists) {
        var opts = {
            filter: '(objectclass=*)',
            scope: 'sub'
        };

        if (limit) {
            //opts.sizeLimit = limit;
        }

        if (id && !usesMember) {
            base = idName + '=' + id + ',' + base;
        }
        var dfd = Q.defer();
        var errResult = null;
        var results = [];
        var entryResultObject = {};

        client.search(base, opts, function (err, res) {
            assert.ifError(err);

            res.on('searchEntry', function (entry) {
                console.log('search', JSON.stringify(entry.object));
                entryResultObject = expandLists ? parseCommon(entry.object) : entry.object;
                if (!expand && !id && idName) {
                    if (entryResultObject[idName] !== undefined) {
                        results.push(entryResultObject[idName]);
                    }
                } else {
                    if (usesMember) {
                        if (entryResultObject.member !== undefined) {
                            var member = entryResultObject.member;
                            var itemsObj = [];
                            if (member instanceof Array) {
                                for (var i = 0; i < member.length; ++i) {
                                    var itemsObj;
                                    var memberString = '';
                                    if (expandLists) {
                                        itemsObj = member[i];
                                    } else {
                                        memberString = member[i];
                                        itemsObj = parseItemsString(memberString);
                                    }

                                    if (id) {
                                        if (itemsObj.cn != undefined && id === itemsObj.cn) {
                                            results.push(expandLists ? itemsObj : memberString);
                                        }
                                    } else {
                                        results.push(expandLists ? itemsObj : memberString);
                                    }
                                }
                            } else {
                                if (id) {
                                    if (member.cn != undefined && id === member.cn) {
                                        results.push(member);
                                    }
                                } else {
                                    results.push(member);
                                }
                            }
                        }
                    } else {
                        if (attributes === '*') {
                            results.push(entryResultObject);
                        } else {
                            if (entryResultObject.cn !== undefined) {
                                var o = {}
                                for (var attribute in attributes) {
                                    if (entryResultObject[attribute] !== undefined) {
                                        var name = attributes[attribute];
                                        o[attributes[attribute]] = entryResultObject[attribute];
                                    }
                                }
                                results.push(o);
                            }
                        }
                    }
                }
                // var cloned = (!expand && id === null) ?  _.pluck(entryResultObject, 'cn') : _.clone(entryResultObject, true);

            });
            res.on('searchReference', function (referral) {
                console.log('referral: ' + referral.uris.join());
            });
            res.on('error', function (err) {
                console.error('error: ' + err.message);
                errResult = err;
                dfd.reject(errResult);
            });
            res.on('end', function (result) {
                console.log('status: ' + result.status);

                if (errResult) {
                    dfd.reject(errResult);
                } else {
                    dfd.resolve(id ? results[0] : results);
                }
                client.unbind(function (err) {
                    assert.ifError(err);
                });
            });
        });
        return dfd.promise;
    }

    function parseCommon(object) {
        if (object.dn !== undefined) {
            object.dn = parseItemsString(object.dn);
        }
        if (object.member !== undefined) {
            if (object.member instanceof Array) {
                for (var i = 0; i < object.member.length; ++i) {
                    var memberItem = object.member[i];
                    object.member[i] = parseItemsString(memberItem);
                }
            } else {
                object.member = parseItemsString(object.member);
            }
        }
        return(object);
    }

    function parseItemsString(itemsString) {
        var items = itemsString.split(',');
        var itemsObj = {};
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            var itemParts = item.split('=');
            if (itemParts.length == 2) {
                var key = itemParts[0];
                if (itemsObj[key] !== undefined) {
                    if (!(itemsObj[key] instanceof Array)) {
                        itemsObj[key] = [itemsObj[key]];
                    }
                    itemsObj[key].push(itemParts[1]);
                } else {
                    itemsObj[key] = itemParts[1];
                }
            } else {
                itemsObj[item] = item; // DWIT
            }
        }
        return(itemsObj);
    }
    // private -->
};

LdapConnector.prototype = new serverBase.ServerBase();
exports.LdapConnector = LdapConnector;
