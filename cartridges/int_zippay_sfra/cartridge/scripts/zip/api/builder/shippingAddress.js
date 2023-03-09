'use strict';

/**
 * Shipping Address Builder.
 * @param {dw.order.LineItemCtnr} lineItemCtnr order/basket
 */
function ShippingAddress(lineItemCtnr) {
    this.lineItemCtnr = lineItemCtnr;
}

ShippingAddress.prototype.getShippingAddress = function () {
    // get default shipment shipping address
    var shippingAddress = this.lineItemCtnr.getShipments().iterator().next().getShippingAddress();

    return shippingAddress;
};

ShippingAddress.prototype.build = function () {
    var item = {};
    var address = this.getShippingAddress();

    item.line1 = address.getAddress1();
    item.line2 = address.getAddress2();
    item.city = address.getCity();
    item.state = address.getStateCode();
    item.postal_code = address.getPostalCode();
    item.country = address.getCountryCode().getValue();
    item.first_name = address.getFirstName();
    item.last_name = address.getLastName();

    return item;
};

module.exports = ShippingAddress;
