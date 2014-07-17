module.exports = {
    "restMap": {
        "subscriptions": {
            queryParameters: {
                arn: '{arn}'
            }
        },
        "subscribeSms": {
            restSemantic: "POST",
            idName: 'Key',
            queryParameters: {
            },
            formVars: {
                TopicArn: '{arn}',
                Endpoint: '{phone}'
            },
            path: '/subscriptions'
        },
        "unsubscribeSms": {
            restSemantic: "DELETE",
            idName: 'Key',
            queryParameters: {
                arn: '{arn}'
            },
            path: '/subscriptions'
        },
        "publish": {
            restSemantic: "POST",
            idName: 'Key',
            queryParameters: {
            },
            formVars: {
                Message: '{message}',
                Subject: '{subject}',
                TopicArn: '{arn}'
            },
            path: '/publications'
        },
        "createTopic": {
            restSemantic: "POST",
            idName: 'Key',
            queryParameters: {
            },
            formVars: {
                Name: '{name}',
                AttributeValue: '{displayName}'
            },
            path: '/topics'
        },
        "topics": {
            queryParameters: {
                arn: '{arn}'
            },
            path: '/topics'
        },
        "platformApplications": {
            queryParameters: {
                arn: '{arn}'
            },
            path: '/platformApplications'
        }
    },
    "options": {

    }
};