/* globals session */
'use strict';

var Loader = require('~/cartridge/scripts/zip/api/loader');

/**
 * Retrieve Checkout Request
 */
var RetrieveCheckout = function () {
    Loader.setFallbackToConfig(true);
    this.apiClient = Loader.loadAPIClient();
};

RetrieveCheckout.prototype.execute = function (checkoutId) {
    var response = this.apiClient.call('checkouts/' + checkoutId, 'GET');

    return response;
};

module.exports = RetrieveCheckout;
