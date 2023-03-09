'use strict';

/* global dw */

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var ZipModel = require('~/cartridge/scripts/zipMoney/models/ZipModel');
var ZipOrderModel = require('~/cartridge/scripts/zipMoney/models/ZipOrderModel');
var ZipPaymentTransactionModel = require('~/cartridge/scripts/zipMoney/models/ZipPaymentTransactionModel');
var errorMessage = null;

/**
 * Long error message and build failed request
 * @param {string} message
 * @returns {Object} FailedResult - request result object
 */
function handleFailedRequest(message) {
    var FailedResult = {};
    FailedResult.result = {};
    FailedResult.result.message = message;

    Logger.error(message);

    return FailedResult;
}

/**
 * Create Success Result Object
 * @param result {Object}
 * @returns  responseResult {Object}
 */
function createSuccessfulResponse(result) {
    var responseResult = {};
    responseResult.success = true;
    responseResult.result = result;

    return responseResult;
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
function Refund(orderNumber, amount, reason) {
    var CreateRefundZipAPIRequest = require('~/cartridge/scripts/zipMoney/api/request/createRefund');
    var apiResult = null;

    var order = OrderMgr.getOrder(orderNumber);
    if (!order) {
        errorMessage = "Unable to find order by order number " + orderNumber;
        return handleFailedRequest(errorMessage);
    }

    var paymentTransaction = getPaymentTransactionByOrder(order);
    if (!paymentTransaction) {
        return handleFailedRequest(errorMessage);
    }

    var chargeId = paymentTransaction.custom.ZipChargeId;
    var createRefundZipAPIRequest = new CreateRefundZipAPIRequest();
    try {
        apiResult = createRefundZipAPIRequest.execute(chargeId, reason, amount);
    } catch (e) {
        var message = "Failure zip order Refund request with error message: " + e.message;
        return handleFailedRequest(message);
    }

    Transaction.wrap(function() {
        ZipOrderModel.reflectRefund(order, amount);
    });

    return createSuccessfulResponse(apiResult);
}

/**
 * Execute Zip Cancel request at order
 * @param {number} orderNumber - the order number
 * @returns {Object} cancelResult - request result object
 */
function Cancel(orderNumber) {
    var CreateCancelZipAPIRequest = require('~/cartridge/scripts/zipMoney/api/request/createCancel');
    var apiResult = null;

    var order = OrderMgr.getOrder(orderNumber);
    if (!order) {
        errorMessage = "Unable to find order by order number " + orderNumber;
        return handleFailedRequest(errorMessage);
    }

    var paymentTransaction = getPaymentTransactionByOrder(order);
    if (!paymentTransaction) {
        return handleFailedRequest(errorMessage);
    }

    var chargeId = paymentTransaction.custom.ZipChargeId;
    var createCancelZipAPIRequest = new CreateCancelZipAPIRequest();
    try {
        apiResult = createCancelZipAPIRequest.execute(chargeId);

        Transaction.wrap(function() {
            ZipOrderModel.reflectCancel(order);
            ZipPaymentTransactionModel.reflectCancel(paymentTransaction, apiResult);
        });
    } catch (e) {
        var message = "Failure zip order Cancel request with error message: " + e.message;
        return handleFailedRequest(message);
    }

    return createSuccessfulResponse(apiResult);
}

/**
 * Execute Zip Capture request at order
 * @param {number} orderNumber - the order number
 * @param {number} amount - capture amount
 * @returns {object} captureResult - request result object
 */
function Capture(orderNumber, amount) {
    var CreateCaptureZipAPIRequest = require('~/cartridge/scripts/zipMoney/api/request/captureCharge');
    var apiResult = null;
    var order = OrderMgr.getOrder(orderNumber);
    if (!order) {
        errorMessage = "Unable to find order by order number " + orderNumber;
        return handleFailedRequest(errorMessage);
    }

    var paymentTransaction = getPaymentTransactionByOrder(order);
    if (!paymentTransaction) {
        return handleFailedRequest(errorMessage);
    }

    var isPartialCapture = (amount < ZipOrderModel.getAmountNotCapturedYet(order));

    var chargeId = paymentTransaction.custom.ZipChargeId;
    var createCaptureZipAPIRequest = new CreateCaptureZipAPIRequest();

    try {
        apiResult = createCaptureZipAPIRequest.execute(chargeId, amount, isPartialCapture);

        Transaction.wrap(function() {
            ZipOrderModel.reflectCapture(order, amount);
            ZipPaymentTransactionModel.reflectCapture(paymentTransaction, amount);
        });
    } catch (e) {
        var message = "Failure zip order Capture request with error message: " + e.message;
        return handleFailedRequest(message);
    }

    return createSuccessfulResponse(apiResult);
}

/**
 * Execute Full Zip Capture request at order.
 *
 * This function calculates the amount not captured yet and uses that amount
 * to request a full capture from Zip.
 *
 * @param {number} orderNumber - the order number
 * @returns {object} captureResult - request result object
 */
function CaptureFull(orderNumber) {
    var order = OrderMgr.getOrder(orderNumber);

    if (!order) {
        errorMessage = "Unable to find order by order number " + orderNumber;
        return handleFailedRequest(errorMessage);
    }

    var canCaptureAmount = ZipOrderModel.getAmountNotCapturedYet(order);

    return Capture(orderNumber, canCaptureAmount);
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
function RefundFull(orderNumber, reason) {
    var order = OrderMgr.getOrder(orderNumber);

    if (!order) {
        errorMessage = "Unable to find order by order number " + orderNumber;
        return handleFailedRequest(errorMessage);
    }

    var refundableAmount = ZipOrderModel.getRefundableAmount(order);

    return Refund(orderNumber, refundableAmount, reason);
}

/**
 * Exported functions
 */
exports.Capture = Capture;
exports.CaptureFull = CaptureFull;
exports.Refund = Refund;
exports.RefundFull = RefundFull;
exports.Cancel = Cancel;