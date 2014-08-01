var sf = require('node-salesforce');
var http = require('http');
var Q = require('q');
var _ = require('lodash');
var sqlServerBase = require('volos-connectors-common').sqlServerBase;

var SfConnector = function (options) {
    this.restMap = options.restMap || require('./queryToRestMap.js');
    //  rowCallback, rowCallbackContext
    this.applicationName = "volos-salesforce";
    this.options = options;
    var connector = this;
    this.defaults = _.merge(this.defaults, this.options.defaults);

    // overrides -->
    this.setup = function (req, resp) {
        return(this.establishConnection(req, resp));
    }

    this.executeOperation = function (req, resp, setupResult) {
        return(this.getQueryData(req, resp, setupResult));
    }

    this.getQueryData = function (req, resp, setupResult) {
        var limit = this.getParameter(req.query, 'limit', "100");
        var queryString = this.buildQuery(req, resp, setupResult);

        return(this.performQuery(req, resp, queryString, limit, setupResult.conn, options.rowCallback,
                                 options.rowCallbackContext));
    }

    this.teardown = function (req, resp, setupResult, executeOperationResult) {
        var dfd = Q.defer();
        dfd.resolve('');
        return(dfd.promise);
    }
    // <-- overrides

    this.establishConnection = function (req, resp) {
        var dfd = Q.defer();
        var requestInfo = connector.prepareRequest(req, resp);
        this.prepareRequest(req, resp).then(
            function (requestInfo) {
                if (!requestInfo.found) {
                    dfd.reject(requestInfo.response);
                } else {
                    var profile = connector.options.profile;
                    var username = profile.username;
                    var password = profile.password;
                    var securityToken = profile.securityToken;

                    try {
                        var conn = new sf.Connection({});
                        conn.login(username, password + securityToken,
                                   function (err, userInfo) {
                                       if (err) {
                                           console.error(err);
                                           dfd.reject();
                                       }

                                       console.log("Token: " + conn.accessToken);
                                       console.log("InstanceUrl: " + conn.instanceUrl);
                                       // logged in user property
                                       console.log("User ID: " + userInfo.id);
                                       console.log("Org ID: " + userInfo.organizationId);
                                       var o = {
                                           "conn": conn,
                                           "userInfo": userInfo,
                                           "requestInfo": requestInfo
                                       }
                                       dfd.resolve(o);
                                   }
                        );

                    } catch (e) {
                        throw e;
                    }

                }
            },
            function (err) {
                self.handleError(req, resp, err, 400, '"prepareRequest" failed');
                dfd.reject();
            });

        return dfd.promise;
    }

    this.performQuery = function (req, resp, queryString, limit, conn, rowCallback, rowCallbackContext) {
        var performQueryDfd = Q.defer();

        try {
            var records = [];
            var promises = [];
            var responseString = "";
            var self = this;
            conn.query(queryString)
                .on("record", function (record) {
                        if (rowCallback) {
                            var promise = rowCallback.call(rowCallbackContext, record);
                            if (promise) {
                                promises.push(promise);
                            }
                        }
                        records.push(record);
                    })
                .on("end", function (query) {
                        performQueryDfd.resolve(records);
                        Q.allSettled(promises).then(function () {
                            console.log("total in database : " + query.totalSize);
                            console.log("total fetched : " + query.totalFetched);
                            var wrappedresult = self.wrapResult(req, resp, records, self.applicationName, {}, queryString);
                            responseString = JSON.stringify(wrappedresult, null, '\t');
                            resp.writeHead(200, responseString, {'content-type': 'application/json'});
                            resp.end(responseString);
                        });
                    })
                .on("error", function (err) {
                        console.error(err);
                        responseString = JSON.stringify(err);
                        resp.writeHead(200, responseString, {'content-type': 'application/json'});
                        resp.end(responseString);
                    })
                .run({ autoFetch: true, maxFetch: limit});
        } catch (e) {
            throw e;
        }

        return(performQueryDfd.promise);

    }

};

SfConnector.prototype = new sqlServerBase.SqlServerBase();
exports.SfConnector = SfConnector;
