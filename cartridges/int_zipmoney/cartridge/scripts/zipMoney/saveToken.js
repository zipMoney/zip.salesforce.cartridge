/* global empty */

'use strict';

var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');

var CreateTokenZipAPIRequest = require('~/cartridge/scripts/zipMoney/api/request/createToken');
var CustomerTokenInWalletModel = require('~/cartridge/scripts/zipMoney/models/ZipCustomerTokenInWalletModel');
var ZipModel = require('~/cartridge/scripts/zipMoney/models/ZipModel');

/**
 * This function handles the requirement to save a Zip token in order and customer's wallet.
 *
 * If tokenization is required, an API call to "Create Token" Zip functionality is executed.
 * It will return a new token value which is going to be saved in the Order, as an attribute.
 * Additionally, if the customer has checked they want a token saved when checking out,
 * the created token is going to be saved to customer's wallet as well.
 *
 * @param {dw.order.Order} order
 * @param {string} checkoutId
 */
function saveToken (order, checkoutId) {
    var firstPaymentInstrument = order.getPaymentInstruments()[0];
    var paymentMethod = PaymentMgr.getPaymentMethod(firstPaymentInstrument.paymentMethod);

    if (!ZipModel.isTokenizationRequired(paymentMethod)) {
        return;
    }

    var token = null;
    var customerProfile = order.getCustomer().getProfile();

    if (customerProfile) {
        var hasToSaveZipToken = (!empty(customerProfile.custom.ZipSaveToken) && customerProfile.custom.ZipSaveToken);
        var customerTokenInWalletModel = new CustomerTokenInWalletModel(customerProfile.getWallet());

        if (hasToSaveZipToken) {
            if (customerTokenInWalletModel.hasToken()) {
                token = customerTokenInWalletModel.findToken();
            } else {
                var createTokenAPIRequest = new CreateTokenZipAPIRequest();
                var createTokenResponse = createTokenAPIRequest.execute(checkoutId);

                token = createTokenResponse.value;
            }

            Transaction.wrap(function () {
                order.custom.ZipToken = token;

                customerTokenInWalletModel.saveToken(token);

                customerProfile.custom.ZipSaveToken = null;
            });
        }
    }
}

module.exports = saveToken;