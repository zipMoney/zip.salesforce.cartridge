'use strict';

function Money(value) {
    this.value = value;
}

Money.prototype.getDecimalValue = function () {
    return this.value;
};

Money.prototype.getCurrencyCode = function () {
    return 'AUD';
};

Money.prototype.subtract = function () {
    return new Money(this.value);
};

Money.prototype.getValue = function () {
    return this.value;
};

module.exports = Money;
