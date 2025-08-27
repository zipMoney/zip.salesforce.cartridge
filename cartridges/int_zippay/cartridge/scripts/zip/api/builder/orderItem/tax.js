'use strict';

var OrderItemBuilder = require('~/cartridge/scripts/zip/api/builder/orderItem');

/**
 * Initialize tax order item type.
 * @param {dw.value.Money} tax tax.
 */
function Tax(tax) {
    this.setTax(tax);
}

Tax.prototype = Object.create(OrderItemBuilder.prototype);
Tax.prototype.constructor = Tax;

Tax.prototype.getQuantifier = function () {
    return 1;
};

Tax.prototype.setTax = function (tax) {
    this.tax = tax;
};

Tax.prototype.getName = function () {
    return 'Sales Tax';
};

Tax.prototype.getAmount = function () {
    var tax = (this.tax.available) ? this.tax.value * this.getQuantifier() : 0;

    return tax;
};

Tax.prototype.getQuantity = function () {
    return 1;
};

Tax.prototype.getType = function () {
    return 'tax';
};

Tax.prototype.getReference = function () {
    var id = 'Sales Tax';

    return id;
};

module.exports = Tax;
