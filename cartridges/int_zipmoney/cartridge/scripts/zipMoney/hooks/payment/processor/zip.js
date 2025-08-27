'use strict';

/* global dw */

var ZipProcessor = require('*/cartridge/scripts/zip/processor');

/**
 * Handle entry point for SG integration
 * @param {Object} basket Basket
 * @returns {Object} processor result
 */
function Handle(args) {
    var result = ZipProcessor.handle(args.Basket, args.PaymentMethodID);
    return result;
}

/**
 * Authorize entry point for SG integration
 * @param {Object} orderNumber order numebr
 * @param {Object} paymentInstrument payment intrument
 * @returns {Object} processor result
 */
function Authorize(args) {
    var result = ZipProcessor.authorize(args.Order, args.OrderNo, args.PaymentInstrument);
    return result;
}

exports.Handle = Handle;
exports.Authorize = Authorize;
