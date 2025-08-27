'use strict';

var URLUtils = require('dw/web/URLUtils');
var ZipHelpers = require('~/cartridge/scripts/zip/helpers/zip');

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
    var imageUrl;

    if (image) {
        imageUrl = image.getAbsURL();
    }

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

    if (request.locale !== 'en_AU') { // eslint-disable-line no-undef
        return false;
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
 * @returns {boolean} true, if zip widgets must be shown in front-end.
 */
function isShowZipWidgets() {
    return (ZipHelpers.getActiveZipPaymentMethodsCount() > 0);
}

/**
 * @returns {*|void} PlaceOrder Form Url
 */
function getPlaceOrderFormUrl() {
    var BasketMgr = require('dw/order/BasketMgr');

    var paymentInstruments = BasketMgr.getCurrentBasket().getPaymentInstruments();

    for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentMethodId = paymentInstruments[i].getPaymentMethod();

        if (ZipHelpers.isPaymentMethodZip(paymentMethodId)) {
            return URLUtils.https('COSummary-Submit', 'ajax', 'true');
        }
    }

    return URLUtils.https('COSummary-Submit');
}

/**
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {*|bool} true, if payment method is Zip.
 */
function isZipPaymentMethodSelected(basket) {
    var paymentInstruments = basket.paymentInstruments;

    var firstPaymentInstrument = paymentInstruments[0];

    return (ZipHelpers.isPaymentMethodZip(firstPaymentInstrument.paymentMethod));
}

/**
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {string} paymentMethodId PaymentMethod ID.
 */
function getSelectedPaymentMethod(basket) {
    var paymentInstruments = basket.paymentInstruments;
    var firstPaymentInstrument = paymentInstruments[0];
    return firstPaymentInstrument.paymentMethod;
}

/**
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {boolean} true, if wallet has zip token.
 */
function canTokenize(basket) {
    var PaymentMgr = require('dw/order/PaymentMgr');

    if (!customer.registered || !customer.authenticated) { // eslint-disable-line no-undef
        return false;
    }

    var CustomerTokenInWalletModel = require('~/cartridge/models/zip/customerTokenInWallet');

    var paymentInstruments = basket.paymentInstruments;
    var firstPaymentInstrument = paymentInstruments[0];

    var selectedPaymentMethod = PaymentMgr.getPaymentMethod(firstPaymentInstrument.paymentMethod);

    if (ZipHelpers.isTokenizationRequired(selectedPaymentMethod)) {
        var customerTokenInWalletModel = new CustomerTokenInWalletModel(customer.getProfile().getWallet()); // eslint-disable-line no-undef
        if (selectedPaymentMethod && customerTokenInWalletModel.hasToken()) {
            return true;
        }
    }

    return false;
}

/**
 * @param {Object} customer - customer model
 * @returns {boolean} true, if wallet has zip token.
 */
function isCustomerHasToken(customer) {
    if (!customer.getProfile()) {
        return false;
    }

    var CustomerTokenInWalletModel = require('~/cartridge/models/zip/customerTokenInWallet');

    var customerProfile = customer.getProfile();
    var customerTokenInWalletModel = new CustomerTokenInWalletModel(customerProfile.getWallet());

    return (customerTokenInWalletModel.hasToken());
}

/**
 * Check the zippay is enabled
 *
 * @returns {boolean} true, if zippay has enabled
 */
function isZippayEnabled() {
    return ZipHelpers.isZippayEnabled();
}

exports.getPaymentMethodLogoUrl = getPaymentMethodLogoUrl;
exports.getPaymentMethodName = getPaymentMethodName;
exports.isPaymentMethodZip = isPaymentMethodZip;
exports.isZipTokenizationEnabled = isZipTokenizationEnabled;
exports.getZipMarketingKey = getZipMarketingKey;
exports.getZipMarketingEnvironment = getZipMarketingEnvironment;
exports.isShowZipWidgets = isShowZipWidgets;
exports.getPlaceOrderFormUrl = getPlaceOrderFormUrl;
exports.isZipPaymentMethodSelected = isZipPaymentMethodSelected;
exports.getSelectedPaymentMethod = getSelectedPaymentMethod;
exports.canTokenize = canTokenize;
exports.isCustomerHasToken = isCustomerHasToken;
exports.isZippayEnabled = isZippayEnabled;
