var assert = require('assert');
var AWS = require('aws-sdk');
var DOMParser = require('xmldom').DOMParser;
var http = require('http');
var Q = require('q');
var _ = require('lodash');
var serverBase = require('volos-connectors-common').serverBase;

var S3Connector = function (options) {
    this.applicationName = 'volos-s3';
    this.configuration = options.configuration;
    var connector = this;
    this.options = options;

    // Overrides -->
    this.setup = function (req, resp) {
        return(this.establishConnection(req, resp));
    }

    this.executeOperation = function (req, resp, setupResult) {
        var queryInfo = setupResult.queryInfo;
        setupResult.executeMethod.call(this, req, resp, setupResult.s3, queryInfo, setupResult.postedBody);

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

    // private -->
    this.establishConnection = function (req, resp) {
        var dfd = Q.defer();

        var self = this;

        this.prepareRequest(req, resp).then(
            function (prepareRequestResult) {
                var profile = connector.options.profile;

                var awsConfig = {
                    "accessKeyId": profile.accessKeyId,
                    "secretAccessKey": profile.secretAccessKey
                }

                AWS.config.update(awsConfig);
                var s3 = new AWS.S3();
                prepareRequestResult.s3 = s3;
                dfd.resolve(prepareRequestResult);
            },
            function (err) {
                var wrappedResult = self.wrapResult(req, resp, err, self.applicationName, {});
                self.handleError(req, resp, wrappedResult, 400, '"executeOperation" failed');
                dfd.reject();
            },
            function (progress) {

            }
        );

        return dfd.promise;

    }

    this.buckets = function (req, resp, s3, queryInfo) {
        var dfd = Q.defer();

        var id = req.params.bucketid;
        var limit = parseInt(this.getParameter(req.query, 'limit', "10"));
        var isExpand = this.getParameter(req.query, 'expand') === "true";
        var fields = id ? queryInfo.fieldsId : (isExpand ? queryInfo.fieldsExpanded : queryInfo.fieldsBasic);

        var self = this;

        s3.listBuckets(function (err, data) {
            if (err) {
                var wrappedResult = self.wrapResult(req, resp, err, self.applicationName, {});
                self.handleError(req, resp, wrappedResult, 400, '"executeOperation" failed');
                dfd.reject();
            } else {
                var buckets = _.first(data.Buckets, limit);
                var metadata = _.pick(data, function(value, key) {
                    return(key !== "Buckets");
                });
                var wrappedResult = self.wrapResult(req, resp, buckets, self.applicationName, metadata);
                self.handleSuccess(req, resp, wrappedResult, 200);
                dfd.resolve();
            }
        });
        return(dfd.promise);
    }

    this.object = function (req, resp, s3, queryInfo) {
        var dfd = Q.defer();

        var bucketName = req.params.bucketid;

        var limit = this.getParameter(req.query, 'limit', "100");
        var isExpand = this.getParameter(req.query, 'expand') === "true";
        var key = this.getParameter(req.query, 'key');
        var fields = queryInfo.fieldsId;

        var params = {
            Bucket: bucketName
//            IfMatch: 'STRING_VALUE',
//            IfModifiedSince: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
//            IfNoneMatch: 'STRING_VALUE',
//            IfUnmodifiedSince: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
//            Range: 'STRING_VALUE',
//            ResponseCacheControl: 'STRING_VALUE',
//            ResponseContentDisposition: 'STRING_VALUE',
//            ResponseContentEncoding: 'STRING_VALUE',
//            ResponseContentLanguage: 'STRING_VALUE',
//            ResponseContentType: 'STRING_VALUE',
//            ResponseExpires: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
//            SSECustomerAlgorithm: 'STRING_VALUE',
//            SSECustomerKey: 'STRING_VALUE',
//            SSECustomerKeyMD5: 'STRING_VALUE',
//            VersionId: 'STRING_VALUE'
        };
        if (key) {
            params.Key = key;
        } else {
            // error - should be in param data
        }
        var self = this;
        var body = s3.getObject(params, function (err, data) {
            if (err) {
                var wrappedResult = self.wrapResult(req, resp, err, this.application, {});
                responseString = JSON.stringify(wrappedResult, undefined, '\t');
                resp.writeHead(404, responseString, {'content-type': 'application/json'});
                resp.end(responseString);
                dfd.resolve();
            } else {

                var resultString;
                parseFailed = false;
                switch (data.ContentType) {
                    case 'text/plain':
                        var bodyArray = [];
                        for (var item in data.Body) {
                            if (data.Body.hasOwnProperty(item) &&
                                (item !== 'length' && item != 'parent' && item !== 'offset')) {
                                bodyArray.push(String.fromCharCode(data.Body[item]));
                            }
                        }
                        data.Body = bodyArray.join("");
                        break;
                    case 'application/json':
                        try {
                            var json = JSON.parse(data.Body);
                            data.Body = json;
                        } catch (e) {
                            var i = 0;
                        }
                        break;
                    case 'application/xml':
                        try {
                            var doc = new DOMParser().parseFromString(data.Body);
                            data.Body = doc;
                        } catch (e) {
                            // nothing more to try
                            parseFailed = true;
                        }
                        break;
                    default:
                        try {
                            json = JSON.parse(data.Body);
                            data.Body = json;
                        } catch (e) {

                        }
                }

                var saveBody;
                if (parseFailed) {
                    saveBody = data.Body;
                    data.Body = [];
                }

                var metadata = _.pick(data, function(value, key) {
                    return(key !== "Body");
                });

                var wrappedResult = self.wrapResult(req, resp, data.Body, self.applicationName, metadata);
                responseString = JSON.stringify(wrappedResult, undefined, '\t');

                if (parseFailed) {
                    responseString = responseString.replace('"Body": []', '"Body": ' + JSON.stringify(saveBody));
                }

                resp.writeHead(200, responseString, {'content-type': 'application/json'});
                resp.end(responseString);
                dfd.resolve();
            }
        });

        return(dfd.promise);
    }

    this.bucketItem = function (req, resp, s3, queryInfo) {
        var dfd = Q.defer();

        var id = req.params.bucketid;
        if (!id) {
            var response = {
                errorCode: 404,
                errorMessage: "Not Found"
            };
            responseString = JSON.stringify(response, undefined, '\t');
            resp.writeHead(404, responseString, {'content-type': 'application/json'});
            resp.end(responseString);
            dfd.reject();
        }
        else {
            var s3BucketName = id;
            var limit = this.getParameter(req.query, 'limit', "100");
            var isExpand = this.getParameter(req.query, 'expand') === "true";
            var fields = id ? queryInfo.fieldsId : (isExpand ? queryInfo.fieldsExpanded : queryInfo.fieldsBasic);

            var params = {
                Bucket: s3BucketName,
                MaxKeys: limit
            }

            var delimiter = this.getParameter(req.query, 'delimiter', undefined);
            if (delimiter) {
                params.Delimiter = delimiter;
            }

            var encodingType = this.getParameter(req.query, 'encodingType', undefined);
            if (encodingType) {
                params.EncodingType = encodingType;
            }

            var marker = this.getParameter(req.query, 'marker', undefined);
            if (marker) {
                params.Marker = marker;
            }

            var prefix = this.getParameter(req.query, 'prefix', undefined);
            if (prefix) {
                params.Prefix = prefix;
            }

            self = this;
            s3.listObjects(params, function (err, data) {
                if (err) {
                    var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                    self.handleError(req, resp, wrappedResult, 404, '"listObjects" failed');
                    dfd.resolve();
                } else {
                    var metadata = _.pick(data, function(value, key) {
                        return(key !== "Contents");
                    });
                    var wrappedResult = self.wrapResult(req, resp, data.Contents, self.applicationName, metadata);
                    self.handleSuccess(req, resp, wrappedResult, 200);
                    dfd.resolve();
                }
            });
        }
        return(dfd.promise);
    }

    this.putObject = function (req, resp, s3, queryInfo, postedBody) {
        var dfd = Q.defer();

        var bucketName = req.params.bucketid;
        var key = this.getParameter(req.query, 'key');

        var params = {
            Bucket: bucketName,
            Body: postedBody,
            Key: key,
            ContentType: req.headers['content-type']
//            ACL: 'private | public-read | public-read-write | authenticated-read | bucket-owner-read | bucket-owner-full-control',
//            Body: new Buffer('...') || 'STRING_VALUE' || streamObject,
//            CacheControl: 'STRING_VALUE',
//            ContentDisposition: 'STRING_VALUE',
//            ContentEncoding: 'STRING_VALUE',
//            ContentLanguage: 'STRING_VALUE',
//            ContentLength: 0,
//            ContentMD5: 'STRING_VALUE',
//            ContentType: 'STRING_VALUE',
//            Expires: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
//            GrantFullControl: 'STRING_VALUE',
//            GrantRead: 'STRING_VALUE',
//            GrantReadACP: 'STRING_VALUE',
//            GrantWriteACP: 'STRING_VALUE',
//            Metadata: {
//                someKey: 'STRING_VALUE',
//                anotherKey: ...
//            },
//            SSECustomerAlgorithm: 'STRING_VALUE',
//            SSECustomerKey: 'STRING_VALUE',
//            SSECustomerKeyMD5: 'STRING_VALUE',
//            ServerSideEncryption: 'AES256',
//            StorageClass: 'STANDARD | REDUCED_REDUNDANCY',
//            WebsiteRedirectLocation: 'STRING_VALUE'
        }

        s3.putObject(params, function (err, data) {
            var responseObject = {"err": err, "data": data, "bucketName": bucketName, "key": key};
            responseString = JSON.stringify(responseObject, undefined, '\t');
            resp.writeHead(200, responseString, {'content-type': 'application/json'});
            resp.end(responseString);

            if (err) {
                dfd.resolve(responseObject);
            } else {
                dfd.resolve(responseObject);
            }
        });

        return(dfd.promise);
    }

    this.deleteObject = function (req, resp, s3, queryInfo) {
        var dfd = Q.defer();

        var bucketName = req.params.bucketid;
        var key = this.getParameter(req.query, 'key');

        var params = {
            Bucket: bucketName,
            Key: key
        }

        s3.deleteObject(params, function (err, data) {
            var responseObject = {"err": err, "data": data, "bucketName": bucketName, "key": key};
            responseString = JSON.stringify(responseObject, undefined, '\t');
            resp.writeHead(200, responseString, {'content-type': 'application/json'});
            resp.end(responseString);
            if (err) {
                dfd.reject(responseObject);
            } else {
                dfd.resolve(responseObject);
            }
        });

        return dfd.promise;
    }

};

S3Connector.prototype = new serverBase.ServerBase();
exports.S3Connector = S3Connector;
