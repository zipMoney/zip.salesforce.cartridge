/* globals session, empty */

'use strict';

var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

/**
 * Zip Checkout Session Model
 *
 * When a new Zip checkout is created, an order is created as well.
 * The order id is then saved within the current session.
 * When the redirection is handled from Zip, the code must fail the session order,
 * even if its different from the order referenced by the Zip checkout,
 * so the redirect back to checkout works.
 */
var ZipCheckoutSessionHelper = {
    /**
     * Indicates if the session contains a zip order id.
     *
     * @returns {boolean} true, if session contains zip order id.
     */
    hasZipOrder: function () {
        return (!empty(session.privacy.ZipOrderId));
    },
    /**
     * Remove Zip order.
     */
    removeZipOrder: function () {
        session.privacy.ZipOrderId = null;
    },
    /**
     * Fail Zip Order and remove it from session.
     *
     */
    failZipOrder: function () {
        var sessionOrder = OrderMgr.getOrder(session.privacy.ZipOrderId);

        if (!empty(sessionOrder) && sessionOrder.getStatus().value === sessionOrder.ORDER_STATUS_CREATED) {
            Transaction.wrap(function () {
                OrderMgr.failOrder(sessionOrder, true);
            });
        }
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket) {
            Transaction.wrap(function () {
                var zipPaymentInstrument = currentBasket.getPaymentInstruments('Zip');
                var quadPaymentInstrument = currentBasket.getPaymentInstruments('QuadPay');
                var payFlexPaymentInstrument = currentBasket.getPaymentInstruments('PayFlex');

                if (!empty(zipPaymentInstrument)) {
                    currentBasket.removePaymentInstrument(zipPaymentInstrument[0]);
                } else if (!empty(quadPaymentInstrument)) {
                    currentBasket.removePaymentInstrument(quadPaymentInstrument[0]);
                } else if (!empty(payFlexPaymentInstrument)) {
                    currentBasket.removePaymentInstrument(payFlexPaymentInstrument[0]);
                }
            });
        }

        this.removeZipOrder();
    },
    /**
     * Save Zip order in session.
     *
     * @param {dw.order.Order} zipOrder Zip Order
     */
    saveZipOrder: function (zipOrder) {
        Transaction.wrap(function () {
            session.privacy.ZipOrderId = zipOrder.getOrderNo();
        });
    },
    /**
     * Retrieve zip order id from session.
     *
     * @returns {string} Zip Order Id.
     */
    getZipOrderId: function () {
        return session.privacy.ZipOrderId;
    }
};

module.exports = ZipCheckoutSessionHelper;
