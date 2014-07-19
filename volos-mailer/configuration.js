module.exports = {
    "restMap" : {
        "mail" : {
            fieldsBasic:  {Key : 'key', LastModified : 'lastModified', Size: 'size'},
            fieldsExpanded:'*',
            idName: 'Key',
            queryParameters : {
                from: '{from}',
                to: '{to}',
                subject: '{subject}',
                text: '{text}',
                html: '{html}'
            },
            optionalQueryParameters: {
                cc: '{cc}',
                bcc: '{bcc}',
                replyTo: '{replyTo}',
                inReplyTo: '{inReplyTo}',
                references: '{references}',
                generateTextFromHTML: '{generateTextFromHTML}',
                envelope: '{envelope}',
                messageId: '{messageId}',
                date: '{date}',
                encoding: '{encoding}',
                charset: '{charset}'
            },
            path: '/mail'
        },
        "postMail" : {
            restSemantic: "POST",
            formVars : {
                from: '{from}',
                to: '{to}',
                subject: '{subject}',
                text: '{text}',
                html: '{html}'
            },
            optionalFormVars: {
                cc: '{cc}',
                bcc: '{bcc}',
                replyTo: '{replyTo}',
                inReplyTo: '{inReplyTo}',
                references: '{references}',
                generateTextFromHTML: '{generateTextFromHTML}',
                envelope: '{envelope}',
                messageId: '{messageId}',
                date: '{date}',
                encoding: '{encoding}',
                charset: '{charset}'
            },
            path: '/mail'
        }
    },
    "options" : {

    }
}