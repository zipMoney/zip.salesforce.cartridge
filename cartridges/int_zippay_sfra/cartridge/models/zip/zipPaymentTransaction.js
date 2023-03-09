/* globals request, session, empty */

'use strict';

var Money = require('dw/value/Money');
var PaymentTransaction = require('dw/order/PaymentTransaction');

/**
 * Payment Transaction Wrapper
 *
 * A payment transaction is associated to only one Zip Charge.
 * The Zip Charge associated, can either be immediately be captured (autocapture),
 * or captured at a later point in time.
 */
var ZipPaymentTransaction = {
    /**
     * Save result from Cancel request into paymentTransaction
     * @param {dw.order.PaymentTransaction} paymentTransaction - The payment Transaction object
     * @param {Object} cancelResult - result object
     */
    reflectCancel: function () {
    },
    /**
    * Update payment transaction due to charge authorization
    *
    * @param {dw.order.PaymentTransaction} paymentTransaction - the payment transaction object
    * @param {Object} chargeResult - charge result from Zip API call.
    * @param {boolean} autoCapture - true, if the charge has been autocaptured.
    */
    reflectChargeAuthorized: function (paymentTransaction, chargeResult, autoCapture) {
        var paymentTransactionProp = paymentTransaction;
        var amount = chargeResult.amount;
        var currency = chargeResult.currency;
        var moneyAmount = new Money(amount, currency);
        var transactionType = autoCapture ? PaymentTransaction.TYPE_CAPTURE : PaymentTransaction.TYPE_AUTH;

        paymentTransactionProp.custom.isZipAutoCapture = autoCapture;
        paymentTransactionProp.custom.ZipChargeId = chargeResult.id;
        paymentTransactionProp.custom.ZipReceiptNumber = chargeResult.receipt_number;
        paymentTransactionProp.setAmount(moneyAmount);
        paymentTransactionProp.setType(transactionType);
    },
   /**
    * Update payment transactio due to charge capture.
    *
    * @param {dw.order.PaymentTransaction} paymentTransaction - the payment transaction object
    */
    reflectCapture: function (paymentTransaction) {
        paymentTransaction.setType(PaymentTransaction.TYPE_CAPTURE);
    }
};

module.exports = ZipPaymentTransaction;
