/* globals dw, session, empty */

'use strict';

var ZipCheckoutSessionModel = require('*/cartridge/scripts/zip/helpers/checkoutSession');

var server = require('server');

server.get('Landing', function (req, res, next) {
    res.render('zip/landing');
    next();
});

/**
 * Fail the order linked to the checkout session.
 */
function failZipSessionOrder() {
    var Transaction = require('dw/system/Transaction');

    if (ZipCheckoutSessionModel.hasZipOrder()) {
        ZipCheckoutSessionModel.failZipOrder();
    }

    Transaction.wrap(function () { session.privacy.ZipCheckoutId = null; });
}

/**
 * Zip-Redirect : The Zip-Redirect endpoint is used to redirect to zip payment page
 * @name Base/Zip-Redirect
 * @function
 * @param {serverfunction} - get
 */
server.get('Redirect', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var OrderMgr = require('dw/order/OrderMgr');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var RetrieveCheckoutZipAPIRequest = require('*/cartridge/scripts/zip/api/request/retrieveCheckout');
    var saveToken = require('*/cartridge/scripts/zip/saveToken');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var result = req.querystring.result;
    var checkoutId = req.querystring.checkoutId;
    var orderId = 0;

    // url for general checkout payment redirects (decline/referal)
    var checkoutUrl = URLUtils.url('Checkout-Begin', 'stage', 'payment');

    // url for order processing errors
    var failUrl = URLUtils.url('Checkout-Begin', 'stage', 'payment', 'error', 3);

    // url for zip declines
    var declineUrl = URLUtils.url('Checkout-Begin', 'stage', 'payment', 'error', 2);

    // url for user cancellation
    var cancelUrl = URLUtils.url('Checkout-Begin', 'stage', 'payment');

    // url for general errors
    var errorUrl = URLUtils.url('Cart-Show');
    if (!empty(session.privacy.ZipCheckoutId) && checkoutId !== session.privacy.ZipCheckoutId) {
        failZipSessionOrder();
        res.redirect(checkoutUrl);
        return next();
    }

    if (result === 'cancelled') {
        failZipSessionOrder();
        res.redirect(cancelUrl);
        return next();
    } else if (result === 'declined') {
        failZipSessionOrder();
        res.redirect(declineUrl);
        return next();
    }
    try {
        var retrieveCheckoutAPIRequest = new RetrieveCheckoutZipAPIRequest();
        var retrieveCheckoutResponseData = retrieveCheckoutAPIRequest.execute(checkoutId);

        orderId = retrieveCheckoutResponseData.order.reference;
    } catch (e) {
        failZipSessionOrder();

        res.redirect(failUrl);
        return next();
    }
    var order = OrderMgr.getOrder(orderId);

    if (!order || order.getStatus().value !== order.ORDER_STATUS_CREATED) {
        failZipSessionOrder();
        // Redirect to basket page on approval from referral flow email
        if (order.custom.zipRequireApproval) {
            Transaction.wrap(function () {
                order.custom.zipRequireApproval = false;
            });
            res.redirect(errorUrl);
            return next();
        }
        res.redirect(failUrl);
        return next();
    }

    Transaction.wrap(function () {
        order.custom.ZipCheckoutId = checkoutId;
    });

    if (result === 'approved') {
        try {
            saveToken(order, checkoutId);
        } catch (e) {
            dw.system.Logger.error(e.message + '\n\r' + e.stack);

            failZipSessionOrder();

            res.redirect(failUrl);
            return next();
        }
        // Handles payment authorization
        var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
        if (handlePaymentResult.error) {
            failZipSessionOrder();

            res.redirect(failUrl);
            return next();
        }

        var currentBasket = BasketMgr.getCurrentBasket();
        var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
        if (fraudDetectionStatus.status === 'fail') {
            failZipSessionOrder();

            // fraud detection failed
            req.session.privacyCache.set('fraudDetectionStatus', true);

            res.redirect(failUrl);
            return next();
        }

        var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
        if (placeOrderResult.error) {
            failZipSessionOrder();
            res.redirect(failUrl);
            return next();
        }

        ZipCheckoutSessionModel.removeZipOrder();
        Transaction.wrap(function () { session.privacy.ZipCheckoutId = null; });

        COHelpers.sendConfirmationEmail(order, req.locale.id);

        // Reset usingMultiShip after successful Order placement
        req.session.privacyCache.set('usingMultiShipping', false);

        res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken));
        return next();
    } else if (result === 'referred') {
        Transaction.wrap(function () { order.custom.zipRequireApproval = true; });
        failZipSessionOrder();
        var referralErrorURL = URLUtils.url('Checkout-Begin', 'stage', 'payment', 'error', 4);

        res.redirect(referralErrorURL);
        return next();
    }

    res.redirect(errorUrl);
    return next();
});

/**
 * Zip-Cancel : The Zip-Cancel endpoint is used to cancel / fail zip order
 * @name Base/Zip-Cancel
 * @function
 * @param {serverfunction} - post
 */
server.post('Cancel', function (req, res, next) {
    if (ZipCheckoutSessionModel.hasZipOrder()) {
        ZipCheckoutSessionModel.failZipOrder();
    }

    var URLUtils = require('dw/web/URLUtils');
    var url = URLUtils.url('Checkout-Begin', 'stage', 'payment');

    var frm = req.form;
    var checkoutId = (!empty(frm.checkoutId)) ? frm.checkoutId : '';

    if (!empty(session.privacy.ZipCheckoutId) && checkoutId === session.privacy.ZipCheckoutId) {
        url = URLUtils.url('Checkout-Begin', 'stage', 'payment', 'error', 1);
    }

    res.json({
        redirectUrl: url.toString()
    });

    return next();
});

/**
 * Zip-Checkout : The Zip-Checkout endpoint is used to create zip order
 * @name Base/Zip-Checkout
 * @function
 * @param {serverfunction} - post
 */
server.post('Checkout', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var CreateCheckoutZipAPIRequest = require('*/cartridge/scripts/zip/api/request/createCheckout');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        return next();
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        return next();
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        return next();
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });
        return next();
    }

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    Transaction.wrap(function () {
        ZipCheckoutSessionModel.saveZipOrder(order);
    });

    try {
        var customerRawData = req.currentCustomer.raw;
        var customerProfile = customerRawData.getProfile();
        var customerTokenizationRequired = false;

        if (!empty(customerProfile) && customerRawData.authenticated && !empty(customerProfile.custom.ZipSaveToken) && customerProfile.custom.ZipSaveToken) {
            customerTokenizationRequired = true;
        }

        var createCheckoutAPIRequest = new CreateCheckoutZipAPIRequest(order, customerTokenizationRequired);
        var response = createCheckoutAPIRequest.execute();

        Transaction.wrap(function () {
            session.privacy.ZipCheckoutId = response.id;
        });

        res.json({
            id: response.id,
            uri: response.uri,
            redirectUri: response.uri
        });
    } catch (e) {
        dw.system.Logger.error(e.message + '\n\r' + e.stack);

        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        var zipErrorCode = null;

        if (e.name === 'ZipError') {
            zipErrorCode = e.message;
        }

        res.json({
            zipErrorCode: zipErrorCode,
            error: true
        });
    }

    return next();
});

module.exports = server.exports();
