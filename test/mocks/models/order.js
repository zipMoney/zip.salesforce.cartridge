'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function proxyModel() {
    return proxyquire('../../../cartridges/int_zippay_sfra/cartridge/models/order', {
        '~/cartridge/scripts/zip/helpers/zip': require('../scripts/zip/helpers/zip'),
        'module.superModule': 'test'
    });
}

module.exports = proxyModel();
