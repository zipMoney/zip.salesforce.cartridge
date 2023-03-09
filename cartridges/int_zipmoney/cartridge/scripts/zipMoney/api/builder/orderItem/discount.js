/* globals empty */

'use strict';

var isTaxationPolicyNet = require('~/cartridge/scripts/zipMoney/util/isTaxationPolicyNet');

var OrderItemBuilder = require('~/cartridge/scripts/zipMoney/api/builder/orderItem');

/**
 * Discount order item type.
 * @param {dw.order.PriceAdjustment} adjustment price adjustment
 */
function Discount(adjustment) {
    this.setAdjustment(adjustment);
}

Discount.prototype = Object.create(OrderItemBuilder.prototype);
Discount.prototype.constructor = Discount;

Discount.prototype.getQuantifier = function () {
    return 1;
};

Discount.prototype.setAdjustment = function (adjustment) {
    this.adj = adjustment;
};

Discount.prototype.getName = function () {
    var promoName = (!empty(this.adj.promotion) && !empty(this.adj.promotion.name)) ? this.adj.promotion.name : 'Discount';

    return promoName;
};

Discount.prototype.getAmount = function () {
    return (this.adj.grossPrice.available && !isTaxationPolicyNet() ? this.adj.grossPrice.value : this.adj.netPrice.value) * this.getQuantifier();
};

Discount.prototype.getQuantity = function () {
    return 1;
};

Discount.prototype.getType = function () {
    return 'discount';
};

/**
 * @returns {string} promotion id.
 */
Discount.prototype.getReference = function () {
    var promoId = this.adj.promotionID;

    return promoId;
};

module.exports = Discount;
