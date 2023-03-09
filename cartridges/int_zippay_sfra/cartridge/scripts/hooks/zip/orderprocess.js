'use strict';

/* global dw */

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var ZipModel = require('~/cartridge/scripts/zip/helpers/zip');
var ZipOrderModel = require('~/cartridge/models/zip/zipOrder');
var ZipPaymentTransactionModel = require('~/cartridge/models/zip/zipPaymentTransaction');

/**
 * Result Object for hooks.
 */
function ResultObject() {
    this.result = {
        success: false,
        result: {}
    };
}

/**
 * Set success result.
 *
 * @param {Object} data Api response data.
 */
ResultObject.prototype.success = function (data) {
    this.result = {
        success: true,
        result: data
    };
};

/**
 * Set error result.
 *
 * @param {string} errorMessage error message.
 */
ResultObject.prototype.error = function (errorMessage) {
    this.result = {
        error: true,
        message: errorMessage
    };
};

/**
 * Long error message and build failed request
 * @param {Object} resultObject Result Object
 * @param {string} message error message
 */
function handleFailedRequest(resultObject, message) {
    resultObject.error(message);

    Logger.error(message);
}

/**
 * Retrieve paymentTransaction by given order
 * @param {dw.order.Order} order - The order object
 * @returns {dw.order.PaymentTransaction} - The paymentTransaction object
 */
function getPaymentTransactionByOrder(order) {
    var paymentInstrument = ZipModel.getZipPaymentInstrument(order);
    if (!paymentInstrument) {
        return null;
    }

    var paymentTransaction = paymentInstrument.getPaymentTransaction();
    if (!paymentTransaction) {
        return null;
    }

    return paymentTransaction;
}

/**
 * Execute Zip Refund request at order
 * @param {number} orderNumber - the order number
 * @param {number} amount - refund amount
 * @param {string} reason - the reason of refund
 * @returns {Object} request result object
 */
function refund(orderNumber, amount, reason) {
    var CreateRefundZipAPIRequest = require('~/cartridge/scripts/zip/api/request/createRefund');
    var result = new ResultObject();

    var order = OrderMgr.getOrder(orderNumber);
    if (!order) {
        return handleFailedRequest('Unable to find order by order number ' + orderNumber);
    }

    var paymentTransaction = getPaymentTransactionByOrder(order);
    if (!paymentTransaction) {
        return handleFailedRequest('Unable to find payment transaction ');
    }

    var chargeId = paymentTransaction.custom.ZipChargeId;
    var createRefundZipAPIRequest = new CreateRefundZipAPIRequest();
    try {
        var apiResponse = createRefundZipAPIRequest.execute(chargeId, reason, amount);

        Transaction.wrap(function () {
            ZipOrderModel.reflectRefund(order, amount);
        });

        result.success(apiResponse);
    } catch (e) {
        return handleFailedRequest('Failure zip order Refund request with error message: ' + e.message);
    }

    return result;
}

/**
 * Execute Zip Cancel request at order
 * @param {number} orderNumber - the order number
 * @returns {Object} cancelResult - request result object
 */
function cancel(orderNumber) {
    var CreateCancelZipAPIRequest = require('~/cartridge/scripts/zip/api/request/createCancel');
    var result = new ResultObject();

    var order = OrderMgr.getOrder(orderNumber);
    if (!order) {
        return handleFailedRequest('Unable to find order by order number ' + orderNumber);
    }

    var paymentTransaction = getPaymentTransactionByOrder(order);
    if (!paymentTransaction) {
        return handleFailedRequest('Unable to find payment transaction ');
    }

    var apiResponse = null;
    var chargeId = paymentTransaction.custom.ZipChargeId;
    var createCancelZipAPIRequest = new CreateCancelZipAPIRequest();
    try {
        Transaction.wrap(function () {
            ZipOrderModel.reflectCancel(order);
            ZipPaymentTransactionModel.reflectCancel(paymentTransaction, result);

            apiResponse = createCancelZipAPIRequest.execute(chargeId);
        });

        result.success(apiResponse);
    } catch (e) {
        return handleFailedRequest('Failure zip order Cancel request with error message: ' + e.message);
    }

    return result;
}

/**
 * Execute Zip Capture request at order
 * @param {number} orderNumber - the order number
 * @param {number} amount - capture amount
 * @returns {Object} captureResult - request result object
 */
function capture(orderNumber, amount) {
    var CreateCaptureZipAPIRequest = require('~/cartridge/scripts/zip/api/request/captureCharge');
    var result = new ResultObject();

    var order = OrderMgr.getOrder(orderNumber);
    if (!order) {
        return handleFailedRequest('Unable to find order by order number ' + orderNumber);
    }

    var paymentTransaction = getPaymentTransactionByOrder(order);
    if (!paymentTransaction) {
        return handleFailedRequest('Unable to find payment transaction ');
    }

    var isPartialCapture = (amount < ZipOrderModel.getAmountNotCapturedYet(order));
    var chargeId = paymentTransaction.custom.ZipChargeId;
    var createCapturetZipAPIRequest = new CreateCaptureZipAPIRequest();

    try {
        var apiResponse = createCapturetZipAPIRequest.execute(chargeId, amount, isPartialCapture);

        Transaction.wrap(function () {
            ZipOrderModel.reflectCapture(order, amount);
            ZipPaymentTransactionModel.reflectCapture(paymentTransaction, amount);
        });

        result.success(apiResponse);
    } catch (e) {
        return handleFailedRequest('Failure zip order Capture request with error message: ' + e.message);
    }

    return result;
}

/**
 * Execute Full Zip Capture request at order.
 *
 * This function calculates the amount not captured yet and uses that amount
 * to request a full capture from Zip.
 *
 * @param {number} orderNumber - the order number
 * @returns {Object} captureResult - request result object
 */
function captureFull(orderNumber) {
    var order = OrderMgr.getOrder(orderNumber);

    if (!order) {
        return handleFailedRequest('Unable to find order by order number ' + orderNumber);
    }

    var canCaptureAmount = ZipOrderModel.getAmountNotCapturedYet(order);

    return capture(orderNumber, canCaptureAmount);
}

/**
 * Execute Full Zip Refund request at order.
 *
 * This function calculates the amount not refunded yet, and uses that amount
 * to request a full refund from Zip.
 *
 * @param {number} orderNumber - the order number
 * @param {string} reason - the reason of refund
 * @returns {Object} request result object
 */
function refundFull(orderNumber, reason) {
    var order = OrderMgr.getOrder(orderNumber);

    if (!order) {
        return handleFailedRequest('Unable to find order by order number ' + orderNumber);
    }

    var refundableAmount = ZipOrderModel.getRefundableAmount(order);

    return refund(orderNumber, refundableAmount, reason);
}

/**
 * Exported functions
 */
exports.Capture = capture;
exports.CaptureFull = captureFull;
exports.Refund = refund;
exports.RefundFull = refundFull;
exports.Cancel = cancel;
