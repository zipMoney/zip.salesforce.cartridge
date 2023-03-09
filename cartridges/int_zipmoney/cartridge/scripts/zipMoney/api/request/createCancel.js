'use strict';

var Loader = require('~/cartridge/scripts/zipMoney/api/loader');

/**
 * Cancel Charge Request
 *
 */
var CancelCharge = function () {
    Loader.setFallbackToConfig(true);
    this.apiClient = Loader.loadAPIClient();
    this.requestBuilder = Loader.loadCreateCancelRequestBuilder();
};

CancelCharge.prototype.execute = function (chargeId) {
    var requestBody = this.requestBuilder.build(chargeId);
    var response = this.executeCall(requestBody);

    return response;
};

CancelCharge.prototype.executeCall = function (requestBody) {
    var uri = 'charges/' + requestBody.chargeId + '/cancel';

    var response = this.apiClient.call(uri, 'POST', requestBody);

    return response;
};

module.exports = CancelCharge;
