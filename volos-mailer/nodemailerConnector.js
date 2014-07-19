var nodemailer = require("nodemailer");
var Q = require('q');
var serverBase = require('volos-connectors-common').serverBase;

var NodemailerConnector = function (options) {
    this.configuration = options.configuration || require('./configuration.js');
    this.applicationName = 'volos-mailer';
    //  rowCallback, rowCallbackContext
    this.options = options;
    var connector = this;

    // overrides
    this.setup = function (req, resp) {
        return(this.establishConnection(req, resp));
    }

    this.executeOperation = function (req, resp, setupResult) {
        return(setupResult ? setupResult.executeMethod.call(this, req, resp, setupResult.smtpTransport) : this.unknownPath(req, resp));
    }


    this.teardown = function (req, resp, smtpTransport, executeOperationResult) {
        var dfd = Q.defer();

        try {
            // if you don't want to use this transport object anymore, uncomment following line
            smtpTransport.close(); // shut down the connection pool, no more messages

        } catch (e) {
            throw e;
        }

        dfd.resolve('');
        return(dfd.promise);
    }

    this.supplyHelpObject = function () {
        return(this.configuration.restMap);
    }
    // <-- overrides

    this.establishConnection = function (req, resp) {
        var dfd = Q.defer();
        var self = this;

        this.prepareRequest(req, resp).then(
            function (prepareRequestResult) {

                // create reusable transport method (opens pool of SMTP connections)
                var smtpTransport = nodemailer.createTransport(self.options.profile);
                prepareRequestResult.smtpTransport = smtpTransport;
                dfd.resolve(prepareRequestResult);
            },
            function (err) {
                dfd.reject(err);
            }
        );

        return dfd.promise;
    }

    this.mail = function(req, resp, smtpTransport) {
        return(this.sendMail(req, resp, smtpTransport, req.query));
    }

    this.postMail = function(req, resp, smtpTransport) {
        return(this.sendMail(req, resp, smtpTransport, req.body));
    }

    this.sendMail = function (req, resp, smtpTransport, data) {
        var dfd = Q.defer();

        // setup e-mail data with unicode symbols
        var from = this.getParameter(data, 'from', null);
        var to = this.getParameter(data, 'to', null);
        var subject = this.getParameter(data, 'subject', null);
        var text = this.getParameter(data, 'text', null);
        var html = this.getParameter(data, 'html', null);

        if (!from || !to || !subject || (!text && !html)) {
            var error = {
                buildErrorMessage: function (item, text) {
                    if (!item) {
                        if (this.message) {
                            this.message += ' and ';
                        }
                        this.message += '\'' + text + '\'' + ' is required';
                    }
                    return(this);
                },
                message: ''
            };
            var errorMessage =
                error.buildErrorMessage(to, 'to')
                    .buildErrorMessage(from, 'from')
                    .buildErrorMessage(subject, 'subject')
                    .buildErrorMessage(text || html, 'text\' or \'html')
                    .message;


            console.log(errorMessage);
            var wrappedResult = this.wrapResult(req, resp, { error: errorMessage}, this.applicationName);
            resp.writeHead(200, errorMessage, {'Content-Type': 'application/json'});
            resp.end(JSON.stringify(wrappedResult, undefined, '\t'));
            dfd.reject(error);

        } else {
            var mailOptions = {
                from: from, // sender address
                to: to, // list of receivers
                subject: subject, // Subject line
                text: text, // plaintext body
                html: html // html body
            }

            var options = ['cc', 'bcc', 'replyTo', 'inReplyTo', 'references', 'generateTextFromHTML', 'envelope',
                           'messageId', 'date', 'encoding', 'charset'];
            for (var i = 0; i < options.length; ++i) {
                this.addOptional(data, mailOptions, options[i]);
            }

            var self = this;
            // send mail with defined transport object
            smtpTransport.sendMail(mailOptions, function (error, response) {
                if (error) {
                    console.log(error);
                    dfd.reject(error);
                    throw error;
                } else {
                    dfd.resolve(response);
                    console.log("Message sent: " + response.response);

                    var wrappedResult = self.wrapResult(req, resp, response, self.applicationName);
                    resp.writeHead(200, response.message, {'Content-Type': 'application/json'});
                    resp.end(JSON.stringify(wrappedResult, undefined, '\t'));
                }
            });
        }

        return dfd.promise;
    }

    this.addOptional = function (data, mailOptions, optionName) {
        var option = this.getParameter(data, optionName, null);
        if (option) {
            mailOptions[optionName] = option;
        }
    }

    this.buildErrorMessage = function (existingErrorMesssage, item, text) {
        if (!item) {
            if (existingErrorMesssage) {
                existingErrorMesssage += ' and ';
            }
            existingErrorMesssage += '\'' + text + '\'' + ' is required';
        }
        return(existingErrorMesssage);
    }

};

NodemailerConnector.prototype = new serverBase.ServerBase();
exports.NodemailerConnector = NodemailerConnector;
