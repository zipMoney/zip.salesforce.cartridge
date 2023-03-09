'use strict';

/* global dw */

var ZipProcessor = require('~/cartridge/scripts/zipMoney/processor');

/**
 * Handle entry point for SG integration
 * @param {Object} basket Basket
 * @returns {Object} processor result
 */
function Handle(args) {
    var result = ZipProcessor.handle(args);
    return result;
}

/**
 * Authorize entry point for SG integration
 * @param {Object} orderNumber order numebr
 * @param {Object} paymentInstrument payment intrument
 * @returns {Object} processor result
 */
function Authorize(args) {
    var result = ZipProcessor.authorize(args);
    return result;
}

exports.Handle = Handle;
exports.Authorize = Authorize;
