/* globals dw, request, session, empty */

'use strict';

var config = require('~/cartridge/scripts/zipMoney/config/config');

var ZipHelpers = require('~/cartridge/scripts/zipMoney/helpers/zip');

var PaymentMgr = require('dw/order/PaymentMgr');
var Site = require('dw/system/Site');
var Locale = require('dw/util/Locale');

/**
 * Object to represent ZIP payment method.
 */
var ZipModel = {
    /**
     * Get payment method name by payment ID (utility function)
     *
     * @param {string} paymentMethodId payment method id.
     * @returns {string} name of payment method.
     */
    getPaymentMethodName: function (paymentMethodId) {
        var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);
        return paymentMethod.getName();
    },
    /**
     * Retrieves Api key according to payment processor Id.
     *
     * @returns {string} api key.
     */
    getApiKey: function () {
        var preferenceName = 'zipApiKey';

        var sitePrefs = Site.getCurrent().getPreferences();
        var preferenceValue = sitePrefs.getCustom()[preferenceName];

        return preferenceValue;
    },
    isApiProductionMode: function (paymentProcessorId) {
        var prefix = paymentProcessorId.charAt(0).toLowerCase() + paymentProcessorId.slice(1);

        var preferenceName = prefix + 'ApiMode';

        var isProductionMode = Site.getCurrent().getCustomPreferenceValue(preferenceName);

        return isProductionMode;
    },
    getMarketingKey: function () {
        var marketingKey = Site.getCurrent().getCustomPreferenceValue('zipMarketingKey');

        return marketingKey;
    },
    getMarketingEnvironment: function () {
        var marketingEnvironment = Site.getCurrent().getCustomPreferenceValue('zipMarketingEnvironment');
        return marketingEnvironment.value;
    },
    getFooterLinkText: function () {
        var ContentMgr = require('dw/content/ContentMgr');
        var content = ContentMgr.getContent('zip-footer-link-text');
        if (!empty(content)) {
            return content.name;
        } else {
            return "";
        }
    },
    getPreference: function (paymentProcessorId, preferenceName) {
        var fullPreferenceName = "zip" + preferenceName;

        var sitePrefs = Site.getCurrent().getPreferences();
        var customPreferences = sitePrefs.getCustom();

        if (empty(customPreferences[fullPreferenceName])) {
            throw new Error('Unknown preference or preference value not set.' + fullPreferenceName);
        }

        return customPreferences[fullPreferenceName];
    },
    /**
     * Return value of lightbox preference.
     *
     * The lightbox preference allows a merchant to enable/disable
     * lightbox checkout experience.
     *
     * @returns {string} value of lightbox preference
     */
    isLightbox: function () {
        var sitePrefs = Site.getCurrent().getPreferences();
        var mySitePrefValue = sitePrefs.getCustom().zipLightbox;

        return mySitePrefValue;
    },
    getActiveZipPaymentMethodsCount: function () {
        var activePaymentMethods = PaymentMgr.getActivePaymentMethods();

        var activeZipPaymentMethods = [];

        for (var c = 0; c < activePaymentMethods.length; c++) {
            var activePaymentMethod = activePaymentMethods[c];

            if (ZipHelpers.isPaymentMethodZip(activePaymentMethod.ID)) {
                activeZipPaymentMethods.push(activePaymentMethod);
            }
        }

        return activeZipPaymentMethods.length;
    },
    /**
     * Get applicable payment methods processed by Zip processors for a LineItemCtnr.
     *
     * @param {dw.order.LineItemCtnr} lineItemCtnr order or basket
     * @returns {Array<dw.order.LineItemCtnr>} array of applicable payment methods.
     */
    getApplicableZipPaymentMethods: function (lineItemCtnr) {
        var requestLocale = Locale.getLocale(request.locale);
        var countryCode = requestLocale.country;
        var customer = lineItemCtnr.getCustomer();
        var paymentAmount = lineItemCtnr.totalGrossPrice.value;

        var applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(customer, countryCode, paymentAmount);
        var applicableZipPaymentMethods = [];

        for (var c = 0; c < applicablePaymentMethods.length; c++) {
            var applicablePaymentMethod = applicablePaymentMethods[c];

            if (ZipHelpers.isPaymentMethodZip(applicablePaymentMethod.ID)) {
                applicableZipPaymentMethods.push(applicablePaymentMethod);
            }
        }

        return applicableZipPaymentMethods;
    },
    /**
     * Returns ID of the first (primary) payment processor available to process an order.
     *
     * @param {dw.order.LineItemCtnr} lineItemCtnr order or basket
     * @returns {string} payment processor Id.
     */
    getPaymentProcessor: function (lineItemCtnr) {
        var applicableZipPaymentMethods = this.getApplicableZipPaymentMethods(lineItemCtnr);

        if (!applicableZipPaymentMethods) {
            throw new Error('There are no applicable Zip payment methods.');
        }

        return applicableZipPaymentMethods[0].getPaymentProcessor().getID();
    },
    isCanSelectedPaymentMethod: function () {
        var usedPaymentMethodId = session.privacy.ZipPaymentMethodId;

        if (!usedPaymentMethodId) {
            return false;
        }

        return true;
    },
    getDefaultSelectedPaymentMethod: function () {
        var paymentMethod = PaymentMgr.getPaymentMethod(config.ZIP_DEFAULT_METHOD_ID);

        return paymentMethod;
    },
    getSelectedPaymentMethod: function () {
        var usedPaymentMethodId = session.privacy.ZipPaymentMethodId;

        if (!usedPaymentMethodId) {
            return null;
        }

        var paymentMethod = PaymentMgr.getPaymentMethod(usedPaymentMethodId);
        return paymentMethod;
    },
    isTokenizationRequired: function (zipPaymentMethod) {
        var paymentProcessorId = zipPaymentMethod.getPaymentProcessor().getID();

        var tokenizationRequired = this.getPreference(paymentProcessorId, 'Tokenization');

        return tokenizationRequired;
    },
    isAutoCaptureEnabled: function (zipPaymentMethod) {
        var paymentProcessorId = zipPaymentMethod.getPaymentProcessor().getID();

        var autoCaptureEnabled = this.getPreference(paymentProcessorId, 'AutoCapture');

        return autoCaptureEnabled;
    },
    getZipPaymentInstrument: function (lineItemCtnr) {
        var paymentInstruments = lineItemCtnr.getPaymentInstruments();

        var iterator = paymentInstruments.iterator();
        var paymentInstrument = null;
        while (iterator.hasNext()) {
            paymentInstrument = iterator.next();
            var paymentMethod = dw.order.PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
            if (paymentMethod) {
                var paymentProcessorId = paymentMethod.getPaymentProcessor().getID();
                if (ZipHelpers.isPaymentMethodZip(paymentProcessorId)) {
                    return paymentInstrument;
                }
            }
        }
        return null;
    },
    getZipPendingApplicationMessageStyles: function () {
        var zipPendingMessageStyles = Site.getCurrent().getCustomPreferenceValue('zipPendingMessageStyles');

        return zipPendingMessageStyles;
    }
};

module.exports = ZipModel;
