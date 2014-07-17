module.exports = {
    'people': {
        queryStringBasic: 'SELECT idpeople FROM apigee.people',
        queryStringExpanded: 'SELECT * FROM apigee.people',
        idName: 'idpeople',
        queryParameters: {
            firstname: 'firstname = \'{firstname}\'',
            lastname: 'lastname = \'{lastname}\''
        }
    },
    'addPerson': {
        restSemantic: "POST",
        table: 'apigee.people',
        path: '/people'
    },
    'deletePersonId': {
        restSemantic: "DELETE",
        table: 'apigee.people',
        idName: 'idpeople',
        path: '/people/:id',
        queryParameters: {
            firstname: 'firstname = \'{firstname}\'',
            lastname: 'lastname = \'{lastname}\''
        }
    },
    'deletePerson': {
        restSemantic: "DELETE",
        table: 'apigee.people',
        path: '/people',
        queryParameters: {
            idpeople: 'idpeople = \'{idpeople}\'',
            firstname: 'firstname = \'{firstname}\'',
            lastname: 'lastname = \'{lastname}\''
        }
    },
    'updatePersonId': {
        restSemantic: "PUT",
        table: 'apigee.people',
        idName: 'idpeople',
        path: '/people/:id',
        queryParameters: {
            firstname: 'firstname = \'{firstname}\'',
            lastname: 'lastname = \'{lastname}\''
        }
    },
    'updatePerson': {
        restSemantic: "PUT",
        table: 'apigee.people',
        path: '/people',
        queryParameters: {
            idpeople: 'idpeople = \'{idpeople}\'',
            firstname: 'firstname = \'{firstname}\'',
            lastname: 'lastname = \'{lastname}\''
        }
    }
}