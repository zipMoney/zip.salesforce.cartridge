'use strict';

var config = require('~/cartridge/scripts/zipMoney/config/config');

var ZipHelpers = {
    /**
     * Check if payment method is Zip.
     *
     * @param {string} paymentMethodId payment method id.
     * @returns {bool} true, if payment method is Zip.
     */
    isPaymentMethodZip: function (paymentMethodId) {
        return (paymentMethodId === config.ZIP_PAYMENT_METHODS.zip);
    },
    getFirstZipPaymentInstrument: function (order) {
        var zipPaymentInstrument = null;
        var paymentInstruments = order.getPaymentInstruments();
        var iterator = paymentInstruments.iterator();

        while (iterator.hasNext()) {
            var paymentInstrument = iterator.next();

            if (this.isPaymentMethodZip(paymentInstrument.getPaymentMethod())) {
                zipPaymentInstrument = paymentInstrument;
            }
        }

        return zipPaymentInstrument;
    }
};

module.exports = ZipHelpers;