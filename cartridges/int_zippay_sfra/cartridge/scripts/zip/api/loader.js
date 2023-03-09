/* globals session */
'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var APIClient = require('~/cartridge/scripts/zip/api/client');
var Logger = require('dw/system/Logger');
var ZipModel = require('*/cartridge/scripts/zip/helpers/zip');

/**
 * Load Zip API objects and their dependencies.
 */
var Loader = {
    service: null,
    fallbackToConfig: false,
    components: {},
    setFallbackToConfig: function (fallbackToConfig) {
        this.fallbackToConfig = fallbackToConfig;
    },
    getServiceID: function () {
        return 'zip.http.defaultendpoint';
    },
    getServiceCredentials: function (isApiProductionMode) {
        return 'zip.http.credentials.' + ((isApiProductionMode) ? 'production' : 'sandbox');
    },
    loadLogger: function () {
        return Logger.getLogger('ZipPayments', 'zip.apiClient');
    },
    loadService: function (isApiProductionMode) {
        if (!this.service) {
            var serviceID = this.getServiceID();

            var service = LocalServiceRegistry.createService(serviceID, {
                createRequest: function (svc, sRequestBody) {
                    return JSON.stringify(sRequestBody);
                },
                parseResponse: function (svc, client) {
                    return client;
                }
            });

            var serviceCredentials = this.getServiceCredentials(isApiProductionMode);
            service.setCredentialID(serviceCredentials);
            service.setThrowOnError();

            this.service = service;
        }

        return this.service;
    },
    loadAPIClient: function () {
        var key = 'apiClient';

        if (!this.components[key]) {
            var selectedPaymentMethod = ZipModel.getSelectedPaymentMethod();

            if (!selectedPaymentMethod && this.fallbackToConfig) {
                selectedPaymentMethod = ZipModel.getDefaultSelectedPaymentMethod();
            } else if (!selectedPaymentMethod) {
                throw new Error('Could not load API Client. No payment method previously selected');
            }

            var paymentProcessorId = selectedPaymentMethod.getPaymentProcessor().getID();
            var apiKey = ZipModel.getApiKey(paymentProcessorId);
            var isApiProductionMode = ZipModel.isApiProductionMode(paymentProcessorId);

            var service = this.loadService(isApiProductionMode);
            var logger = this.loadLogger();
            var apiClient = new APIClient(service, logger);
            apiClient.setApiKey(apiKey);

            this.components[key] = apiClient;
        }

        return this.components[key];
    },
    loadCreateCheckoutRequestBuilder: function (lineItemCtnr, customerTokenizationRequired) {
        var ShopperBuilder = require('~/cartridge/scripts/zip/api/builder/shopper');
        var OrderBuilder = require('~/cartridge/scripts/zip/api/builder/order');
        var CheckoutRequestBuilder = require('~/cartridge/scripts/zip/api/builder/request/createCheckout');
        var OrderShippingBuilder = require('~/cartridge/scripts/zip/api/builder/orderShipping');
        var OrderItemsBuilder = require('~/cartridge/scripts/zip/api/builder/orderItems');
        var ShippingAddressBuilder = require('~/cartridge/scripts/zip/api/builder/shippingAddress');
        var BillingAddressBuilder = require('~/cartridge/scripts/zip/api/builder/billingAddress');

        var builder = new CheckoutRequestBuilder(lineItemCtnr,
            new ShopperBuilder(lineItemCtnr,
                new BillingAddressBuilder(lineItemCtnr)
            ),
            new OrderBuilder(
                lineItemCtnr,
                new OrderShippingBuilder(
                    lineItemCtnr,
                    new ShippingAddressBuilder(lineItemCtnr)
                ), new OrderItemsBuilder(lineItemCtnr)
            )
        );

        var selectedZipPaymentMethod = ZipModel.getSelectedPaymentMethod();
        builder.setIsTokenizationRequired(customerTokenizationRequired && ZipModel.isTokenizationRequired(selectedZipPaymentMethod));

        return builder;
    },
    loadCreateChargeRequestBuilder: function () {
        var Builder = require('~/cartridge/scripts/zip/api/builder/request/createCharge');

        return new Builder();
    },
    loadCaptureChargeRequestBuilder: function () {
        var Builder = require('~/cartridge/scripts/zip/api/builder/request/captureCharge');

        return new Builder();
    },
    loadCreateTokenRequestBuilder: function () {
        var Builder = require('~/cartridge/scripts/zip/api/builder/request/createToken');

        return new Builder();
    },
    loadCreateRefundRequestBuilder: function () {
        var Builder = require('~/cartridge/scripts/zip/api/builder/request/createRefund');

        return new Builder();
    },
    loadCreateCancelRequestBuilder: function () {
        var Builder = require('~/cartridge/scripts/zip/api/builder/request/createCancel');

        return new Builder();
    },
    loadShippingOrderItemBuilder: function (shipment) {
        var OrderItemBuilder = require('~/cartridge/scripts/zip/api/builder/orderItem/shipping');

        var key = 'shippingOrderItemBuilder';

        if (this.components[key]) {
            this.components[key].setShipment(shipment);
        } else {
            this.components[key] = new OrderItemBuilder(shipment);
        }

        return this.components[key];
    },
    loadAdjustmentOrderItemBuilder: function (adj) {
        var OrderItemBuilder = require('~/cartridge/scripts/zip/api/builder/orderItem/discount');

        var key = 'discountOrderItemBuilder';

        if (this.components[key]) {
            this.components[key].setAdjustment(adj);
        } else {
            this.components[key] = new OrderItemBuilder(adj);
        }

        return this.components[key];
    },
    loadTaxOrderItemBuilder: function (tax) {
        var OrderItemBuilder = require('~/cartridge/scripts/zip/api/builder/orderItem/tax');

        var key = 'taxOrderItemBuilder';

        if (this.components[key]) {
            this.components[key].setTax(tax);
        } else {
            this.components[key] = new OrderItemBuilder(tax);
        }

        return this.components[key];
    },
    loadSkuOrderItemBuilder: function (lineItem) {
        var OrderItemBuilder = require('~/cartridge/scripts/zip/api/builder/orderItem/sku');

        var key = 'skuOrderItemBuilder';

        if (this.components[key]) {
            this.components[key].setLineItem(lineItem);
        } else {
            this.components[key] = new OrderItemBuilder(lineItem);
        }

        return this.components[key];
    }
};

module.exports = Loader;
