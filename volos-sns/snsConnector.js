var assert = require('assert');
var AWS = require('aws-sdk');
var http = require('http');
var Q = require('q');
var serverBase = require('volos-connectors-common').serverBase;
var util = require('util');
var _ = require('lodash');

var SnsConnector = function (options) {
    this.applicationName = 'volos-sns';
    this.configuration = options.configuration;
    snsProtocols = {
        PROTOCOL_HTTP: 'http',
        PROTOCOL_HTTPS: 'https',
        PROTOCOL_EMAIL: 'email',
        PROTOCOL_EMAIL_JSON: 'email-json',
        PROTOCOL_SMS: 'sms',
        PROTOCOL_SQS: 'sqs',
        PROTOCOL_APPLICATION: 'application'
    };
    var connector = this;
    this.options = options;

    this.initializePaths(this.configuration.restMap);

    // Overrides -->
    this.setup = function (req, resp) {
        return(this.establishConnection(req, resp));
    }

    this.executeOperation = function (req, resp, setupResult) {
        var queryInfo = setupResult.queryInfo;
        setupResult.executeMethod.call(this, req, resp, setupResult.sns, queryInfo, setupResult.postedBody);
    }

    this.teardown = function (req, resp, setupResult, executeOperationResult) {
        var dfd = Q.defer();
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
        var self = this;

        this.prepareRequest(req, resp).then(
            function (prepareRequestResult) {
                var awsConfig = connector.options.profile;

                AWS.config.update(awsConfig);
                self.sns = new AWS.SNS();
                prepareRequestResult.sns = self.sns;
                dfd.resolve(prepareRequestResult);
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

    this.createTopic = function (req, resp, sns, queryInfo, body) {
        var formVars = this.parseFormvars(body);
        var promise = this.validateFormVars(req, resp, queryInfo.formVars, formVars);

        if (!promise) {
            promise = this._createTopic(sns, req, resp, formVars[this.getTemplateName(queryInfo.formVars.Name)],
                                        formVars[this.getTemplateName(queryInfo.formVars.AttributeValue)]);
        }

        return(promise);
    }

    this._createTopic = function (sns, req, resp, topicName, displayName) {
        var dfd = Q.defer();
        var self = this;

        sns.createTopic({'Name': topicName}, function (err, result) {
            if (err !== null) {
                console.log(err);
                dfd.reject(err);
            } else {
                var params = {
                    AttributeName: 'DisplayName', // required
                    TopicArn: result.TopicArn,
                    AttributeValue: displayName
                };
                sns.setTopicAttributes(params, function (err, data) {
                    self.handleResponse(req, resp, err, data, dfd);
                });
            }
        });

        return(dfd.promise);
    }
    this.unsubscribeSms = function (req, resp, sns, queryInfo, body) {
        var promise;
        var formVars = this.parseFormvars(body);

        if (formVars.arn) {
            promise = this._unsubscribeSms(sns, req, resp, formVars.arn);
        } else {
            var dfd = Q.defer();
            promise = dfd.promise;

            var wrappedResult = this.wrapResult(req, resp, { error: "Required formvar missing: 'arn'"}, this.applicationName);
            this.handleError(req, resp, null, 400, wrappedResult);
            dfd.reject(error);
        }

        return(promise);

    }
    this._unsubscribeSms = function (sns, req, resp, arn) {
        var dfd = Q.defer();
        var self = this;

        var params = {
            SubscriptionArn: arn // required
        };

        sns.unsubscribe(params, function (err, data) {
            self.handleResponse(req, resp, err, data, dfd);
        });

        return(dfd.promise);
    }

    this.subscribeSms = function (req, resp, sns, queryInfo, body) {
        var formVars = this.parseFormvars(body);
        var promise = this.validateFormVars(req, resp, queryInfo.formVars, formVars);

        if (!promise) {
            promise = this._subscribeSms(sns, req, resp, formVars[this.getTemplateName(queryInfo.formVars.TopicArn)],
                                         formVars[this.getTemplateName(queryInfo.formVars.Endpoint)]);
        }

        return(promise);
    }

    this._subscribeSms = function (sns, req, resp, topicArn, phoneNumber) {
        var dfd = Q.defer();
        var self = this;

        var params = {
            Protocol: snsProtocols.PROTOCOL_SMS,
            TopicArn: topicArn, // required
            Endpoint: phoneNumber
        };

        sns.subscribe(params, function (err, data) {
            self.handleResponse(req, resp, err, data, dfd);
        });

        return(dfd.promise);
    }

    this.publish = function (req, resp, sns, queryInfo, body) {
        var formVars = this.parseFormvars(body);
        var promise = this.validateFormVars(req, resp, queryInfo.formVars, formVars);

        if (!promise) {
            promise = this._publish(sns, req, resp, formVars[this.getTemplateName(queryInfo.formVars.TopicArn)],
                                    formVars[this.getTemplateName(queryInfo.formVars.Message)],
                                    formVars[this.getTemplateName(queryInfo.formVars.Subject)]);
        }
        return(promise);

    }

    this._publish = function (sns, req, resp, topicArn, message, subject) {
        var dfd = Q.defer();
        var self = this;

        var params = {
            Message: message,
            MessageAttributes: {
                someKey: {
                    DataType: 'String',// required
                    //BinaryValue: new Buffer('...') || 'STRING_VALUE',
                    StringValue: 'kv'
                }
            },
            Subject: subject,
            TopicArn: topicArn
        };

        sns.publish(params, function (err, data) {
            self.handleResponse(req, resp, err, data, dfd);
        });

        return(dfd.promise);
    }

    this.topics = function (req, resp, sns, queryInfo) {
        return(this._collection(req, resp, sns, queryInfo, 'Topic'));
    }

    this.subscriptions = function (req, resp, sns, queryInfo) {
        return(this._collection(req, resp, sns, queryInfo, 'Subscription'));
    }

    this.platformApplications = function (req, resp, sns, queryInfo) {
        return(this._collection(req, resp, sns, queryInfo, 'PlatformApplication'));
    }

    this._collection = function (req, resp, sns, queryInfo, baseName) {
        return(this.__collection(req, resp, sns, queryInfo,
                                 'list' + baseName + 's', baseName + 's', 'get' + baseName + 'Attributes',
                                 baseName + 'Arn'));
    }

    this.__collection = function (req, resp, sns, queryInfo, snsMethodName, collectionName, snsIdMethodName, arnName) {
        var arn = this.getParameter(req.query, 'arn');
        if (arn) {
            return(this._collectionId(req, resp, sns, queryInfo, snsMethodName, snsIdMethodName, arnName, arn));
        } else {
            var dfd = Q.defer();
            var params = {
                //NextToken: 'STRING_VALUE'
            };
            var self = this;

            var methodName = 'sns.' + snsMethodName;
            var method = eval(methodName);
            if (method === null) {
                var error = {
                    code: 400,
                    message: "Bad internal method name resolution: " + methodName
                }
            } else {
                method.call(sns, params, function (err, data) {
                    var responseObject;
                    if (!err) {
                        var limit = parseInt(self.getParameter(req.query, 'limit', 10));
                        var collection = eval('data.' + collectionName);
                        if (collection.length > limit) {
                            var statement = 'data.' + collectionName + ' = _.first(collection, limit)';
                            eval('data.' + collectionName + ' = _.first(collection, limit)');
                        }
                        responseObject = data;
                    }
                    self.handleResponse(req, resp, err, responseObject, dfd);
                });
            }
            return(dfd.promise);
        }
    }

    this._collectionId = function (req, resp, sns, queryInfo, snsMethodName, snsIdMethodName, arnName, arn) {
        var dfd = Q.defer();

        var params = {};
        params[arnName] = arn;

        var methodName = 'sns.' + snsIdMethodName;
        var method = eval(methodName);
        if (method === null) {
            var error = {
                code: 400,
                message: "Bad internal method name resolution: " + methodName
            }
        } else {
            method.call(sns, params, function (err, data) {
                self.handleResponse(req, resp, err, responseObject, dfd);
            });
        }
        return(dfd.promise);
    }

    this.handleResponse = function(req, resp, err, data, dfd) {
        if (err) {
            var responseObject = this.wrapResult(req, resp, err, this.applicationName);
            this.handleError(req, resp, responseObject, 400);
            console.log(err, err.stack);
            dfd.reject(responseObject);
        } else {

            var result = _.pick(data, function(value, key) {
                return(key !== 'ResponseMetadata');
            });
            var responseObject = this.wrapResult(req, resp, result, this.applicationName, data.ResponseMetadata);
            this.handleSuccess(req, resp, responseObject, 200);
            dfd.resolve(responseObject);
        }
    }

};

SnsConnector.prototype = new serverBase.ServerBase();
exports.SnsConnector = SnsConnector;
