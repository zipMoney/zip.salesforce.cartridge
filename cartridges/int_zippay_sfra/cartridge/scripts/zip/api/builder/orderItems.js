/* globals empty */

'use strict';

var isTaxationPolicyNet = require('~/cartridge/scripts/util/isTaxationPolicyNet');
var Loader = require('~/cartridge/scripts/zip/api/loader');

/**
 * Initialize order items builder.
 *
 * This builder builds an array of order items.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr order/basket.
 */
function OrderItems(lineItemCtnr) {
    this.lineItemCtnr = lineItemCtnr;
    this.items = [];
}

OrderItems.prototype.addOrderLevelPriceAdjustments = function () {
    this.addPriceAdjustments(this.lineItemCtnr.priceAdjustments.toArray());
};

OrderItems.prototype.addProductLineItems = function () {
    var orderItemBuilder = null;
    var lineItems = this.lineItemCtnr.getAllProductLineItems();

    for (var i = 0; i < lineItems.length; i++) {
        var orderItem = null;
        var lineItem = lineItems[i];

        orderItemBuilder = Loader.loadSkuOrderItemBuilder(lineItem);
        orderItem = orderItemBuilder.build();

        this.items.push(orderItem);

        // Add product-specific shipping line adjustments
        if (!empty(lineItem.shippingLineItem)) {
            this.addPriceAdjustments(lineItem.shippingLineItem.priceAdjustments.toArray());
        }

        if (!empty(lineItem.priceAdjustments) && lineItem.priceAdjustments.length > 0) {
            this.addPriceAdjustments(lineItem.priceAdjustments.toArray());
        }
    }
};

OrderItems.prototype.addTaxItems = function () {
    var tax = this.lineItemCtnr.totalTax;

    if (isTaxationPolicyNet()) {
        var orderItemBuilder = Loader.loadTaxOrderItemBuilder(tax);

        this.items.push(orderItemBuilder.build());
    }
};

OrderItems.prototype.addShippingItems = function () {
    var orderItemBuilder = null;
    var shipments = this.lineItemCtnr.getShipments();

    for (var i = 0; i < shipments.length; i++) {
        var shipment = shipments[i];
        orderItemBuilder = Loader.loadShippingOrderItemBuilder(shipment);

        this.items.push(orderItemBuilder.build());

        this.addPriceAdjustments(shipment.shippingPriceAdjustments.toArray());
    }
};

OrderItems.prototype.addPriceAdjustments = function (adjusments) {
    var orderItemBuilder = null;

    for (var i = 0; i < adjusments.length; i++) {
        var adj = adjusments[i];
        orderItemBuilder = Loader.loadAdjustmentOrderItemBuilder(adj);

        this.items.push(orderItemBuilder.build());
    }
};

OrderItems.prototype.build = function () {
    this.items = [];

    this.addOrderLevelPriceAdjustments();

    // price adjustments (discounts) are also added
    this.addProductLineItems();
    this.addShippingItems();
    this.addTaxItems();

    return this.items;
};

module.exports = OrderItems;
