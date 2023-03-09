'use strict';

function proxyModel() {
    return {
        getPaymentTransactionByOrder: function (order) {
            return order.getPaymentTransaction();
        },
        getZipPaymentInstrument: function (order) {
            return order.getPaymentInstruments()[0];
        }
    };
}

module.exports = proxyModel();
