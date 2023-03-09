/* global dw */

'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Status = require('dw/system/Status');
var Order = require('dw/order/Order');
var PaymentMgr = require('dw/order/PaymentMgr');
var ZipHelpers = require('~/cartridge/scripts/zipMoney/helpers/zip');

/**
 * Attempts to place a pending order
 *
 * @param {dw.order.Order} order - The order object to be placed
 * @returns {Object} an error object
 */
function placePendingOrder(order) {
    var result = { error: false };

    try {
        Transaction.begin();
        var placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus === Status.ERROR) {
            throw new Error();
        }

        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);

        var paymentInstrument = ZipHelpers.getFirstZipPaymentInstrument(order);
        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod);
        var paymentProcessor = paymentMethod.getPaymentProcessor();

        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.transactionID = order.orderNo;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        });

        Transaction.commit();

        return result;
    } catch (e) {
        dw.system.Logger.error(e.message + '\n\r' + e.stack);

        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
        result.error = true;
    }
}

module.exports = placePendingOrder;
