/* globals dw, session */

'use strict';

var loadPreference = require('~/cartridge/scripts/zipMoney/util/loadPreferences');
var storefrontCartridgeName = loadPreference.loadStorefrontCartridgeName();

var Transaction = require('dw/system/Transaction');
var Cart = require(storefrontCartridgeName + '/cartridge/scripts/models/CartModel');
var ZipHelpers = require('~/cartridge/scripts/zipMoney/helpers/zip');

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
function authorize(args) {
    var order = args.Order;
    var orderNo = args.OrderNo;
    var paymentInstrument = args.PaymentInstrument;

    var authorizePayment = require('~/cartridge/scripts/zipMoney/authorizePayment');

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
function handle(args) {
    var basket = args.Basket;
    var paymentMethodId = args.PaymentMethodID;
    var cartModel = Cart.get(args.Basket);

    if (!ZipHelpers.isPaymentMethodZip(paymentMethodId)) {
        return {
            success: false,
            error: 'unrecognized payment method ID'
        };
    }

    var amount = cartModel.getNonGiftCertificateAmount();

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
