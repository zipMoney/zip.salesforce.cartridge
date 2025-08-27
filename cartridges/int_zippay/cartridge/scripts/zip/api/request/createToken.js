'use strict';

var Loader = require('~/cartridge/scripts/zip/api/loader');
var Authority = require('~/cartridge/scripts/zip/api/model/authority');

/**
 * Create Charge Request
 */
var CreateToken = function () {
    this.apiClient = Loader.loadAPIClient();
    this.requestBuilder = Loader.loadCreateTokenRequestBuilder();
};

CreateToken.prototype.execute = function (zipCheckoutId) {
    var authority = new Authority('checkout_id', zipCheckoutId);

    this.requestBuilder.setAuthority(authority);

    var requestBody = this.requestBuilder.build();
    var response = this.executeCall(requestBody);

    return response;
};

CreateToken.prototype.executeCall = function (requestBody) {
    var response = this.apiClient.call('tokens', 'POST', requestBody);

    return response;
};

module.exports = CreateToken;
