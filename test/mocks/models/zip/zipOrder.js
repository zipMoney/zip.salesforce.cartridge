var MockedOrder = function () {
    this.paymentStatus = '';
    this.status = '';
    this.custom = {
        ZipRefundedAmount: 0.0,
        ZipCapturedAmount: 0.0
    };
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

module.exports = MockedOrder;
