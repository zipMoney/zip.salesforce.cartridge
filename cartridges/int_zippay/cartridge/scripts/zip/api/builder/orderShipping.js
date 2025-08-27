/* globals empty */

'use strict';

/**
 * Order Shipping Builder.
 * @param {dw.order.LineItemCtnr} lineItemCtnr order/basket
 * @param {zip.api.builder.shippingAddress} shippingAddressBuilder Shipping Address Builder
 */
function OrderShipping(lineItemCtnr, shippingAddressBuilder) {
    this.lineItemCtnr = lineItemCtnr;
    this.shippingAddressBuilder = shippingAddressBuilder;
}

OrderShipping.prototype.buildTracking = function () {
    return {};
};

OrderShipping.prototype.build = function () {
    // get default shipment shipping address
    var shipment = this.lineItemCtnr.getShipments().iterator().next();

    var pickup = (!empty(shipment.custom.fromStoreId));

    return {
        pickup: pickup,
        tracking: this.buildTracking(),
        address: this.shippingAddressBuilder.build()
    };
};

module.exports = OrderShipping;
