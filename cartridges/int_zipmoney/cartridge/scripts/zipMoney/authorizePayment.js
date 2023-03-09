/* globals session, empty, dw */

'use strict';

var CreateChargeZipAPIRequest = require('~/cartridge/scripts/zipMoney/api/request/createCharge');
var ZipModel = require('~/cartridge/scripts/zipMoney/models/ZipModel');
var CustomerTokenInWalletModel = require('~/cartridge/scripts/zipMoney/models/ZipCustomerTokenInWalletModel');
var ZipOrderModel = require('~/cartridge/scripts/zipMoney/models/ZipOrderModel');
var Authority = require('~/cartridge/scripts/zipMoney/api/model/authority');

/**
 * This function handles Zip payment authorization.
 *
 * Zip payments are authorized by executing an API call to a "Create Charge" function. The result
 * is then reflected on the DW order by updating its attributes.
 *
 * Note that in order to create a charge, Zip requires an authority. If tokenization is required
 * (turned on by the merchant), the function will attempt to retrieve the token first from the Order
 * entity, and then, if not found, will attempt the Customer's Wallet. The token is going to be used
 * as an authority for Zip Charge creation. If tokenization is not required, the checkout authority
 * is going to be used.
 *
 * @param {dw.order.Order} order
 * @param {dw.order.PaymentInstrument} paymentInstrument
 * @param {string} orderNumber
 */
function authorizePayment(order, paymentInstrument, orderNumber) {
    var Transaction = require('dw/system/Transaction');
    var PaymentMgr = require('dw/order/PaymentMgr');

    var zipCheckoutId = (!empty(order.custom.ZipCheckoutId)) ? order.custom.ZipCheckoutId : '';
    var authority = new Authority('checkoutId', zipCheckoutId);

    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod);
    var customerProfile = order.getCustomer().getProfile();

    if (ZipModel.isTokenizationRequired(paymentMethod) && customerProfile) {
        var customerTokenInWalletModel = new CustomerTokenInWalletModel(customerProfile.getWallet());
        var token = customerTokenInWalletModel.findToken();

        if (!order.custom.ZipToken) {
            if (token) {
                Transaction.wrap(function() {
                    order.custom.ZipToken = token;
                });
            }
        } else {
            token = order.custom.ZipToken;
        }

        if (token) {
            authority = new Authority('account_token', token);
        }
    }

    var paymentProcessor = paymentMethod.getPaymentProcessor();
    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNumber;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    try {
        var isAutoCaptureEnabled = ZipModel.isAutoCaptureEnabled(paymentMethod);

        var createChargeAPIRequest = new CreateChargeZipAPIRequest();

        var transaction = paymentInstrument.getPaymentTransaction();
        var chargeResult = createChargeAPIRequest.execute(authority, paymentInstrument, orderNumber, isAutoCaptureEnabled);

        Transaction.wrap(function() {
            ZipOrderModel.reflectChargeAuthorized(order, transaction, chargeResult, isAutoCaptureEnabled);
        });
    } catch (e) {
        dw.system.Logger.error(e.message + '\n\r' + e.stack);

        if (e.name === 'ZipError') {
            session.privacy.ZipErrorCode = e.message;
        }

        throw e;
    }

}

module.exports = authorizePayment;
