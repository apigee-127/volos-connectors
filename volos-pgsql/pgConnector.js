var pg = require('pg');
var http = require('http');
var Q = require('q');
var sqlServerBase = require('volos-connectors-common').sqlServerBase;
var _ = require('lodash');

var PgConnector = function (options) {
    //  rowCallback, rowCallbackContext
    this.applicationName = 'volos-pgsql';
    this.options = options;
    this.restMap = options.restMap;
    var connector = this;

    this.defaults = _.merge(this.defaults, this.options.defaults);

    // Overrides -->
    this.setup = function (req, resp) {
        return(this.establishConnection(req, resp));
    }

    this.executeOperation = function (req, resp, setupResult) {
        return(this.getQueryData(req, resp, setupResult));
    }

    this.getQueryData = function (req, resp, setupResult) {
        var limit = this.getParameter(req.query, 'limit', "100");
        var queryString = connector.buildQuery(req, resp, setupResult);

        return(this.performQuery(req, resp, queryString, limit, setupResult.client, setupResult.done,
                                 options.rowCallback, options.rowCallbackContext));
    }

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
    }

    this.createDynamicRestMap = function (cb, context, schemas) {
        var restMap = {};
        var self = this;

        // SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE table_type = 'BASE TABLE'
        // then extract all table names.
        // for each table:
        // SELECT column_name, data_type, ordinal_position table_schema, table_name FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = '{tableName}'
        // create queryStringExpanded using all columns, exclusing "data_type": 'bytea'
        // create queryStringBasic using: column whose ordinal_position is 1

        var conString = this.buildConnectionString(this.options.profile);

        try {
            pg.connect(conString, function (err, client, done) {
                if (err) {
                    console.error('error fetching client from pool', err);
                    cb.call(context, err, undefined);
                }
                else {
                    promises = [];
                    var queryString = 'SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE table_type = \'BASE TABLE\'';
                    if (schemas) {
                        queryString += ' AND table_schema IN (' + _.map(schemas, function(schema) {
                            return('\'' + schema + '\'');
                        }).join(',') + ')';
                    }
                    console.log(queryString);
                    self.doQuery(client, queryString). then(
                        function(tablesInfo) {
                            for (var i = 0; i < tablesInfo.length; ++i) {
                                var table = tablesInfo[i];
                                var queryStringColumns =  'SELECT column_name, data_type, ordinal_position, table_schema, table_name FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = \''  + table.table_name + '\'';
                                var promise = self.doQuery(client, queryStringColumns);
                                promises.push(promise);
                                promise.then(
                                    function (table, columnsInfo) {
                                        var queryParameters = {};
                                        var idName = undefined;
                                        var idNameOrdinal = undefined;
                                        for (var j = 0; j < columnsInfo.length; ++j) {
                                            var column = columnsInfo[j];
                                            var columnName = column.column_name;
                                            queryParameters[columnName] = columnName +' = \'{' + columnName + '}\'';
                                            if (column.ordinal_position === 1) {
                                                idNameOrdinal = columnName;
                                            }
                                            if (!idName && columnName.indexOf('id') > -1) {
                                                idName = columnName;
                                            }
                                        }
                                        if (!idName) {
                                            idName = idNameOrdinal;
                                        }
                                        var queryStringExpanded = 'SELECT * FROM ' + table.table_schema + '.' + table.table_name;
                                        var queryStringBasic = 'SELECT ' + idName + ' FROM ' + table.table_schema + '.' + table.table_name;
                                        restMap[table.table_schema + '_' + table.table_name] = {
                                            queryStringBasic: queryStringBasic,
                                            queryStringExpanded: queryStringExpanded,
                                            path: restMap[table.table_name] ? (restMap[table.table_schema + '/' + table.table_name]) : table.table_name,
                                            idName: idName,
                                            queryParameters: queryParameters
                                        }
                                    }.bind(self, table),
                                    function (err) {

                                    }
                                );
                            }
                            Q.allSettled(promises).then(function () {
                                self.restMap = restMap;
                                cb.call(context, undefined, restMap);
                            });

                        },
                        function(err) {

                        }
                    );
                }
            });
        } catch (e) {
            console.error('Error connecting to Database!', e);
            throw e;
        }

    }
    // <-- Overrides

    this.doQuery = function(client, queryString) {
        var dfd = Q.defer();

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
    }


    // private -->
    this.handleRequest = function (queryInfo, req, resp) {
        resp.send(queryInfo.queryStringBasic);
    }

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
            });

        return dfd.promise;
    }

    this.performQuery = function (req, resp, queryString, limit, client, done, rowCallback, rowCallbackContext) {
        var performQueryDfd = Q.defer();

        try {
            var rows = [];
            var promises = [];
            var self = this;

            client.on('error', function (error) {
                console.error('error running query', error);
                performQueryDfd.reject(error);
            });

            var query = client.query(queryString);

            query.on('row', function (row) {
                if (rowCallback) {
                    var promise = rowCallback.call(rowCallbackContext, row);
                    if (promise) {
                        promises.push(promise);
                    }
                }
                rows.push(row);
            });
            query.on('end', function () {
                //disconnect client manually
                client.end.bind(client);
                performQueryDfd.resolve(rows);

                Q.allSettled(promises).then(function () {
                    var wrappedResult = self.wrapResult(req, resp, rows, self.applicationName, {}, queryString);
                    var responseString = JSON.stringify(wrappedResult, undefined, '\t');
                    //resp.status(200).setHeader('Content-Type', 'application/json').send(responseString);

                    resp.writeHead(200, {'Content-Type': 'application/json'});
                    resp.end(responseString);
                });
            });

        } catch (e) {
            throw e;
        }

        return(performQueryDfd.promise);

    }

    this.buildConnectionString = function(profile) {
        return('postgres://' + profile.username + ':' + profile.password + '@' + profile.host +
            (profile.port ? (':' + profile.port) : '') + '/' + profile.database);
    }
    // <-- private

};

PgConnector.prototype = new sqlServerBase.SqlServerBase();
exports.PgConnector = PgConnector;
