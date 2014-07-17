module.exports = {
    'opportunity': {
        queryStringBasic: 'SELECT id, Owner.Name FROM Opportunity',
        queryStringExpanded: 'SELECT id, AccountId, Account.Name, RecordType.Name, Owner.Name, Owner.Email FROM Opportunity',
        idName: 'Id',
        queryParameters: {
            lastDays: 'lastmodifieddate=LAST_N_DAYS: {lastDays}',
            accountName: 'Account.Name = \'{accountName}\'',
            ownerName: 'Owner.Name = \'{ownerName}\'',
            ownerEmail: 'Owner.Email = \'{ownerEmail}\''
        }
    },
    'account': {
        queryStringBasic: 'SELECT id, Owner.Name FROM Account',
        queryStringExpanded: 'SELECT id, Owner.Id, Owner.Name, Owner.Email,Owner.Region__c FROM Account',
        idName: 'Id',
        queryParameters: {
            lastDays: 'lastmodifieddate=LAST_N_DAYS: {lastDays}'
        }
    },
    'case': {
        queryStringBasic: 'SELECT id, Owner.Name FROM Case',
        queryStringExpanded: 'SELECT id, Owner.Id, Owner.Name, Owner.Email, Owner.UserRole.Name, RecordType.Name FROM Case',
        idName: 'Id',
        queryParameters: {
            lastDays: 'lastmodifieddate=LAST_N_DAYS: {lastDays}'
        }
    },
    'customer': {
        queryStringBasic: 'SELECT id, Account__r.Id, Account__r.Name FROM Customer__c',
        queryStringExpanded: 'SELECT id, Account__r.Id, Account__r.Name FROM Customer__c',
        idName: 'Id',
        queryParameters: {
            lastDays: 'lastmodifieddate=LAST_N_DAYS: {lastDays}'
        }
    },
    'contact': {
        queryStringBasic: 'SELECT id, Name, Email FROM Contact',
        queryStringExpanded: 'SELECT id, Name, Email, MailingStreet, MailingCity, MailingState, MailingCountry, MailingPostalCode, MobilePhone FROM Contact',
        idName: 'Id',
        queryParameters: {
            lastDays: 'lastmodifieddate=LAST_N_DAYS: {lastDays}'
        }
    },
    'lead': {
        queryStringBasic: 'SELECT id, Name, Email FROM Lead',
        queryStringExpanded: 'SELECT id, Name, Email, MobilePhone FROM Lead',
        idName: 'Id',
        queryParameters: {
            lastDays: 'lastmodifieddate=LAST_N_DAYS: {lastDays}'
        }
    }
}