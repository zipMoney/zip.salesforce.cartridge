/* global dw */
'use strict';

var URLUtils = require('dw/web/URLUtils');

/**
 * Create Checkout request builder.
 *
 * @param {dw.order.LineItemCtnr} lineItemCtnr Line Item Ctnr
 * @param {zip.api.builder.shopper} shopperBuilder Shopper Builder
 * @param {zip.api.builder.order} orderBuilder Order Builder
 */
function CreateCheckout(lineItemCtnr, shopperBuilder, orderBuilder) {
    this.lineItemCtnr = lineItemCtnr;
    this.shopperBuilder = shopperBuilder;
    this.orderBuilder = orderBuilder;
    this.isTokenizationRequired = false;
}

CreateCheckout.prototype.setIsTokenizationRequired = function (isTokenizationRequired) {
    this.isTokenizationRequired = isTokenizationRequired;
};

CreateCheckout.prototype.getIsTokenizationRequired = function () {
    return this.isTokenizationRequired;
};

CreateCheckout.prototype.build = function () {
    var redirectUri = URLUtils.https('Zip-Redirect').toString();

    var data = {
        shopper: this.shopperBuilder.build(),
        order: this.orderBuilder.build(),
        config: {
            redirect_uri: redirectUri
        },
        metadata: {
            Platform: "Salesfore Commerce Cloud",
            Version: dw.system.System.compatibilityMode
        }
    };

    if (this.getIsTokenizationRequired()) {
        data.features = {
            tokenisation: {
                required: true
            }
        };
    }

    return data;
};

module.exports = CreateCheckout;
