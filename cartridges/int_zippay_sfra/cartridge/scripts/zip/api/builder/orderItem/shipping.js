'use strict';

var isTaxationPolicyNet = require('~/cartridge/scripts/util/isTaxationPolicyNet');
var OrderItemBuilder = require('~/cartridge/scripts/zip/api/builder/orderItem');

/**
 * Initialize shipping order item type builder.
 * @param {dw.order.Shipment} shipment - shipment.
 */
function Shipping(shipment) {
    this.setShipment(shipment);
}

Shipping.prototype = Object.create(OrderItemBuilder.prototype);
Shipping.prototype.constructor = Shipping;

Shipping.prototype.setShipment = function (shipment) {
    this.shipment = shipment;
};

Shipping.prototype.getQuantifier = function () {
    return 1;
};

Shipping.prototype.getName = function () {
    return this.shipment.shippingMethod.displayName;
};

Shipping.prototype.getAmount = function () {
    var shipmentUnitPrice = (this.shipment.shippingTotalGrossPrice.available && !isTaxationPolicyNet() ? this.shipment.shippingTotalGrossPrice.value : this.shipment.shippingTotalNetPrice.value) * this.getQuantifier();

    return shipmentUnitPrice;
};

Shipping.prototype.getQuantity = function () {
    return 1;
};

Shipping.prototype.getType = function () {
    return 'shipping';
};

Shipping.prototype.getReference = function () {
    return this.shipment.shippingMethod.ID;
};

module.exports = Shipping;
