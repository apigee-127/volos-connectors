var http = require('http');
var Q = require('q');
var _ = require('lodash');
var sqlServerBase = require('volos-connectors-common').sqlServerBase;

var MySqlConnector = function(options) {
    //  rowCallback, rowCallbackContext
    this.applicationName = "volos-mysql";
    var connector = this;
    this.restMap = options.restMap;
    this.options = options;

    this.defaults = _.merge(this.defaults, this.options.defaults);
    // overrides -->
    this.setup = function(req, resp) {
        return(this.establishConnection(req, resp));
    }

    this.executeOperation = function(req, resp, setupResult) {
        return(this.getQueryData(req, resp, setupResult));
    }

    this.getQueryData = function(req, resp, setupResult) {
        var queryString = this.buildQuery(req, resp, setupResult);
        return(this.performQuery(req, resp, queryString, setupResult.connection, options.rowCallback, options.rowCallbackContext));
    }

    this.teardown = function(req, resp, setupResult, executeOperationResult) {
        var dfd = Q.defer();
        dfd.resolve('');
        return(dfd.promise);
    }
    // <-- overrides

    this.establishConnection = function(req, resp) {
        var dfd = Q.defer();
        if (req.url === '/') { // help
            dfd.resolve({isHelp: true});
        }
        else {
            this.prepareRequest(req, resp).then(
                function (requestInfo) {
                    var mysql = require('mysql');
                    var profile = connector.options.profile;
                    var connection = mysql.createConnection(
                        {
                            host: profile.host,
                            user: profile.user,
                            password: profile.password,
                            port: profile.port
                        });

                    try {
                        connection.connect();
                        var wrappedLoginResult = {
                            isHelp: false,
                            connection: connection,
                            requestInfo: requestInfo
                        }
                        dfd.resolve(wrappedLoginResult);
                    } catch (e) {
                        // dfd.reject(e);
                        throw e;
                    }
                },
                function (err) {
                    self.handleError(req, resp, err, 400, '"prepareRequest" failed');
                    dfd.reject();
                },
                function (progress) {

                }
            );
        }

        return dfd.promise;
    }

    this.performQuery = function(req, resp, queryString, connection, rowCallback, rowCallbackContext) {
        var performQueryDfd = Q.defer();

        var rows = [];
        var promises = [];
        var self = this;

        try {
            connection.query(queryString, function(err, rows, fields) {
                var metaData = {fields :fields};
                var wrappedresult = self.wrapResult(req, resp, (err ? err : rows), self.applicationName, metaData, queryString);
                if (err) {
                    self.handleError(req, resp, wrappedresult, 400, '"query" failed');
                } else {
                    self.handleSuccess(req, resp, wrappedresult, 200); // TODO: should be 201 if POST
                }
                performQueryDfd.resolve(wrappedresult);
            });

        } catch (e) {
            this.handleError(req, resp, err, 400, '"query" failed');
        }

        return(performQueryDfd.promise);

    }

};

MySqlConnector.prototype = new sqlServerBase.SqlServerBase();
exports.MySqlConnector = MySqlConnector;
