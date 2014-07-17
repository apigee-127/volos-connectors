module.exports = {
    "restMap" : {
        "engineering":  {
            base: "cn=engineering,ou=departments,dc=api-connectors,dc=com",
            attributesBasic:  {'dn' : 'distinguishedName', 'member' : 'member'},
            attributesExpanded: '*',
            attributesId: '*',
            queryParameters : {
            },
            path: '/departments/engineering'
        },
        "products":  {
            base: "cn=products,ou=departments,dc=api-connectors,dc=com",
            attributesBasic:  {'dn' : 'distinguishedName', 'member' : 'member'},
            attributesExpanded: '*',
            attributesId: '*',
            queryParameters : {
            },
            path: '/departments/products'
        },
        "departments":  {
            base: "ou=departments,dc=api-connectors,dc=com",
            attributesBasic:  {'dn' : 'distinguishedName', 'cn' : 'commonName', 'member' : 'member'},
            attributesExpanded:'*',
            attributesId: '*',
            queryParameters : {
            }
        },
        "connectors": {
            base: "cn=connectors,ou=projects,dc=api-connectors,dc=com",
            attributesBasic:  {'dn' : 'distinguishedName', 'cn' : 'commonName', 'member' : 'member'},
            attributesExpanded:'*',
            attributesId: '*',
            queryParameters : {
            },
            path: '/projects/connectors'
        },
        "projects":  {
            base: "ou=projects,dc=api-connectors,dc=com",
            attributesBasic:  {'cn' : 'commonName', 'member' : 'member'},
            attributesExpanded:'*',
            attributesId: '*',
            queryParameters : {
            }
        },
        "people": {
            idName: 'cn',
            base: "ou=people,dc=api-connectors,dc=com",
            attributesBasic: [{'cn' : 'cn'}],
            attributesExpanded: {'dn' : 'distinguishedName', 'cn' : 'commonName', 'sn' : 'surname'},
            attributesId: {'dn' : 'distinguishedName', 'cn' : 'commonName', 'sn' : 'surname', 'userPassword' : 'password'},
            queryParameters : {
            }
        },
        "postPeople": {
            restSemantic: "POST",
            idName: 'cn',
            base: "ou=people,dc=api-connectors,dc=com",
            attributesBasic: [{'cn' : 'cn'}],
            attributesExpanded: {'dn' : 'distinguishedName', 'cn' : 'commonName', 'sn' : 'surname'},
            attributesId: {'dn' : 'distinguishedName', 'cn' : 'commonName', 'sn' : 'surname', 'userPassword' : 'password'},
            queryParameters : {
                verify: '{verify}'
            },
            formVars: {
                attributeNameUser: '{user}',
                attributeNamePassword: '{password}'
            },
            credentialsInformation : {
                attributeNameUser: "cn",
                attributeNamePassword: "userPassword",
                canEdit: true
            },
            path: '/people'
        }
    },
    "options" : {
        "expandLists": true
    }
}