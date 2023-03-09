var MockedPaymentTransaction = require('../../dw/order/PaymentTransaction');
var MockedMoney = require('../../dw/value/Money');

var MockedOrder = function () {
    this.paymentTransaction = new MockedPaymentTransaction();
    this.paymentStatus = '';
    this.status = '';
    this.custom = {
        ZipRefundedAmount: 0.0,
        ZipCapturedAmount: 0.0,
        ZipReceiptNumber: ''
    };
};

MockedOrder.prototype.getPaymentTransaction = function () {
    return this.paymentTransaction;
};

MockedOrder.prototype.getPaymentStatus = function () {
    return this.paymentStatus;
};

MockedOrder.prototype.setPaymentStatus = function (paymentStatus) {
    this.paymentStatus = paymentStatus;
};

MockedOrder.prototype.getStatus = function () {
    return this.status;
};

MockedOrder.prototype.setStatus = function (status) {
    this.status = status;
};

MockedOrder.prototype.getTotalGrossPrice = function () {
    return new MockedMoney(true, 50.00);
};

module.exports = MockedOrder;
