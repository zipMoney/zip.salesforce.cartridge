/* global empty */

'use strict';

var Transaction = require('dw/system/Transaction');
var config = require("~/cartridge/scripts/zipMoney/config/config");

function ZipCustomerTokenInWalletModel(wallet) {
    this.wallet = wallet;
}

ZipCustomerTokenInWalletModel.prototype.findZipPaymentInstrument = function () {
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
    } else {
        return paymentInstruments[index];
    }
};

/**
 * Check if a token has been saved for a specific Zip payment method.
 *
 */
ZipCustomerTokenInWalletModel.prototype.hasToken = function () {
    var token = this.findToken();
    return (!empty(token));
};

ZipCustomerTokenInWalletModel.prototype.findToken = function () {
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

ZipCustomerTokenInWalletModel.prototype.saveToken = function (zipToken) {
    Transaction.wrap(function () {
        var paymentInstrument = this.findZipPaymentInstrument();

        if (!paymentInstrument) {
            paymentInstrument = this.wallet.createPaymentInstrument(config.ZIP_PROCESSOR);
        }

        paymentInstrument.custom.ZipToken = zipToken;
    }.bind(this));
};

ZipCustomerTokenInWalletModel.prototype.removeToken = function () {
    Transaction.wrap(function () {
        var paymentInstruments = this.wallet.getPaymentInstruments();

        for (var c = 0; c < paymentInstruments.length; c++) {
            var paymentInstrument = paymentInstruments[c];

            if (paymentInstrument.paymentMethod === config.ZIP_PROCESSOR) {
                this.wallet.removePaymentInstrument(paymentInstrument);
            }
        }
    }.bind(this));
};

module.exports = ZipCustomerTokenInWalletModel;