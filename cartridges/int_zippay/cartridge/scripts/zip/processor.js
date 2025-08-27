/* globals dw, session */

'use strict';

var Transaction = require('dw/system/Transaction');
var ZipHelpers = require('~/cartridge/scripts/zip/helpers/zip');

/**
 * @returns {Object} error auth result
 */
function generateErrorAuthResult() {
    return { error: true };
}

/**
 * @returns {Object} success auth result
 */
function generateSuccessAuthResult() {
    return { authorized: true };
}

/**
 * Update Order Data
 *
 * @param {dw.order.LineItemCtnr} order - Order object
 * @param {string} orderNo - Order Number
 * @param {dw.order.OrderPaymentInstrument} paymentInstrument - current payment instrument
 * @returns {Object} Processor authorizing result
 */
function authorize(order, orderNo, paymentInstrument) {
    var authorizePayment = require('~/cartridge/scripts/zip/authorizePayment');

    try {
        authorizePayment(order, paymentInstrument, orderNo);
        return generateSuccessAuthResult();
    } catch (e) {
        dw.system.Logger.error(e.message + '\n\r' + e.stack);
        return generateErrorAuthResult();
    }
}

/**
 * Handle the processing of a new Zip payment transaction
 *
 * @param {dw.order.LineItemCtnr} basket - Current basket
 * @param {string} paymentMethodId - payment method Id
 * @returns {Object} Processor handling result
 */
function handle(basket, paymentMethodId) {
    if (!ZipHelpers.isPaymentMethodZip(paymentMethodId)) {
        return {
            success: false,
            error: 'unrecognized payment method ID'
        };
    }

    var amount = basket.totalGrossPrice;

    var paymentInstrument = null;

    Transaction.wrap(function () {
        paymentInstrument = basket.createPaymentInstrument(paymentMethodId, amount);
    });

    return {
        success: true,
        paymentInstrument: paymentInstrument
    };
}

module.exports.authorize = authorize;
module.exports.handle = handle;
