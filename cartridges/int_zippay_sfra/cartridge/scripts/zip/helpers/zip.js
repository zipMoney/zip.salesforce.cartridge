/* globals dw, request, session, empty */

'use strict';

var config = require('~/cartridge/config/config');

var PaymentMgr = require('dw/order/PaymentMgr');
var Site = require('dw/system/Site');
var Locale = require('dw/util/Locale');

/**
 * Object to represent ZIP payment method.
 */
var Zip = {
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
        }

        return '';
    },
    getPreference: function (paymentProcessorId, preferenceName) {
        var fullPreferenceName = 'zip' + preferenceName;

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
    /**
     * Get active zip payment methods count.
     *
     * Note: currently, there is only one Zip payment method, so
     * this method is bound to return either 1 or 0.
     *
     * @returns {integer} Zip payment methods count.
     */
    getActiveZipPaymentMethodsCount: function () {
        var activePaymentMethods = PaymentMgr.getActivePaymentMethods();

        var activeZipPaymentMethods = [];

        for (var c = 0; c < activePaymentMethods.length; c++) {
            var activePaymentMethod = activePaymentMethods[c];

            if (this.isPaymentMethodZip(activePaymentMethod.ID)) {
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

            if (this.isPaymentMethodZip(applicablePaymentMethod.ID)) {
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
                if (this.isPaymentMethodZip(paymentProcessorId)) {
                    return paymentInstrument;
                }
            }
        }
        return null;
    },
    /**
     * Get Zip Payment Declined Error Message.
     *
     * The error message appears on payment stage, when customer
     * account has been declined during Zip checkout process.
     *
     * @returns {string} error message text.
     */
    getZipPaymentDeclinedErrorMessage: function () {
        var ContentMgr = dw.content.ContentMgr;

        var zipDeclinedContent = ContentMgr.getContent('zip-declined');

        return zipDeclinedContent.custom.body.source;
    },
    /**
     * Get Zip Pending Application Message Styles.
     *
     * Those CSS styles are applied to the message box appearing
     * to inform the user that their order is pending since the
     * customer account is refered for manual approval.
     *
     * @returns {string} css properties string.
     */
    getZipPendingApplicationMessageStyles: function () {
        var zipPendingMessageStyles = Site.getCurrent().getCustomPreferenceValue('zipPendingMessageStyles');

        return zipPendingMessageStyles;
    },
    /**
     * Check if payment method is Zip.
     *
     * @param {string} paymentMethodId payment method id.
     * @returns {bool} true, if payment method is Zip.
     */
    isPaymentMethodZip: function (paymentMethodId) {
        return (config.ZIP_PAYMENT_METHODS.zip === paymentMethodId);
    },
    isZipOrder: function (lineItemContainer) {
        var isZip = false;
        var paymentInstruments = lineItemContainer.getPaymentInstruments();
        var iterator = paymentInstruments.iterator();

        while (iterator.hasNext()) {
            var paymentInstrument = iterator.next();

            if (this.isPaymentMethodZip(paymentInstrument.getPaymentMethod())) {
                isZip = true;
            }
        }

        return isZip;
    },
    getFirstZipPaymentInstrument: function (order) {
        var zipPaymentInstrument = null;
        var paymentInstruments = order.getPaymentInstruments();
        var iterator = paymentInstruments.iterator();

        while (iterator.hasNext()) {
            var paymentInstrument = iterator.next();

            if (this.isPaymentMethodZip(paymentInstrument.getPaymentMethod())) {
                zipPaymentInstrument = paymentInstrument;
            }
        }

        return zipPaymentInstrument;
    }
};

module.exports = Zip;
