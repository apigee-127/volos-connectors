var assert = require('assert');
var AWS = require('aws-sdk');
var http = require('http');
var Q = require('q');
var serverBase = require('volos-connectors-common').serverBase;
var util = require('util');
var _ = require('lodash');

var SqsConnector = function (options) {
    this.applicationName = 'volos-sqs';
    this.configuration = options.configuration || require('./configuration.js');
    var connector = this;
    this.options = options;

    this.dataTypes = {
        DATATYPES_STRING: 'String',
        DATATYPES_STRING: 'Number',
        DATATYPES_STRING: 'Binary'
    }

    this.initializePaths(this.configuration.restMap);

    // Overrides -->
    this.setup = function (req, resp) {
        return(this.establishConnection(req, resp));
    }

    this.executeOperation = function (req, resp, setupResult) {
        var queryInfo = setupResult.queryInfo;
        setupResult.executeMethod.call(this, req, resp, setupResult.sqs, queryInfo, setupResult.postedBody);

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
                self.sqs = new AWS.SQS();
                prepareRequestResult.sqs = self.sqs;
                dfd.resolve(prepareRequestResult);
            },
            function (err) {
                var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                self.handleError(req, resp, wrappedResult, 400, '"executeOperation" failed');
                dfd.reject();
            },
            function (progress) {

            }
        );

        return dfd.promise;

    }

    this.receiveMessages = function (req, resp, sqs, queryInfo) {
        var dfd = Q.defer();

        if (!this.options.receiveMessageCallback) {
            dfd.reject('Callback receiveMessageCallback required but not supplied.');
        } else {
            var self = this;
            var queueUrl = this.getParameter(req.query, 'queueUrl', undefined);
            var maxNumberOfMessages = parseInt(this.getParameter(req.query, 'maxNumberOfMessages', 3));
            var visibilityTimeout = parseInt(this.getParameter(req.query, 'visibilityTimeout', 60));
            var waitTimeSeconds = parseInt(this.getParameter(req.query, 'waitTimeSeconds', 3));

            var params = {
                QueueUrl: queueUrl,
                MaxNumberOfMessages: maxNumberOfMessages, // number of messages to retrieve
                VisibilityTimeout: visibilityTimeout, //seconds to lock job
                WaitTimeSeconds: waitTimeSeconds // seconds to wait for message
            };

            sqs.receiveMessage(params, function (err, data) {
                if (err) {
                    var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                    self.handleError(req, resp, wrappedResult, 400, 'receiveMessage failed');
                    dfd.reject(wrappedResult);
                } else {
                    // Any messages to get?
                    if (data.Messages) {
                        // Get the first message (should be the only one since we said to only get one above)
                        var message = data.Messages[0];
                        var body;
                        try {
                            body = JSON.parse(message.Body);
                        } catch (e) {
                            body = message.Body;
                        }
                        self.options.receiveMessageCallback(body, message).then(
                            function (receiveMessageCallbackResult) {
                                self.dequeue(sqs, message, queueUrl).then(
                                    function (dequeueResult) {
                                        /*var wrappedResult = {
                                            receiveResult: data,
                                            dequeueResult: dequeueResult
                                        }*/

                                        var wrappedResult2 = self.wrapResult(req, resp, data.Messages, self.applicationName, data.ResponseMetadata);
                                        self.handleSuccess(req, resp, wrappedResult2, 201);
                                        dfd.resolve(wrappedResult);
                                    },
                                    function (err) {
                                        var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                                        self.handleError(req, resp, wrappedResult, 400, 'dequeue failed');
                                        dfd.reject(wrappedResult);
                                    }
                                );
                                dfd.resolve(result);
                            },
                            function (err) {
                                var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                                dfd.reject(wrappedResult);
                                dequeue(message, queueUrl);
                                self.handleError(req, resp, wrappedResult, 400, 'receiveMessageCallback failed');
                            },
                            function (progress) {
                            }
                        );
                    } else {
                        var wrappedResult = self.wrapResult(req, resp, {}, self.applicationName, data.ResponseMetadata);
                        self.handleSuccess(req, resp, wrappedResult, 200);
                        dfd.resolve(wrappedResult);
                    }
                }
            });
        }
        return(dfd.promise);
    }

    this.dequeue = function (sqs, message, queueUrl) {
        var dfd = Q.defer();

        var params = {
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle
        }
        sqs.deleteMessage(params, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                dfd.reject(err);
            } else {
                dfd.resolve(data);
            }
        });

        return(dfd.promise);
    };

    this.sendMessage = function (req, resp, sqs, queryInfo, body) {
        var dfd = Q.defer();
        var formVars = req.body;
        var self = this;

        var messageBody = formVars[this.getTemplateName(queryInfo.formVars.MessageBody)];
        var queueUrl = formVars[this.getTemplateName(queryInfo.formVars.QueueUrl)];

        var params = {
            MessageBody: messageBody,
            QueueUrl: queueUrl
        };

        var delaySeconds = formVars[this.getTemplateName(queryInfo.optionalFormVars.DelaySeconds)];

        if (delaySeconds) {
            params.DelaySeconds = parseInt(delaySeconds);
        }

        sqs.sendMessage(params, function (err, data) {
            if (err) {
                var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                self.handleError(req, resp, wrappedResult, 400, 'sendMessage failed');
                dfd.reject(wrappedResult);
            } else {
                var response = _.pick(data, function(value, key) {
                    return(key !== "ResponseMetadata");
                });
                var wrappedResult = self.wrapResult(req, resp, response, self.applicationName, data.ResponseMetadata);
                self.handleSuccess(req, resp, wrappedResult, 201);
                dfd.resolve(wrappedResult);
            }

        });

        return(dfd.promise);
    }

    this.deleteMessage = function (req, resp, sqs, queryInfo) {
        var dfd = Q.defer();
        var self = this;

        var queueUrl = this.getParameter(req.query, 'queueUrl', undefined);
        var receiptHandle = this.getParameter(req.query, 'receiptHandle', undefined);

        var params = {
            ReceiptHandle: receiptHandle,
            QueueUrl: queueUrl
        };

        sqs.deleteMessage(params, function (err, data) {
            if (err) {
                var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                self.handleError(req, resp, wrappedResult, 400, 'deleteMessage failed');
                dfd.reject(wrappedResult);
            } else {
                var wrappedResult = self.wrapResult(req, resp, data, self.applicationName);
                self.handleSuccess(req, resp, wrappedResult, 200);
                dfd.resolve(wrappedResult);
            }

        });
    }

    this.listQueues = function (req, resp, sqs, queryInfo) {
        var dfd = Q.defer();
        var self = this;

        var prefix = this.getParameter(req.query, 'prefix', undefined);

        var params = {};
        if (prefix) {
            params.QueueNamePrefix = prefix;
        }
        // Retrieve a list of available queues on our account
        sqs.listQueues(params, function (err, data) {
            if (err) {
                var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                self.handleError(req, resp, wrappedResult, 400, 'listQueues failed');
                dfd.reject(wrappedResult);
            } else {
                var metadata = _.pick(data, function(value, key) {
                    return(key !== "QueueUrls");
                });
                var wrappedResult = self.wrapResult(req, resp, data.QueueUrls, self.applicationName, metadata);
                self.handleSuccess(req, resp, wrappedResult, 200);
                dfd.resolve(wrappedResult);
            }
        });

        return(dfd.promise)
    }

    this.createQueue = function (req, resp, sqs, queryInfo, body) {
        var formVars = req.body;
        var promise = this.validateFormVars(req, resp, queryInfo.formVars, formVars);

        if (!promise) {
            var dfd = Q.defer();
            promise = dfd.promise;
            var self = this;

            var formVarQueueName = this.getTemplateName(queryInfo.formVars.QueueName);
            var queueName = formVars[formVarQueueName];

            var params = {
                QueueName: queueName
            };


            var setAttributes = false;
            var attributes = {};
            for (var fv in formVars) {
                if (fv !== formVarQueueName) {
                    setAttributes = true;
                    attributes[fv] = formVars[fv];
                }
            }
            if (setAttributes) {
                params.Attributes = attributes;
            }

            sqs.createQueue(params, function (err, data) {
                if (err) {
                    var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                    self.handleError(req, resp, wrappedResult, 400, 'createQueue failed');
                    dfd.reject(wrappedResult);
                } else {
                    var wrappedResult = self.wrapResult(req, resp, data, self.applicationName);
                    self.handleSuccess(req, resp, wrappedResult, 200);
                    dfd.resolve(wrappedResult);
                }
            });
        }
        return(promise);
    },

    this.updateQueue = function (req, resp, sqs, queryInfo, body) {
        var formVars = req.body;
        var promise = this.validateFormVars(req, resp, queryInfo.formVars, formVars);

        if (!promise) {
            var dfd = Q.defer();
            promise = dfd.promise;

            var queueUrl = formVars[this.getTemplateName(queryInfo.formVars.QueueUrl)];

            var params = {
                QueueUrl: queueUrl
            };

            var attributes = this.getAttributes(formVars);
            if (attributes) {
                params.Attributes = attributes;
            }

            var self = this;
            sqs.setQueueAttributes(params, function (err, data) {
                if (err) {
                    var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                    self.handleError(req, resp, wrappedResult, 400, 'setQueueAttributes failed');
                    dfd.reject(wrappedResult);
                } else {
                    var wrappedResult = self.wrapResult(req, resp, data, self.applicationName);
                    self.handleSuccess(req, resp, wrappedResult, 200);
                    dfd.resolve(wrappedResult);
                }
            });
        }
        return(promise);
    },

    this.deleteQueue = function (req, resp, sqs, queryInfo) {
        var dfd = Q.defer();
        var self = this;

        var queueUrl = this.getParameter(req.query, 'queueUrl', undefined);

        var params = {
            QueueUrl: queueUrl
        };

        sqs.deleteQueue(params, function (err, data) {
            if (err) {
                var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                self.handleError(req, resp, wrappedResult, 400, 'deleteMessage failed');
                dfd.reject(err);
            } else {
                var wrappedResult = self.wrapResult(req, resp, data, self.applicationName);
                self.handleSuccess(req, resp, wrappedResult, 200);
                dfd.resolve(data);
            }

        });
    }

    this.getQueue = function (req, resp, sqs, queryInfo) {
        var dfd = Q.defer();
        var self = this;

        //var queueName = this.getParameter(req.query, 'queueName', undefined);
        var queueName = req.params.id;

        var params = {
            QueueName: queueName
        };

        sqs.getQueueUrl(params, function (err, data) {
            if (err) {
                var wrappedResult = self.wrapResult(req, resp, err, self.applicationName);
                self.handleError(req, resp, wrappedResult, 400, 'getQueueUrl failed');
                dfd.reject(wrappedResult);
            } else {
                var metadata = _.pick(data, function(value, key) {
                    return(key !== "QueueUrl");
                });
                var wrappedResult = self.wrapResult(req, resp, data.QueueUrl, self.applicationName, metadata);
                self.handleSuccess(req, resp, wrappedResult, 200);
                dfd.resolve(wrappedResult);
            }

        });
    }

    this.getAttributes = function(formVars) {
        // Attribute syntax:
        //
        // &attribute.1=this
        // &attribute.2=that
        // &attribute.name=value

        var attributePrefix = this.configuration.options.attributePrefix;
        var hasAttributes = false;
        var attributes = {};
        for (var fv in formVars) {
            if (fv.substring(0, attributePrefix.length) === attributePrefix) {
                var attributeName = fv.substring(attributePrefix.length);
                hasAttributes = true;
                attributes[attributeName] = formVars[fv];
            }
        }
        return(hasAttributes ? attributes : null)
    }
};

SqsConnector.prototype = new serverBase.ServerBase();
exports.SqsConnector = SqsConnector;
