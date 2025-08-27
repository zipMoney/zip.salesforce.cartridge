'use strict';

/**
 * Create Charge Request Builder.
 * @param {zip.api.builder.order} orderBuilder order builder.
 */
function CreateCharge(orderBuilder) {
    this.orderBuilder = orderBuilder;
    this.paymentTransaction = null;
    this.authority = null;
    this.autoCapture = true;
    this.orderNumber = null;
}

/**
 * @param {zip.model.Authority} authority Authority
 */
CreateCharge.prototype.setAuthority = function (authority) {
    this.authority = authority;
};

CreateCharge.prototype.getAuthority = function () {
    return this.authority;
};

CreateCharge.prototype.setPaymentTransaction = function (paymentTransaction) {
    this.paymentTransaction = paymentTransaction;
};

CreateCharge.prototype.getPaymentTransaction = function () {
    return this.paymentTransaction;
};

CreateCharge.prototype.enableAutoCapture = function () {
    this.autoCapture = true;
};

CreateCharge.prototype.disableAutoCapture = function () {
    this.autoCapture = false;
};

CreateCharge.prototype.setAutoCapture = function (autoCapture) {
    this.autoCapture = autoCapture;
};

CreateCharge.prototype.setOrderNumber = function (orderNumber) {
    this.orderNumber = orderNumber;
};

CreateCharge.prototype.getAutoCapture = function () {
    return this.autoCapture;
};

CreateCharge.prototype.build = function () {
    var transaction = this.getPaymentTransaction();
    var transactionAmount = transaction.getAmount();

    return {
        authority: this.getAuthority().toArray(),
        reference: this.orderNumber,
        amount: transactionAmount.getValue(),
        currency: transactionAmount.getCurrencyCode(),
        capture: this.getAutoCapture()
    };
};

module.exports = CreateCharge;
