/* globals dw, request, session, empty */

'use strict';

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var ZipModel = require('*/cartridge/scripts/zip/helpers/zip');
var Config = require('*/cartridge/config/config');


/**
 * Get Zip resources
 */
var ZipResources = {
    getZipResources: function (zipError) {
        var urls = {
            cancel: URLUtils.https('Zip-Cancel').toString(),
            checkout: URLUtils.https('Zip-Checkout').toString(),
            redirect: URLUtils.https('Zip-Redirect').toString(),
            declined: URLUtils.https('Checkout-Begin', 'stage', 'payment', 'error', 1).toString()
        };

        var texts = {
            continueToZip: Resource.msg('continueToZip', 'zip', null),
            continueToQuadPay: Resource.msg('continueToQuadPay', 'zip', null),
            continueToPayFlex: Resource.msg('continueToPayFlex', 'zip', null),
            technicalError: Resource.msg('error.technical', 'zip', null),
            zipDeclined: ZipModel.getZipPaymentDeclinedErrorMessage(),
            errorZipAddress: Resource.msg('error.zip.address', 'zip', null),
            errorInsufficientFunds: Resource.msg('error.zip.insufficientFunds', 'zip', null),
            zipReferralOrderError: ZipModel.getZipPaymentReferralOrderErrorMessage(),
            zipInvalidCountryError: ZipModel.getZipInvalidCountryError()
        };

        var config = {
            zip_payment_methods: Config.ZIP_PAYMENT_METHODS,
            zipLightbox: ZipModel.isLightbox()
        };

        var resources = {
            error: zipError,
            texts: texts,
            urls: urls,
            config: config
        };

        return resources;
    }
};

module.exports = ZipResources;
