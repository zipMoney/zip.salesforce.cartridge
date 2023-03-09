/* global dw request response empty */

var ZipModel = require('~/../int_zipmoney/cartridge/scripts/zipMoney/models/ZipModel');
var ZipOrderModel = require('~/../int_zipmoney/cartridge/scripts/zipMoney/models/ZipOrderModel');
var Logger = require('dw/system/Logger');
var ISML = require('dw/template/ISML');

/**
 * Lising with all orders into one array for pagination
 *
 * @param {string} orderNo - Order number used in "Search by order number" feature
 * @returns {dw.util.ArrayList} array with all zip orders
 */
function getOrders(orderNo) {
    var Money = require('dw/value/Money');

    var status = dw.order.Order.ORDER_STATUS_FAILED;
    var systemOrders = null;

    if (empty(orderNo)) {
        systemOrders = dw.object.SystemObjectMgr.querySystemObjects('Order',
        "status != {0}",
        "creationDate desc", status);
    } else {
        systemOrders = dw.object.SystemObjectMgr.querySystemObjects('Order',
            "orderNo LIKE {0} AND status != {1}",
            "creationDate desc", orderNo, status);
    }

    var orders = new dw.util.ArrayList(); // eslint-disable-line no-shadow
    var order;
    var paymentInstrument;
    var orderDate;
    var obj;

    var orderIndex = 0;
    var maxSystemOrdersCount = 9000;

    while (systemOrders.hasNext()) {
        orderIndex++;
        if (orderIndex > maxSystemOrdersCount) {
            break;
        }
        order = systemOrders.next();
        paymentInstrument = ZipModel.getZipPaymentInstrument(order);

        if (paymentInstrument === null || empty(paymentInstrument.getPaymentTransaction().custom.ZipChargeId)) {
            continue; // eslint-disable-line no-continue
        }

        var transaction = paymentInstrument.getPaymentTransaction();
        var isZipAutoCapture = transaction.custom.isZipAutoCapture;
        var isPaid = ZipOrderModel.isFullyPaid(order);
        var isCancelled = order.getStatus().getValue() === order.ORDER_STATUS_CANCELLED;
        var capturedAmount = ZipOrderModel.getZipCapturedAmount(order);
        var refundedAmount = ZipOrderModel.getZipRefundedAmount(order);
        var refundableAmount = ZipOrderModel.getRefundableAmount(order);

        orderDate = new Date(order.creationDate);
        obj = {
            orderNo: order.orderNo,
            orderDate: dw.util.StringUtils.formatCalendar(new dw.util.Calendar(orderDate), 'M/dd/yy h:mm a'),
            paymentStatus: order.paymentStatus,
            isRegestered: order.customer.registered,
            customer: order.customerName,
            email: order.customerEmail,
            orderTotal: order.totalGrossPrice,
            currencyCode: order.getCurrencyCode(),
            zippayAmount: transaction.getAmount(),
            status: order.status,
            dateCompare: orderDate.getTime(),
            isCustom: false,
            autoCapture: isZipAutoCapture,
            paymentStatusPaid: isPaid,
            capturedAmount: new Money(capturedAmount, order.getCurrencyCode()),
            refundedAmount: new Money(refundedAmount, order.getCurrencyCode()),
            isCancelled: isCancelled,
            canCapture: ( ! isCancelled  && ! isPaid  && ZipOrderModel.getAmountNotCapturedYet(order) > 0),
            canRefund: ( ! isCancelled && refundableAmount > 0),
            canCancel: ( ! isCancelled && ! isPaid)
        };
        orders.push(obj);
    }

    orderIndex = 0;

    orders.sort(new dw.util.PropertyComparator('dateCompare', false));

    return orders;
}

/**
 * Render Template
 * @param {string} templateName - Template Name
 * @param {Object} data - pdict data
 */
function render(templateName, data) {
    if (typeof data !== 'object') {
        data = {}; // eslint-disable-line no-param-reassign
    }
    try {
        ISML.renderTemplate(templateName, data);
    } catch (e) {
        throw new Error(e.javaMessage + '\n\r' + e.stack, e.fileName, e.lineNumber);
    }
}

/**
 * Get orders list. Can be filtered by order ID or transaction ID
 */
function orders() {
    var orderNo = '';
    var orders; // eslint-disable-line no-shadow

    orderNo = empty(request.httpParameterMap.orderNo.stringValue) ? "" : request.httpParameterMap.orderNo.stringValue;
    orderNo = request.httpParameterMap.transactionId.submitted ? '0' : orderNo;
    orderNo = request.httpParameterMap.transactionId.stringValue === '' ? "" : orderNo;

    orders = getOrders(orderNo);

    var pageSize = !empty(request.httpParameterMap.pagesize.intValue) ? request.httpParameterMap.pagesize.intValue : 10;
    var currentPage = request.httpParameterMap.page.intValue ? request.httpParameterMap.page.intValue : 1;
    pageSize = pageSize === 0 ? orders.length : pageSize;
    var start = pageSize * (currentPage - 1);
    var orderPagingModel = new dw.web.PagingModel(orders);

    orderPagingModel.setPageSize(pageSize);
    orderPagingModel.setStart(start);

    render('zippaybm/orderlist', {
        PagingModel: orderPagingModel
    });
}

