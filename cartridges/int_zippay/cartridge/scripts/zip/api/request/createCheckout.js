'use strict';

var Loader = require('~/cartridge/scripts/zip/api/loader');

/**
 * Create Checkout Request
 * @param {dw.order.LineItemCtnr} lineItemCtnr order/basket
 * @param {boolean} customerTokenizationRequired true, if customer tokenization is required.
 */
var CreateCheckout = function (lineItemCtnr, customerTokenizationRequired) {
    this.apiClient = Loader.loadAPIClient();
    this.requestBuilder = Loader.loadCreateCheckoutRequestBuilder(lineItemCtnr, customerTokenizationRequired);
};

CreateCheckout.prototype.execute = function () {
    var requestBody = this.requestBuilder.build();
    var response = this.executeCall(requestBody);

    return response;
};

CreateCheckout.prototype.executeCall = function (requestBody) {
    var response = this.apiClient.call('checkouts', 'POST', requestBody);

    return response;
};

module.exports = CreateCheckout;
