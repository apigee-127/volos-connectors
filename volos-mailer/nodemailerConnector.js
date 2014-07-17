var nodemailer = require("nodemailer");
var Q = require('q');
var serverBase = require('volos-connectors-common').serverBase;

var NodemailerConnector = function (options) {
    this.applicationName = 'volos-mailer';
    //  rowCallback, rowCallbackContext
    this.options = options;
    var connector = this;

    // overrides
    this.setup = function (req, resp) {
        return(this.establishConnection(req, resp));
    }

    this.executeOperation = function (req, resp, smtpTransport) {
        return(this.sendMail(req, resp, smtpTransport));
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
    // <-- overrides
    // private -->
    this.establishConnection = function (req, resp) {
        var dfd = Q.defer();

        // create reusable transport method (opens pool of SMTP connections)
        var smtpTransport = nodemailer.createTransport("SMTP", this.options.profile);
        dfd.resolve(smtpTransport);

        return dfd.promise;
    }

    this.sendMail = function (req, resp, smtpTransport) {
        var dfd = Q.defer();

        // setup e-mail data with unicode symbols
        var from = this.getParameter(req.query, 'from', null);
        var to = this.getParameter(req.query, 'to', null);
        var subject = this.getParameter(req.query, 'subject', null);
        var text = this.getParameter(req.query, 'text', null);
        var html = this.getParameter(req.query, 'html', null);

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
                this.addOptional(req, mailOptions, options[i]);
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
                    console.log("Message sent: " + response.message);

                    var wrappedResult = self.wrapResult(req, resp, response, self.applicationName);
                    resp.writeHead(200, response.message, {'Content-Type': 'application/json'});
                    resp.end(JSON.stringify(wrappedResult, undefined, '\t'));
                }
            });
        }

        return dfd.promise;
    }

    this.addOptional = function (req, mailOptions, optionName) {
        var option = this.getParameter(req.query, optionName, null);
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
// <-- private

};

NodemailerConnector.prototype = new serverBase.ServerBase();
exports.NodemailerConnector = NodemailerConnector;