/**
 * Render JSON from Objects
 * @param {Object} responseResult - Response Result
 * @param {Object} responseData - Response Data
 */
function renderJson(responseResult, data) {
    if (!empty(responseResult)) {
        data.result = responseResult;
    }

    response.setContentType('application/json');
    response.writer.print(JSON.stringify(data, null, 2));
}

function capture() {
    var hooksHelper = require('~/../int_zipmoney/cartridge/scripts/zipMoney/helpers/hooks');
    var orderNo = request.httpParameterMap.orderNo.stringValue;
    var amount = parseFloat(request.httpParameterMap.amt.value);

    var captureResult = hooksHelper('zippay.order.processor',
        'Capture', orderNo, amount, require('~/../int_zipmoney/cartridge/scripts/zipMoney/hooks/zip/orderprocess').Capture
    );
    var responseResult = captureResult.success ? 'Success' : 'Error';

    return renderJson(responseResult, captureResult.result);
}

/**
 * Zip order Refund Action
 */
function refund() {
    var hooksHelper = require('~/../int_zipmoney/cartridge/scripts/zipMoney/helpers/hooks');
    var orderNo = request.httpParameterMap.orderNo.value;
    var reason = request.httpParameterMap.note.stringValue;
    var amount = request.httpParameterMap.amt.value;

    var refundResult = hooksHelper('zippay.order.processor',
       'Refund', orderNo, amount, reason, require('~/../int_zipmoney/cartridge/scripts/zipMoney/hooks/zip/orderprocess').Refund
    );
    var responseResult = refundResult.success ? 'Success' : 'Error';

    return renderJson(responseResult, refundResult.result);
}

function cancel() {
    var hooksHelper = require('~/../int_zipmoney/cartridge/scripts/zipMoney/helpers/hooks');
    var orderNo = request.httpParameterMap.orderNo.stringValue;

    if (empty(orderNo)) {
        response.print(JSON.stringify({msg: 'Order not found'}));
        return;
    }

    var result = hooksHelper('zippay.order.processor',
       'Cancel', orderNo, require('~/../int_zipmoney/cartridge/scripts/zipMoney/hooks/zip/orderprocess').Cancel
    );

    render('zippaybm/actionresult', {
         result: JSON.stringify(result)
    });
}

/**
 * renders refund form HTML
 */
function refundForm() {
    var OrderMgr = require('dw/order/OrderMgr');
    var orderNo = empty(request.httpParameterMap.orderNo.value) ? null : request.httpParameterMap.orderNo.value;
    var order = OrderMgr.getOrder(orderNo);

    if (!order) {
        Logger.error("Can't Find Order for refund for id: " + orderNo);
        render('zippaybm/components/servererror');
        return;
    }

    var paymentInstrument = ZipModel.getZipPaymentInstrument(order);
    var transaction = paymentInstrument.getPaymentTransaction();
    var refundableAmount = ZipOrderModel.getRefundableAmount(order);

    render('zippaybm/refundform', {
        order: order,
        transaction: transaction,
        amount: refundableAmount,
        currencyCode: transaction ? transaction.getAmount().getCurrencyCode() : ''
    });
}

/**
 * renders refund form HTML
 */
function captureForm() {
    var OrderMgr = require('dw/order/OrderMgr');
    var orderNo = empty(request.httpParameterMap.orderNo.value) ? null : request.httpParameterMap.orderNo.value;
    var order = OrderMgr.getOrder(orderNo);

    if (!order) {
        Logger.error("Can't Find Order for refund for id: " + orderNo);
        render('zippaybm/components/servererror');
        return;
    }

    var paymentInstrument = ZipModel.getZipPaymentInstrument(order);
    var canCaptureAmount = ZipOrderModel.getAmountNotCapturedYet(order);
    var transaction = paymentInstrument.getPaymentTransaction();

    render('zippaybm/captureform', {
        order: order,
        transaction: transaction,
        amount: canCaptureAmount,
        currencyCode: transaction ? transaction.getAmount().getCurrencyCode() : ''
    });
}

orders.public = true;
refund.public = true;
cancel.public = true;
capture.public = true;
refundForm.public = true;
captureForm.public = true;

exports.Orders = orders;
exports.RefundForm = refundForm;
exports.CaptureForm = captureForm;
exports.CaptureAction = capture;
exports.RefundAction = refund;
exports.Cancel = cancel;