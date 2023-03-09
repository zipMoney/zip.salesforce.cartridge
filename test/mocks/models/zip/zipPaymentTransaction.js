var MockedPaymentTransaction = {
    amount: {
        value: 0
    },
    type: '',
    custom: {},
    setAmount: function (amount) {
        this.amount = amount;
    },
    setType: function (type) {
        this.type = type;
    },
    reflectChargeAuthorized: function () {
        return;
    }
};

module.exports = MockedPaymentTransaction;
