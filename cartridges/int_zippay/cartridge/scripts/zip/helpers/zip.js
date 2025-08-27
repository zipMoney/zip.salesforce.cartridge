/* globals dw, request, session, empty */

'use strict';

var config = require('~/cartridge/config/config');

var PaymentMgr = require('dw/order/PaymentMgr');
var Site = require('dw/system/Site');
var Locale = require('dw/util/Locale');
var ContentMgr = dw.content.ContentMgr;

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
    /**
     * Check the Api production mode
     *@param {paymentProcessorId} paymentProcessorId - payment processor ID
     * @returns {boolean} true, if mode production for zip.
     */
    isApiProductionMode: function (paymentProcessorId) {
        var prefix = paymentProcessorId.charAt(0).toLowerCase() + paymentProcessorId.slice(1);

        var preferenceName = prefix + 'ApiMode';

        var isProductionMode = Site.getCurrent().getCustomPreferenceValue(preferenceName);

        return isProductionMode;
    },
    /**
     * Retrieves zip marketing key
     *
     * @returns {string} value of zip marketing key.
     */
    getMarketingKey: function () {
        var marketingKey = Site.getCurrent().getCustomPreferenceValue('zipMarketingKey');

        return marketingKey;
    },
    /**
     * Retrieves zip marketing environment
     *
     * @returns {string} value of zip marketing environment.
     */
    getMarketingEnvironment: function () {
        var marketingEnvironment = Site.getCurrent().getCustomPreferenceValue('zipMarketingEnvironment');
        return marketingEnvironment.value;
    },
    /**
     * Retrieves zip preference value
     * @param {paymentProcessorId} paymentProcessorId - payment processor ID
     * @param {preferenceName} preferenceName - preference name
     * @returns {string} zip preferenec value.
     */
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
    /**
     * Check if zip payment method can selected
     *
     * @returns {boolean} true, if zip payment method can selected
     */
    isCanSelectedPaymentMethod: function () {
        var usedPaymentMethodId = session.privacy.ZipPaymentMethodId;

        if (!usedPaymentMethodId) {
            return false;
        }

        return true;
    },
    /**
     * Retrieves default selected payment method
     *
     * @returns {string} value of default selected payment method
     */
    getDefaultSelectedPaymentMethod: function () {
        var paymentMethod = PaymentMgr.getPaymentMethod(config.ZIP_DEFAULT_METHOD_ID);

        if (request.locale === 'en_US') {
            paymentMethod = PaymentMgr.getPaymentMethod(config.ZIP_PAYMENT_METHODS.quadpay);
        }

        if (request.locale === 'en_ZA') {
            paymentMethod = PaymentMgr.getPaymentMethod(config.ZIP_PAYMENT_METHODS.payflex);
        }

        return paymentMethod;
    },
    /**
     * Retrieves selected payment method
     *
     * @returns {string} value of selected payment method.
     */
    getSelectedPaymentMethod: function () {
        var usedPaymentMethodId = session.privacy.ZipPaymentMethodId;

        if (!usedPaymentMethodId) {
            return null;
        }

        var paymentMethod = PaymentMgr.getPaymentMethod(usedPaymentMethodId);
        return paymentMethod;
    },
    /**
     * Check the tokenization required
     *@param {zipPaymentMethod} zipPaymentMethod - zip payment method
     * @returns {boolean} true, if tokenization is required
     */
    isTokenizationRequired: function (zipPaymentMethod) {
        if (request.locale !== 'en_AU') {
            return false;
        }

        var paymentProcessorId = zipPaymentMethod.getPaymentProcessor().getID();

        var tokenizationRequired = this.getPreference(paymentProcessorId, 'Tokenization');

        return tokenizationRequired;
    },
    /**
     * Check the auto capture is enabled
     *@param {zipPaymentMethod} zipPaymentMethod - zip payment method
     * @returns {boolean} true, if auto capture enabled
     */
    isAutoCaptureEnabled: function (zipPaymentMethod) {
        var paymentProcessorId = zipPaymentMethod.getPaymentProcessor().getID();

        var autoCaptureEnabled = this.getPreference(paymentProcessorId, 'AutoCapture');

        return autoCaptureEnabled;
    },
    /**
     * Retrieves zip payment instrument
     * @param {lineItemCtnr} lineItemCtnr - lineItemCtnr order or basket
     * @returns {string} value of zip payment instrument
     */
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
        var zipDeclinedContent = ContentMgr.getContent('zip-declined');

        return zipDeclinedContent.custom.body.source;
    },
    /**
     * Get Zip Payment Referral Order Error Message.
     *
     * The error message appears on payment stage, when customer
     * account under review during Zip checkout process.
     *
     * @returns {string} error message text.
     */
    getZipPaymentReferralOrderErrorMessage: function () {
        var zipReferralerrorContent = ContentMgr.getContent('zip-referral-error');

        return zipReferralerrorContent.custom.body.source;
    },
    /**
     * Check if payment method is Zip.
     *
     * @param {string} paymentMethodId payment method id.
     * @returns {bool} true, if payment method is Zip.
     */
    isPaymentMethodZip: function (paymentMethodId) {
        return (config.ZIP_PAYMENT_METHODS.zip === paymentMethodId || config.ZIP_PAYMENT_METHODS.quadpay === paymentMethodId || config.ZIP_PAYMENT_METHODS.payflex === paymentMethodId);
    },
    /**
     * Check the order is zip order.
     *
     * @param {lineItemContainer} lineItemContainer - lineItemContainer order or basket.
     * @returns {boolean} true, if payment method is Zip.
     */
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
    /**
     * Retrieves first payment instrument
     *
     * @param {Object} order - order object.
     * @returns {boolean} true, if payment method is Zip.
     */
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
    },
    /**
     * Check the zippay is enabled
     *
     * @returns {boolean} true, if zippay has enabled
     */
    isZippayEnabled: function () {
        var zippayEnabled = Site.getCurrent().getCustomPreferenceValue('enableZippay');

        return zippayEnabled;
    },
    /**
     * Get Zip Invalid Country Error Message.
     *
     * The error message appears on payment stage, when customer
     * enter invalid shipping/billing country during Zip checkout process.
     *
     * @returns {string} error message text.
     */
    getZipInvalidCountryError: function () {
        var zipInvalidCountryErrorContent = ContentMgr.getContent('zip-invalid-country-error');
        var zipInvalidCountryError = zipInvalidCountryErrorContent.custom.body.source;
        var paymentMthodID = this.getDefaultSelectedPaymentMethod() ? this.getDefaultSelectedPaymentMethod().ID : '';

        var zipInvalidCountryErrorMsg = zipInvalidCountryError.replace('$paymentMethod', paymentMthodID, 'g');

        return zipInvalidCountryErrorMsg;
    }
};

module.exports = Zip;
