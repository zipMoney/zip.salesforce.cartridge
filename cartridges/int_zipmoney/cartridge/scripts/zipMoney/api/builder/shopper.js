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

    if (!empty(profile.getGender())) {
        this.item.gender = profile.getGender().getValue();
    }

    if (!empty(profile.getBirthday())) {
        this.item.birth_date = profile.getBirthday().toDateString();
    }
};

Shopper.prototype.addStatisticsFromCustomer = function (customer) {
    var statistics = {};

    var activeData = customer.getActiveData();

    statistics.sales_total_count = null;
    statistics.sales_total_amount = activeData.getOrders();
    statistics.sales_avg_amount = activeData.getAvgOrderValue();
    statistics.sales_max_amount = activeData.getOrderValue();
    statistics.refunds_total_amount = activeData.getReturns();
    statistics.currency = this.lineItemCtnr.getCurrencyCode();
    statistics.last_login = customer.getProfile().getLastLoginTime();

    return statistics;
};

Shopper.prototype.addShopperDataFromBillingAddress = function (billingAddress) {
    this.item.title = billingAddress.getTitle();
    this.item.first_name = billingAddress.getFirstName();
    this.item.last_name = billingAddress.getLastName();
    this.item.middle_name = billingAddress.getSecondName();
    this.item.phone = billingAddress.getPhone();
};

Shopper.prototype.build = function () {
    this.item = {};

    var customer = this.lineItemCtnr.getCustomer();

    var billingAddress = this.lineItemCtnr.getBillingAddress();
    this.addShopperDataFromBillingAddress(billingAddress);
    this.item.email = this.lineItemCtnr.getCustomerEmail();

    if (customer && customer.getProfile()) {
        this.addShopperDataFromCustomerProfile(customer.getProfile());

        this.item.statistics = this.addStatisticsFromCustomer(customer);
    }

    this.item.billing_address = this.billingAddressBuilder.build();

    return this.item;
};

module.exports = Shopper;
