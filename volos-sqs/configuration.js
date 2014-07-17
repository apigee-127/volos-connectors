module.exports = {
    "restMap": {
        "receiveMessages": {
            queryParameters: {
                QueueUrl: '{queueUrl}',
                MaxNumberOfMessages: '{maxNumberOfMessages}',
                VisibilityTimeout: '{visibilityTimeout}',
                WaitTimeSeconds: '{waitTimeSeconds}'
            },
            path: '/messages'
        },

        "sendMessage": {
            restSemantic: "POST",
            formVars: {
                QueueUrl: '{queueUrl}',
                MessageBody: '{messageBody}'
            },
            optionalFormVars: {
                DelaySeconds: '{delaySeconds}'
            },
            path: '/messages'
        },

        "deleteMessage": {
            restSemantic: "DELETE",
            queryParameters: {
                QueueUrl: '{queueUrl}',
                ReceiptHandle: '{receiptHandle}'
            },
            path: '/messages'
        },

        "getQueue": {
            path: '/queues/:id'
        },

        "listQueues": {
            queryParameters: {
                QueueNamePrefix: '{prefix}'
            },
            path: '/queues'
        },

        "createQueue": {
            restSemantic: "POST",
            formVars: {
                QueueName: '{queueName}'
            },
            path: '/queues'
        },

        "updateQueue": {
            restSemantic: "PUT",
            formVars: {
                QueueUrl: '{queueUrl}'
            },
            path: '/queues'
        },

        "deleteQueue": {
            restSemantic: "DELETE",
            queryParameters: {
                QueueUrl: '{queueUrl}'
            },
            path: '/queues'
        }
    },
    "options": {
        attributePrefix: "attribute."
    }
};