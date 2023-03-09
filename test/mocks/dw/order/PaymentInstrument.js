var MockedPaymentTransaction = require('./PaymentTransaction');

var MockedPaymentInstrument = function () {
    this.paymentTransaction = new MockedPaymentTransaction();
};

MockedPaymentInstrument.prototype.getPaymentTransaction = function () {
    return this.paymentTransaction;
};

module.exports = MockedPaymentInstrument;
