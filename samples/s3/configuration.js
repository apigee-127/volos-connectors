module.exports = {
    "restMap" : {
        "object" : {
            fieldsBasic:  {Key : 'key', LastModified : 'lastModified', Size: 'size'},
            fieldsExpanded:'*',
            idName: 'Key',
            queryParameters : {
                Delimiter: '{delimiter}',
                EncodingType: '{encodingType}',
                Key: '{key}'
            },
            path: '/buckets/:bucketid/object'
        },
        "putObject" : {
            restSemantic: "PUT",
            queryParametersRequired : {
                Key: '{key}'
            },
            path: '/buckets/:bucketid/object'
        },
        "deleteObject" : {
            restSemantic: "DELETE",
            queryParametersRequired : {
                Key: '{key}'
            },
            path: '/buckets/:bucketid/object'
        },
        "bucketItem":  {
            fieldsBasic:  {'Name' : 'name', 'date' : 'CreationDate'},
            fieldsExpanded: '*',
            fieldsId:'*',
            idName: 'Name',
            queryParameters : {
                Delimiter: '{delimiter}',
                EncodingType: '{encodingType}',
                Marker: '{marker}',
                Prefix: '{prefix}'
            },
            path: '/buckets/:bucketid'
        },
        "buckets":  {
            fieldsBasic:  {'Name' : 'name', 'date' : 'CreationDate'},
            fieldsExpanded: '*',
            idName: 'Name',
            queryParameters : {
            },
            path: '/buckets'
        }
    },
    "options" : {

    }
}