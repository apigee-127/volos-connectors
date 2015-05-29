'use strict';

var fs = require('fs'),
    path = require('path'),
    _ = require('lodash');

exports.sqlRestMapper = function(root) {

    var map = {},
        maps = [],
        _processing = {},
        _cur = '';

    _.map(fs.readdirSync(root + '/.'), function(file) {
        if (file === 'map.js' || file === 'baseMap.js' || file === 'queryToRestMap.js') {
            console.log('Loading Base Map: ' + file);
            map = require(root + '/' + file);

        } else if (file != 'index.js' && file != 'map.js' && file.indexOf('.') !== 0) {
            var name = file;
            var ext = path.extname(file);
            if (ext)
                name = name.slice(0, -ext.length);

            maps[name] = require(root + '/' + name);

        } else {
            console.log('Ignoring: ' + file);
        }
    });

    _.map(_.keys(maps), function(_cur) {

        console.log('Loading Map: ' + _cur);
        _processing = maps[_cur];
        _.map(_.keys(_processing), function(key) {

            //grab the entry, BEFORE we munge the key
            var item = _processing[key];

            if (key === 'self' || key === _cur) {
                //Special case of 'self'
                key = _cur;

            } else if (key.indexOf(_cur + '/') === 0) {
                //Already handled

            } else {
                //prepend the root
                key = _cur + '/' + key;

            }

            //If there is ONLY an expanded querystring, use it for basic and vice versa...
            if (!item.queryStringBasic && item.queryStringExpanded)
                item.queryStringBasic = item.queryStringExpanded;

            if (!item.queryStringExpanded && item.queryStringBasic)
                item.queryStringExpanded = item.queryStringBasic;

            //if neither, don't load
            if (item.queryStringBasic)
                if (map[key])
                    console.log('Overriding: ' + key);

            map[key] = item;

        });
    });
    return map;

};
