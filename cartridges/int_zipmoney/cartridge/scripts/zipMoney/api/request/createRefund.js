'use strict';

var Loader = require('~/cartridge/scripts/zipMoney/api/loader');

/**
 * Create Refund
 */
var CreateRefund = function () {
    Loader.setFallbackToConfig(true);
    this.apiClient = Loader.loadAPIClient();
    this.requestBuilder = Loader.loadCreateRefundRequestBuilder();
};

CreateRefund.prototype.execute = function (chargeId, reason, amount) {
    var requestBody = this.requestBuilder.build(chargeId, reason, amount);
    var response = this.executeCall(requestBody);

    return response;
};

CreateRefund.prototype.executeCall = function (requestBody) {
    var uri = 'refunds';

    var response = this.apiClient.call(uri, 'POST', requestBody);

    return response;
};

module.exports = CreateRefund;
