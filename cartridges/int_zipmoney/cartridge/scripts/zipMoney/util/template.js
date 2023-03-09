/* global customer */

'use strict';

var PaymentMgr = require('dw/order/PaymentMgr');
var URLUtils = require('dw/web/URLUtils');

var ZipModel = require('*/cartridge/scripts/zipMoney/models/ZipModel');
var ZipHelpers = require('*/cartridge/scripts/zipMoney/helpers/zip');

/**
 * Obtain logo URL from the payment method.
 *
 * @param {string} paymentMethodId PaymentMethod ID.
 * @returns {string} imageUrl - URL of logo image.
 */
function getPaymentMethodLogoUrl(paymentMethodId) {
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);
    var image = paymentMethod.getImage();
    var imageUrl = image.getAbsURL();

    return imageUrl;
}

/**
 * Obtain Zip payment method name.
 * @param {string} paymentMethodId PaymentMethod Id
 * @returns {string}
 */
function getPaymentMethodName(paymentMethodId) {
    return ZipModel.getPaymentMethodName(paymentMethodId);
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
 * @param {string} paymentOptionId payment method ID
 */
function isZipTokenizationEnabled(paymentMethodId) {
    var PaymentMgr = require('dw/order/PaymentMgr');

    if (!ZipHelpers.isPaymentMethodZip(paymentMethodId)) {
        throw new Error("Only Zip payment methods are allowed.");
    }

    var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);
    var paymentProcessorId = paymentMethod.getPaymentProcessor().getID();

    return ZipModel.getPreference(paymentProcessorId, 'Tokenization');
}

function getZipMarketingKey () {
    return ZipModel.getMarketingKey();
}

function getZipMarketingEnvironment () {
    return ZipModel.getMarketingEnvironment();
}

function getZipFooterLinkText () {
    return ZipModel.getFooterLinkText();
}

function isShowZipWidgets () {
    var count = ZipModel.getActiveZipPaymentMethodsCount();

    return (count > 0);
}

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

function isZipPaymentMethodSelected(basket) {
    var paymentInstruments = basket.paymentInstruments;

    var firstPaymentInstrument = paymentInstruments[0];

    return (ZipHelpers.isPaymentMethodZip(firstPaymentInstrument.paymentMethod));
}

function canTokenize (basket) {
    if (!customer.registered || !customer.authenticated) {
        return false;
    }

    var CustomerTokenInWalletModel = require('~/../int_zipmoney/cartridge/scripts/zipMoney/models/ZipCustomerTokenInWalletModel');

    var paymentInstruments = basket.paymentInstruments;
    var firstPaymentInstrument = paymentInstruments[0];

    var selectedPaymentMethod = PaymentMgr.getPaymentMethod(firstPaymentInstrument.paymentMethod);

    if (ZipModel.isTokenizationRequired(selectedPaymentMethod)) {
        var customerTokenInWalletModel = new CustomerTokenInWalletModel(customer.getProfile().getWallet());
        if (selectedPaymentMethod && customerTokenInWalletModel.hasToken()) {
            return true;
        }
    }

    return false;
}

function isCustomerHasToken (customer) {
    if (!customer.getProfile()) {
        return false;
    }

    var CustomerTokenInWalletModel = require('int_zipmoney/cartridge/scripts/zipMoney/models/ZipCustomerTokenInWalletModel');

    var customerProfile = customer.getProfile();
    var customerTokenInWalletModel = new CustomerTokenInWalletModel(customerProfile.getWallet());

    return (customerTokenInWalletModel.hasToken());
}

function getZipPendingApplicationMessageStyles () {
    return ZipModel.getZipPendingApplicationMessageStyles();
}

exports.getPaymentMethodLogoUrl = getPaymentMethodLogoUrl;
exports.getPaymentMethodName = getPaymentMethodName;
exports.isPaymentMethodZip = isPaymentMethodZip;
exports.isZipTokenizationEnabled = isZipTokenizationEnabled;
exports.getZipMarketingKey = getZipMarketingKey;
exports.getZipMarketingEnvironment = getZipMarketingEnvironment;
exports.getZipFooterLinkText = getZipFooterLinkText;
exports.isShowZipWidgets = isShowZipWidgets;
exports.getPlaceOrderFormUrl = getPlaceOrderFormUrl;
exports.isZipPaymentMethodSelected = isZipPaymentMethodSelected;
exports.canTokenize = canTokenize;
exports.getZipPendingApplicationMessageStyles = getZipPendingApplicationMessageStyles;
exports.isCustomerHasToken = isCustomerHasToken;