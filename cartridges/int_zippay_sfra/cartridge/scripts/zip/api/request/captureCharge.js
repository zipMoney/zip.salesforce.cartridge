'use strict';

var Loader = require('~/cartridge/scripts/zip/api/loader');

/**
 * Capture Charge Request
 *
 */
var CaptureCharge = function () {
    Loader.setFallbackToConfig(true);
    this.apiClient = Loader.loadAPIClient();
    this.requestBuilder = Loader.loadCaptureChargeRequestBuilder();
};

CaptureCharge.prototype.execute = function (chargeId, amount, isPartialCapture) {
    var requestBody = this.requestBuilder.setIsPartialCapture(isPartialCapture).setChargeId(chargeId).build(amount);
    var response = this.executeCall(requestBody);

    return response;
};

CaptureCharge.prototype.executeCall = function (requestBody) {
    var uri = 'charges/' + this.requestBuilder.getChargeId() + '/capture';

    var response = this.apiClient.call(uri, 'POST', requestBody);

    return response;
};

module.exports = CaptureCharge;
