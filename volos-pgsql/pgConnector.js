var debug = require('debug')('volos-pgsql');
var pg = require('pg');
var http = require('http');
var Q = require('q');
var sqlServerBase = require('volos-connectors-common').sqlServerBase;
var _ = require('lodash');

var PgConnector = function (options) {
    //  rowCallback, rowCallbackContext
    this.applicationName = 'volos-connectors-pgsql';
    this.options = options;
    this.restMap = options.restMap;
    var connector = this;

    this.defaults = _.merge(this.defaults, this.options.defaults);

    // Overrides -->
    this.setup = function (req, resp) {
        return(this.establishConnection(req, resp));
    };

    this.teardown = function (req, resp, setupResult, executeOperationResult) {
        var dfd = Q.defer();

        try {
            // call `done()` to release the client back to the pool            
            setupResult.done();
        } catch (e) {
            throw e;
        }

        dfd.resolve('');
        return(dfd.promise);
    };

    this.doQuery = function(connectResult, queryString) {
        var dfd = Q.defer();

        var client = connectResult.client;

        var query = client.query(queryString);
        var rows = [];
        query.on('row', function (row) {
            rows.push(row);
        });
        query.on('end', function () {
            dfd.resolve(rows);
            //client.end.bind(client);
        });

        return dfd.promise;
    };

    this.connect = function() {
        var dfd = Q.defer();

        var conString = this.buildConnectionString(this.options.profile);

        pg.connect(conString, function (err, client, done) {
            if (err) {
                console.error('error fetching client from pool', err);
                dfd.reject(err);
            }
            else {
                var wrappedResult = {
                    client: client,
                    done: done
                };
                dfd.resolve(wrappedResult);
            }
        });

        return dfd.promise;
    };

    // <-- Overrides

    // private -->
    this.handleRequest = function (queryInfo, req, resp) {

        resp.send(queryInfo.queryStringBasic);
    };

    this.establishConnection = function (req, resp) {
        var dfd = Q.defer();
        var self = this;
        this.prepareRequest(req, resp).then(
            function (requestInfo) {
                if (!requestInfo.found) {
                    dfd.reject(requestInfo.response);
                } else {
                    var profile = self.options.profile;
                    
                    var conString = 'postgres://' + profile.username + ':' + profile.password + '@' + profile.host +
                        (profile.port ? (':' + profile.port) : '') + '/' + profile.database;

                    try {
                        pg.connect(conString, function (err, client, done) {
                            if (err) {
                                console.error('error fetching client from pool', err);
                                dfd.reject(err);
                            }
                            else {
                                var wrappedLoginResult = {
                                    client: client,
                                    done: done,
                                    requestInfo: requestInfo
                                };
                                dfd.resolve(wrappedLoginResult);
                            }
                        });
                    } catch (e) {
                        console.error('Error connecting to Database!', e);
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

    this.executeOperation = function (req, resp, setupResult) {
        
        var sql = connector.buildQuery(req, resp, setupResult);
        return(this.performQuery(req, resp, sql, setupResult.client, setupResult.done));

    };    

    this.performQuery = function (req, resp, sql, client, done, rowCallback, rowCallbackContext) {
        var performQueryDfd = Q.defer();

        try {
            var promises = [];
            var self = this;

            var query = client.query(sql, function(err, results){

                if(err){
                    console.error('error running query', err);
                    resp.error(err);
                    performQueryDfd.reject(err);                    

                }else{
                    //client.end.bind(client);
                    done();

                    if (rowCallback) {
                        var rows = [];
                        _.map(results.rows, function(row){
                            var promise = rowCallback.call(rowCallbackContext, row);
                            if (promise) {
                                promises.push(promise);
                            }
                            rows.push(row);
                        });
                        results.rows = rows;
                    }

                    performQueryDfd.resolve(results);

                    Q.allSettled(promises).then(function () {
                        var wrappedResult = self.wrapResult(req, resp, results.rows, self.applicationName, {}, sql);
                        resp.set("Connection", "close");
                        resp.json(wrappedResult);                        
                    });
                }

            });
            
        } catch (e) {
            throw e;
        }

        return(performQueryDfd.promise);

    };

    this.buildConnectionString = function(profile) {
        return('postgres://' + profile.username + ':' + profile.password + '@' + profile.host +
            (profile.port ? (':' + profile.port) : '') + '/' + profile.database);
    };
    // <-- private

};

PgConnector.prototype = new sqlServerBase.SqlServerBase();
exports.PgConnector = PgConnector;
