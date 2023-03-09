/* globals empty */

'use strict';

/**
 * Shopper Builder.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr order/basket
 * @param {zip.api.builder.billingAddress} billingAddressBuilder Billing Address Builder
 */
function Shopper(lineItemCtnr, billingAddressBuilder) {
    this.lineItemCtnr = lineItemCtnr;
    this.billingAddressBuilder = billingAddressBuilder;
    this.item = {};
}

Shopper.prototype.buildStatistics = function () {
    return {};
};

Shopper.prototype.addShopperDataFromCustomerProfile = function (profile) {
    this.item.title = profile.getTitle();
    this.item.first_name = profile.getFirstName();
    this.item.last_name = profile.getLastName();
    this.item.middle_name = profile.getSecondName();
    this.item.phone = profile.getPhoneMobile();
    this.item.email = profile.getEmail();
    if (!empty(profile.getGender())) {
        this.item.gender = profile.getGender().getValue();
    }

    if (!empty(profile.getBirthday())) {
        this.item.birth_date = profile.getBirthday().toDateString();
    }
};

Shopper.prototype.addShopperDataFromBillingAddress = function (billingAddress) {
    this.item.title = billingAddress.getTitle();
    this.item.first_name = billingAddress.getFirstName();
    this.item.last_name = billingAddress.getLastName();
    this.item.middle_name = billingAddress.getSecondName();
};

Shopper.prototype.addShopperDataFromZipPaymentInstrument = function () {
    var paymentInstrumentsCollection = this.lineItemCtnr.getPaymentInstruments();
    var firstPaymentInstrument = paymentInstrumentsCollection.toArray()[0];

    this.item.email = firstPaymentInstrument.custom.zipEmail;
    this.item.phone = firstPaymentInstrument.custom.zipPhone;
};

Shopper.prototype.build = function () {
    this.item = {};

    var customer = this.lineItemCtnr.getCustomer();

    if (customer && customer.getProfile()) {
        this.addShopperDataFromCustomerProfile(customer.getProfile());
    } else {
        var billingAddress = this.lineItemCtnr.getBillingAddress();
        this.addShopperDataFromBillingAddress(billingAddress);
    }

    this.addShopperDataFromZipPaymentInstrument();

    this.item.statistics = this.buildStatistics();
    this.item.billing_address = this.billingAddressBuilder.build();

    return this.item;
};

module.exports = Shopper;
