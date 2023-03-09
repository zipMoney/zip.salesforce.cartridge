'use strict';

var ZipHelpers = require('*/cartridge/scripts/zip/helpers/zip');

/**
 * Obtain logo URL from the payment method.
 *
 * @param {string} paymentMethodId PaymentMethod ID.
 * @returns {string} imageUrl - URL of logo image.
 */
function getPaymentMethodLogoUrl(paymentMethodId) {
    var PaymentMgr = require('dw/order/PaymentMgr');

    var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);
    var image = paymentMethod.getImage();
    var imageUrl = image.getAbsURL();

    return imageUrl;
}

/**
 * Obtain Zip payment method name by ID.
 * @param {string} paymentMethodId PaymentMethod Id
 * @returns {string} payment method name.
 */
function getPaymentMethodName(paymentMethodId) {
    return ZipHelpers.getPaymentMethodName(paymentMethodId);
}

/**
 * Check if the passed payment method is ZIP.
 * @param {string} paymentMethodId - ID of payment method.
 * @returns {bool} true, if ZIP.
 */
function isPaymentMethodZip(paymentMethodId) {
    return ZipHelpers.isPaymentMethodZip(paymentMethodId);
}

/**
 * Check if Zip Tokenization is enabled for a Zip payment method.
 *
 * @param {string} paymentMethodId payment method ID
 * @returns {boolean} true, if zip tokenization is enabled; false - otherwise.
 */
function isZipTokenizationEnabled(paymentMethodId) {
    var PaymentMgr = require('dw/order/PaymentMgr');

    if (!ZipHelpers.isPaymentMethodZip(paymentMethodId)) {
        throw new Error('Only Zip payment methods are allowed.');
    }

    var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);
    var paymentProcessorId = paymentMethod.getPaymentProcessor().getID();

    return ZipHelpers.getPreference(paymentProcessorId, 'Tokenization');
}

/**
 * @returns {string} marketing key.
 */
function getZipMarketingKey() {
    return ZipHelpers.getMarketingKey();
}

/**
 * @returns {string} marketing environment (e.g. "sandbox")
 */
function getZipMarketingEnvironment() {
    return ZipHelpers.getMarketingEnvironment();
}

/**
 * @returns {string} Zip footer link text.
 */
function getZipFooterLinkText() {
    return ZipHelpers.getFooterLinkText();
}

/**
 * @returns {boolean} true, if zip widgets must be shown in front-end.
 */
function isShowZipWidgets() {
    return (ZipHelpers.getActiveZipPaymentMethodsCount() > 0);
}

/**
 * Returns Zip Pending Application Message Styles
 *
 * @returns {Object} zip pending application message styles.
 */
function getZipPendingApplicationMessageStyles() {
    return ZipHelpers.getZipPendingApplicationMessageStyles();
}

exports.getPaymentMethodLogoUrl = getPaymentMethodLogoUrl;
exports.getPaymentMethodName = getPaymentMethodName;
exports.isPaymentMethodZip = isPaymentMethodZip;
exports.isZipTokenizationEnabled = isZipTokenizationEnabled;
exports.getZipMarketingKey = getZipMarketingKey;
exports.getZipMarketingEnvironment = getZipMarketingEnvironment;
exports.getZipFooterLinkText = getZipFooterLinkText;
exports.isShowZipWidgets = isShowZipWidgets;
exports.getZipPendingApplicationMessageStyles = getZipPendingApplicationMessageStyles;
