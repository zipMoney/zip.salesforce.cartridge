var MockedPaymentTransaction = function () {
    this.custom = {};
    this.type = '';
    this.amount = null;
};

MockedPaymentTransaction.prototype.setAmount = function (amount) {
    this.amount = amount;
};

MockedPaymentTransaction.prototype.getAmount = function () {
    return this.amount;
};

MockedPaymentTransaction.prototype.setType = function (type) {
    this.type = type;
};

module.exports = MockedPaymentTransaction;
