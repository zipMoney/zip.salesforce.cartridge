/* globals empty */
'use strict';

var Transaction = require('dw/system/Transaction');
var config = require('~/cartridge/config/config');

/**
 * Customer Token In Wallet Model.
 *
 * @param {dw.customer.Wallet} wallet Wallet
 */
function CustomerTokenInWallet(wallet) {
    this.wallet = wallet;
}

/**
 * Find Zip payment instrument in wallet.
 *
 * @returns {dw.order.CustomerPaymentInstrument} Zip payment instrument, or null if not found.
 */
CustomerTokenInWallet.prototype.findZipPaymentInstrument = function () {
    var index = -1;
    var paymentInstruments = this.wallet.getPaymentInstruments();

    for (var c = 0; c < paymentInstruments.length; c++) {
        var paymentInstrument = paymentInstruments[c];

        if (paymentInstrument.paymentMethod === config.ZIP_PROCESSOR) {
            index = c;
            break;
        }
    }

    if (index === -1) {
        return null;
    }

    return paymentInstruments[index];
};

/**
 * Check if a token has been saved for a specific Zip payment method.
 * @returns {boolean} true, if wallet has zip token.
 */
CustomerTokenInWallet.prototype.hasToken = function () {
    var token = this.findToken();
    return (token !== '');
};

/**
 * Find Zip token.
 *
 * The method searches payment instruments for Zip and retrieves the token
 * associated to it.
 *
 * @returns {string} token or empty string, if not found.
 */
CustomerTokenInWallet.prototype.findToken = function () {
    var token = '';
    var paymentInstruments = this.wallet.getPaymentInstruments();

    for (var c = 0; c < paymentInstruments.length; c++) {
        var paymentInstrument = paymentInstruments[c];

        if (paymentInstrument.paymentMethod === config.ZIP_PROCESSOR) {
            token = paymentInstrument.custom.ZipToken;
            break;
        }
    }

    return token;
};

/**
 * Save token in customer's wallet.
 *
 * Create or Update Zip payment instrument and save the token's value
 * into it.
 *
 * @param {string} zipToken Zip token value.
 */
CustomerTokenInWallet.prototype.saveToken = function (zipToken) {
    Transaction.wrap(function () {
        var paymentInstrument = this.findZipPaymentInstrument();

        if (!paymentInstrument) {
            paymentInstrument = this.wallet.createPaymentInstrument(config.ZIP_PROCESSOR);
        }

        paymentInstrument.custom.ZipToken = zipToken;
    }.bind(this));
};

/**
 * Remove token from customer's wallet.
 *
 * Remove Zip payment instrument holding token's value.
 */
CustomerTokenInWallet.prototype.removeToken = function () {
    Transaction.wrap(function () {
        var paymentInstruments = this.wallet.getPaymentInstruments();

        for (var c = 0; c < paymentInstruments.length; c++) {
            var paymentInstrument = paymentInstruments[c];

            if (paymentInstrument.paymentMethod === config.ZIP_PROCESSOR) {
                this.wallet.removePaymentInstrument(config.ZIP_PROCESSOR);
            }
        }
    }.bind(this));
};

module.exports = CustomerTokenInWallet;
