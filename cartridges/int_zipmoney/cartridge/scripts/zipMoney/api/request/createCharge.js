'use strict';

var Loader = require('~/cartridge/scripts/zipMoney/api/loader');

/**
 * Create Charge Request
 */
var CreateCharge = function () {
    Loader.setFallbackToConfig(true);

    this.apiClient = Loader.loadAPIClient();
    this.requestBuilder = Loader.loadCreateChargeRequestBuilder();
};

CreateCharge.prototype.execute = function (authority, paymentInstrument, orderNumber, isAutoCaptureEnabled) {
    this.requestBuilder.setAuthority(authority);
    this.requestBuilder.setPaymentTransaction(paymentInstrument.getPaymentTransaction());

    this.requestBuilder.setAutoCapture(isAutoCaptureEnabled);
    this.requestBuilder.setOrderNumber(orderNumber);

    var requestBody = this.requestBuilder.build();
    var response = this.executeCall(requestBody);

    return response;
};

CreateCharge.prototype.executeCall = function (requestBody) {
    var response = this.apiClient.call('charges', 'POST', requestBody);

    return response;
};

CreateCharge.prototype.getRequestBuilder = function () {
    return this.requestBuilder;
};

module.exports = CreateCharge;
