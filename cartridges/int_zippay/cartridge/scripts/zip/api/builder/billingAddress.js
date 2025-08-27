'use strict';


/**
 * Billing Address Builder.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr order/basket.
 */
function BillingAddress(lineItemCtnr) {
    this.lineItemCtnr = lineItemCtnr;
}

BillingAddress.prototype.build = function () {
    var item = {};
    var address = this.lineItemCtnr.getBillingAddress();

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

module.exports = BillingAddress;
