'use strict';

/* global dw */

var ZipProcessor = require('*/cartridge/scripts/zip/processor');

/**
 * Handle entry point for SG integration
 * @param {Object} basket Basket
 * @param {Object} paymentInformation - the payment information
 * @param {string} paymentMethodID - paymentmethod ID
 * @param {Object} req the request object
 * @returns {Object} processor result
 * @constructor
 */
function Handle(basket, paymentInformation, paymentMethodID, req) { // eslint-disable-line no-unused-vars
    var result = ZipProcessor.handle(basket, paymentMethodID);
    return result;
}

/**
 * Authorize entry point for SG integration
 * @param {Object} orderNumber order numebr
 * @param {Object} paymentInstrument payment intrument
 * @returns {Object} processor result
 */
function Authorize(orderNumber, paymentInstrument) {
    var order = dw.order.OrderMgr.getOrder(orderNumber);
    var result = ZipProcessor.authorize(order, orderNumber, paymentInstrument);
    return result;
}

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var viewData = viewFormData;

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    return {
        error: false,
        viewData: viewData
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.processForm = processForm;
