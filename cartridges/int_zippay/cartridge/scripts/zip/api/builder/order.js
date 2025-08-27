'use strict';

/**
 * Order builder.
 *
 * @param {*} lineItemCtnr order/basket
 * @param {*} orderShippingBuilder Order Shipping Builder
 * @param {*} orderItemsBuilder Order Items Builder
 */
function Order(lineItemCtnr, orderShippingBuilder, orderItemsBuilder) {
    this.lineItemCtnr = lineItemCtnr;
    this.orderShippingBuilder = orderShippingBuilder;
    this.orderItemsBuilder = orderItemsBuilder;
}

Order.prototype.setLineItemCtnr = function (lineItemCtnr) {
    this.lineItemCtnr = lineItemCtnr;
};

Order.prototype.getQuantifier = function () {
    return 1;
};

Order.prototype.getOrderReference = function () {
    return this.lineItemCtnr.orderNo;
};

Order.prototype.getOrderAmount = function () {
    var orderAmount = 0;

    if (this.lineItemCtnr.totalGrossPrice.available) {
        orderAmount = this.lineItemCtnr.totalGrossPrice.value * this.getQuantifier();
    } else {
        orderAmount = this.lineItemCtnr.totalNetPrice.value * this.getQuantifier();
    }

    return orderAmount;
};

Order.prototype.build = function () {
    return {
        reference: this.getOrderReference(),
        amount: this.getOrderAmount(),
        currency: this.lineItemCtnr.getCurrencyCode(),
        shipping: this.orderShippingBuilder.build(),
        items: this.orderItemsBuilder.build()
    };
};

module.exports = Order;
