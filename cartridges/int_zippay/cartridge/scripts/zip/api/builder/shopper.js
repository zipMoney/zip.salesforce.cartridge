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

    if (empty(this.item.phone)) {
        this.item.phone = profile.getPhoneMobile();
    }

    if (empty(this.item.email)) {
        this.item.email = profile.getEmail();
    }

    if (!empty(profile.getGender()) && profile.getGender().getValue() !== 0) {
        this.item.gender = profile.getGender().getDisplayValue();
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
    this.item.phone = billingAddress.getPhone();
};

Shopper.prototype.addShopperDataFromZipPaymentInstrument = function () {
    var paymentInstrumentsCollection = this.lineItemCtnr.getPaymentInstruments();
    var firstPaymentInstrument = paymentInstrumentsCollection.toArray()[0];

    if (firstPaymentInstrument.custom) {
        if (firstPaymentInstrument.custom.zipEmail) {
            this.item.email = firstPaymentInstrument.custom.zipEmail;
        }
        if (firstPaymentInstrument.custom.zipPhone) {
            this.item.phone = firstPaymentInstrument.custom.zipPhone;
        }
    }
};

Shopper.prototype.build = function () {
    this.item = {};

    var customer = this.lineItemCtnr.getCustomer();

    if (customer && customer.getProfile()) {
        this.addShopperDataFromCustomerProfile(customer.getProfile());
    } else {
        var billingAddress = this.lineItemCtnr.getBillingAddress();
        this.addShopperDataFromBillingAddress(billingAddress);
        this.item.email = this.lineItemCtnr.getCustomerEmail();
    }

    this.addShopperDataFromZipPaymentInstrument();

    this.item.statistics = this.buildStatistics();
    this.item.billing_address = this.billingAddressBuilder.build();

    return this.item;
};

module.exports = Shopper;
