/* globals empty */

'use strict';

var ZipPaymentTransactionModel = require('~/cartridge/models/zip/zipPaymentTransaction');
var ZipHelpers = require('~/cartridge/scripts/zip/helpers/zip');

/**
 * Zip Order Wrapper
 *
 * Zip Order is an Order associated with a Zip Charge.
 * The charge is associated to a Zip Payment Transaction within the Order.
 * Multiple captures with partial amounts are allowed, to the extend of the amount not
 * captured yet.
 * Multiple refunds with partial amounts are allowed, to the extend of the captured amount
 * minus the amount already refunded.
 */
var ZipOrder = {
    getZipOrderTotal: function (order) {
        return order.getTotalGrossPrice();
    },
    getZipCapturedAmount: function (order) {
        var amount = order.custom.ZipCapturedAmount;
        if (!amount) {
            return 0.0;
        }
        return amount;
    },
    getZipRefundedAmount: function (order) {
        var amount = order.custom.ZipRefundedAmount;
        if (!amount) {
            return 0.0;
        }
        return amount;
    },
    getRefundableAmount: function (order) {
        return Math.round((this.getZipCapturedAmount(order) - this.getZipRefundedAmount(order)) * 100) / 100;
    },
    getAmountNotCapturedYet: function (order) {
        return Math.round((this.getZipOrderTotal(order).getValue() - order.custom.ZipCapturedAmount) * 100) / 100;
    },
    isFullyPaid: function (order) {
        return (order.getPaymentStatus().getValue() === order.PAYMENT_STATUS_PAID);
    },
    /**
     * Retrieve paymentTransaction by given order
     * @param {dw.order.Order} order - The order object
     * @returns {dw.order.PaymentTransaction} - The paymentTransaction object
     */
    getPaymentTransactionByOrder: function (order) {
        var paymentInstrument = ZipHelpers.getZipPaymentInstrument(order);
        if (!paymentInstrument) {
            return null;
        }

        var paymentTransaction = paymentInstrument.getPaymentTransaction();
        if (!paymentTransaction) {
            return null;
        }

        return paymentTransaction;
    },
    /**
     * Update order object after successful Cancel request.
     *
     * Upon a successful Cancel request, the Order is cancelled and
     * marked as not paid.
     *
     * @param {dw.order.Order} order - The order object
     */
    reflectCancel: function (order) {
        order.setPaymentStatus(order.PAYMENT_STATUS_NOTPAID);
        order.setStatus(order.ORDER_STATUS_CANCELLED);
    },
    /**
     * Update order due to a successful refund request.
     *
     * Multiple refunds can happen on a single Zip Charge.
     * A refunded amount cannot be recaptured again.
     *
     * @param {dw.order.Order} order - the Order object.
     * @param {number} refundAmount - the amount refunded.
     */
    reflectRefund: function (order, refundAmount) {
        var ord = order;
        var totalRefundedAmount = this.getZipRefundedAmount(order) + parseFloat(refundAmount);

        ord.custom.ZipRefundedAmount = (Math.round(totalRefundedAmount * 100) / 100);
    },
    /**
     * Update order due to a successful capture request.
     *
     * Multiple captures can happen on a single Zip charge.
     * On each succcessful capture, the order's marked as partially paid (PARTPAID).
     * If all the transaction amount has been captured, the order's marked as PAID.
     *
     * @param {dw.order.Order} order - the Order object.
     * @param {number} capturedAmount - the amount captured.
     */
    reflectCapture: function (order, capturedAmount) {
        var ord = order;

        var transaction = this.getPaymentTransactionByOrder(order);
        var totalAmount = transaction.getAmount().getValue();

        var totalCapturedAmount = order.custom.ZipCapturedAmount + capturedAmount;

        var newOrderPaymentStatus = order.PAYMENT_STATUS_PAID;
        var amountLeft = Math.round((totalAmount - totalCapturedAmount) * 100) / 100;

        if (amountLeft) {
            newOrderPaymentStatus = order.PAYMENT_STATUS_PARTPAID;
        }

        ord.custom.ZipCapturedAmount = (Math.round(totalCapturedAmount * 100) / 100);
        ord.setPaymentStatus(newOrderPaymentStatus);
    },
    /**
     * Update order due to a charge authorization.
     *
     * @param {dw.order.Order} order - the Order object.
     * @param {dw.order.PaymentTransaction} paymentTransaction - the Payment Transaction object.
     * @param {Object} chargeResult - charge result from Zip API call.
     * @param {boolean} autoCapture - true, if the auto-capture is turned on.
     */
    reflectChargeAuthorized: function (order, paymentTransaction, chargeResult, autoCapture) {
        var ord = order;

        ord.custom.ZipReceiptNumber = chargeResult.receipt_number;

        ZipPaymentTransactionModel.reflectChargeAuthorized(paymentTransaction, chargeResult, autoCapture);

        if (autoCapture) {
            this.reflectCapture(order, paymentTransaction.getAmount().getValue());
        }
    },
    /**
     * Return payment method ID of first Zip payment instrument.
     *
     * @param {dw.order.Order} order Order.
     * @returns {string} PaymentMethod Id.
     */
    getZipPaymentMethodId: function (order) {
        var selectedPaymentMethodId = '';
        var paymentInstruments = order.getPaymentInstruments();
        var iterator = paymentInstruments.iterator();
        var paymentInstrument = null;
        while (iterator.hasNext()) {
            paymentInstrument = iterator.next();
            var paymentMethodId = paymentInstrument.getPaymentMethod();

            if (ZipHelpers.isPaymentMethodZip(paymentMethodId)) {
                selectedPaymentMethodId = paymentMethodId;
                break;
            }
        }
        return selectedPaymentMethodId;
    },
    getZipReceiptNumber: function (order) {
        return order.custom.ZipReceiptNumber;
    }
};

module.exports = ZipOrder;
