/* globals dw, session, empty, request, response, customer */

'use strict';

var loadPreference = require('~/cartridge/scripts/zipMoney/util/loadPreferences');
var storefrontCartridgeName = loadPreference.loadStorefrontCartridgeName();

var guard = require(storefrontCartridgeName + '/cartridge/scripts/guard');
var app = require(storefrontCartridgeName + '/cartridge/scripts/app');

var ZipCheckoutSessionModel = require('*/cartridge/scripts/zip/helpers/checkoutSession');

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
 * Zip landing page.
 */
function landing () {
    var rootFolder = require('dw/content/ContentMgr').getSiteLibrary().root;
    require(storefrontCartridgeName + '/cartridge/scripts/meta').update(rootFolder);
    app.getView().render('zipMoney/landing.isml');
}

/**
 * Setting recoverable error name and message.
 */
function RecoverableError (message) {
    this.message = message;
    this.name = 'RecoverableError';
}

/**
 * Handling zip result approved.
 */
function handleZipResultApproved (order, checkoutId) {
    var Transaction = require('dw/system/Transaction');
    var Order = app.getModel('Order');
    var checkoutHelpers = require('~/cartridge/scripts/zipMoney/checkoutHelpers');
    var saveToken = require('*/cartridge/scripts/zip/saveToken');

    try {
        saveToken(order, checkoutId);
    } catch (e) {
        dw.system.Logger.error(e.message + '\n\r' + e.stack);

        failZipSessionOrder();

        throw new RecoverableError("Save token error.");
    }

    var handlePaymentsResult = checkoutHelpers.handlePayments(order);

    if (handlePaymentsResult.error || handlePaymentsResult.missingPaymentInfo) {
        Transaction.wrap(function () {
            failZipSessionOrder();
        });

        throw new RecoverableError("Payment handle error.");
    }

    var orderPlacementStatus = Order.submit(order);
    if (orderPlacementStatus.error) {
        failZipSessionOrder();

        throw new RecoverableError("Error occurred while trying to place order (Zip Result: approved).");
    } else {
        // Clears all forms used in the checkout process.
        session.forms.singleshipping.clearFormElement();
        session.forms.multishipping.clearFormElement();
        session.forms.billing.clearFormElement();
    }

    ZipCheckoutSessionModel.removeZipOrder();
    Transaction.wrap(function () { session.privacy.ZipCheckoutId = null; });
}

/**
 * Redirects to corresponding page from zip hosted page.
 */
// eslint-disable-next-line complexity
function redirect () {
    var URLUtils = require('dw/web/URLUtils');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var RetrieveCheckoutZipAPIRequest = require('*/cartridge/scripts/zip/api/request/retrieveCheckout');

    var result = request.httpParameterMap.result.value;
    var checkoutId = request.httpParameterMap.checkoutId.value;

    // url for order processing errors
    var failUrl = URLUtils.https('COSummary-Start');

    // url for zip declines
    var checkoutUrl = URLUtils.https('COBilling-Start');

    // url for user cancellation
    var cancelUrl = failUrl;

    // url for general checkout payment redirects (decline/referal)
    var declineUrl = checkoutUrl;

    // url for general errors
    var errorUrl = URLUtils.https('Cart-Show');
    if (!empty(session.privacy.ZipCheckoutId) && checkoutId !== session.privacy.ZipCheckoutId) {
        failZipSessionOrder();
        response.redirect(checkoutUrl);
        return;
    }

    try {
        var retrieveCheckoutAPIRequest = new RetrieveCheckoutZipAPIRequest();
        var retrieveCheckoutResponseData = retrieveCheckoutAPIRequest.execute(checkoutId);

        var orderId = retrieveCheckoutResponseData.order.reference;
        var order = OrderMgr.getOrder(orderId);

        if (!order || order.getStatus().value !== order.ORDER_STATUS_CREATED) {
            failZipSessionOrder();
            //Redirect to basket page on approval from referral flow email
            if (order.custom.zipRequireApproval) {
                Transaction.wrap(function () { order.custom.zipRequireApproval = false; });
                //response.redirect(errorUrl);
                throw new Error("Order not created.");
            }
            Transaction.wrap(function () {
                session.privacy.zipMoneyCancelled = true;
            });

            response.redirect(failUrl);
            throw new Error("Order not found.");
        }

        Transaction.wrap(function () {
            order.custom.ZipCheckoutId = checkoutId;
        });

        if (result === 'cancelled') {
            failZipSessionOrder();
            Transaction.wrap(function () {
                session.privacy.zipMoneyCancelled = true;
            });

            response.redirect(cancelUrl);
        } else if (result === 'declined') {
            failZipSessionOrder();
            Transaction.wrap(function () {
                session.privacy.zipMoneyDeclined = true;
            });

            response.redirect(declineUrl);
        } else if (result === 'approved') {
                handleZipResultApproved(order, checkoutId);
                session.privacy.OrderNo = order.orderNo;
                response.redirect(URLUtils.url('Zip-ShowConfirmation'));
        } else if (result === 'referred') {
            failZipSessionOrder();

             Transaction.wrap(function () {
                 session.privacy.zipMoneyCancelled = true;
                 session.privacy.zipMoneyReferred = true;
                 order.custom.zipRequireApproval = true;
             });
             response.redirect(cancelUrl);

        } else {
            throw new Error("Invalid Zip redirect result: " + result);
        }
    } catch (e) {
        failZipSessionOrder();

        switch (e.name) {
            case 'Error':
                // fatal error, back to Cart
                response.redirect(errorUrl);
                break;
            case 'RecoverableError':
                // recoverable error, back to COSUmmary
                response.redirect(failUrl);
                break;
        }
    }
}

/**
 * Show order confirmation page.
 */
function showConfirmation () {
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');

    var orderId = session.privacy.OrderNo;
    if (orderId) {
        var order = OrderMgr.getOrder(orderId);
        delete session.privacy.OrderNo;

        if (!customer.authenticated) {
            // Initializes the account creation form for guest checkouts by populating the first and last name with the
            // used billing address.
            var customerForm = app.getForm('profile.customer');
            customerForm.setValue('firstname', order.billingAddress.firstName);
            customerForm.setValue('lastname', order.billingAddress.lastName);
            customerForm.setValue('email', order.customerEmail);
            customerForm.setValue('orderNo', order.orderNo);
            customerForm.setValue('orderUUID', order.getUUID());
        }

        app.getForm('profile.login.passwordconfirm').clear();
        app.getForm('profile.login.password').clear();

        var pageMeta = require(storefrontCartridgeName + '/cartridge/scripts/meta');
        pageMeta.update({pageTitle: Resource.msg('confirmation.meta.pagetitle', 'checkout', 'SiteGenesis Checkout Confirmation')});
        app.getView({
            zipReceipt: order.custom.ZipReceiptNumber,
            Order: order,
            ContinueURL: URLUtils.https('Account-RegistrationForm') // needed by registration form after anonymous checkouts
        }).render('checkout/confirmation/confirmation');
    } else {
        var cart = app.getModel('Cart').get();
        if (!cart) {
            response.redirect(URLUtils.https('Cart-Show'));
            return;
        }
    }
}

/**
 * Redirect url for zip declines
 */
function cancel () {
    if (ZipCheckoutSessionModel.hasZipOrder()) {
        ZipCheckoutSessionModel.failZipOrder();
    }

    var URLUtils = require('dw/web/URLUtils');
    // url for zip declines
    var url = URLUtils.https('COBilling-Start');
    var Transaction = require('dw/system/Transaction');
    var response = require(storefrontCartridgeName + '/cartridge/scripts/util/Response');
    var checkoutId = request.httpParameterMap.checkoutId.value;

    if (!empty(session.privacy.ZipCheckoutId) && checkoutId === session.privacy.ZipCheckoutId) {
        Transaction.wrap(function () {
            session.privacy.zipMoneyDeclined = true;
        });
    }

    response.renderJSON({
        redirectUrl: url.toString()
    });
}

/**
 * Save zip token to customer profile.
 */
function handleBilling (paymentMethodId) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Transaction = require('dw/system/Transaction');
    var ZipModel = require('*/cartridge/scripts/zip/helpers/zip');

    var map = request.httpParameterMap;
    var saveZipParam = map.dwfrm_zip_saveZip;
    var saveZipParamValue = (saveZipParam.empty) ? false : true;
    var saveToken = false;

    var customerProfile = customer.getProfile();

    if (empty(customerProfile) || !customer.authenticated) {
        return;
    }

    var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);

    if (ZipModel.isTokenizationRequired(paymentMethod)) {
        saveToken = ((saveZipParamValue) ? true : false);
    }

    Transaction.wrap(function () {
        customerProfile.custom.ZipSaveToken = saveToken;
        session.privacy.zipMoneyCancelled = false;
    });

}

/**
 * Remove zip token from customer wallet.
 */
function removeToken () {
    var Transaction = require('dw/system/Transaction');
    var CustomerTokenInWalletModel = require('*/cartridge/models/zip/customerTokenInWallet');

    if (customer.authenticated) {
        Transaction.wrap(function() {
            var customerProfile = customer.getProfile();
            var customerTokenInWalletModel = new CustomerTokenInWalletModel(customerProfile.getWallet());
            customerTokenInWalletModel.removeToken();
            customerProfile.custom.ZipSaveToken = false;
        });
    }
}

function checkout () {
    var Transaction = require('dw/system/Transaction');
    var Cart = app.getModel('Cart');
    var COBilling = require(storefrontCartridgeName + '/cartridge/controllers/COBilling');
    var COShipping = require(storefrontCartridgeName + '/cartridge/controllers/COShipping');
    var CreateCheckoutZipAPIRequest = require('*/cartridge/scripts/zip/api/request/createCheckout');
    var OrderMgr = require('dw/order/OrderMgr');
    var ZipOrderModel = require('*/cartridge/models/zip/zipOrder');
    var response = require(storefrontCartridgeName + '/cartridge/scripts/util/Response');

    var cart = Cart.get();

    if (!cart) {
        response.renderJSON({});
        return;
    }

    // Clean shipments.
    COShipping.PrepareShipments(cart);

    // Make sure there is a valid shipping address, accounting for gift certificates that do not have one.
    if (cart.getProductLineItems().size() > 0 && cart.getDefaultShipment().getShippingAddress() === null) {
        response.renderJSON({});
        return;
    }

    // Make sure the billing step is fulfilled, otherwise restart checkout.
    if (!session.forms.billing.fulfilled.value) {
        response.renderJSON({});
        return;
    }

    Transaction.wrap(function () {
        cart.calculate();
    });

    var paymentValid = true;

    Transaction.wrap(function () {
        paymentValid = COBilling.ValidatePayment(cart);
    });

    if (!paymentValid) {
        response.renderJSON({});
        return;
    }

    var hasTransactionTotal = 0;

    // Recalculate the payments. If there is only gift certificates, make sure it covers the order total, if not
    // back to billing page.
    Transaction.wrap(function () {
        hasTransactionTotal = cart.calculatePaymentTransactionTotal();
    });

    if (!hasTransactionTotal) {
        response.renderJSON({});
        return;
    }

    // Creates a new order. This will internally ReserveInventoryForOrder and will create a new Order with status
    // 'Created'.
    var order = cart.createOrder();

    if (!order) {
        response.renderJSON({});
        return;
    }

    var paymentMethodId = ZipOrderModel.getZipPaymentMethodId(order);

    Transaction.wrap(function () {
        ZipCheckoutSessionModel.saveZipOrder(order);

        session.privacy.ZipPaymentMethodId = paymentMethodId;
    });

    try {
        var customerProfile = customer.getProfile();
        var customerTokenizationRequired = false;

        if (!empty(customerProfile) && customer.authenticated && !empty(customerProfile.custom.ZipSaveToken) && customerProfile.custom.ZipSaveToken) {
            customerTokenizationRequired = true;
        }

        var createCheckoutAPIRequest = new CreateCheckoutZipAPIRequest(order, customerTokenizationRequired);
        var apiResponse = createCheckoutAPIRequest.execute();

        Transaction.wrap(function () {
            session.privacy.ZipCheckoutId = apiResponse.id;
        });

        response.renderJSON({
            id: apiResponse.id,
            uri: apiResponse.uri,
            redirectUri: apiResponse.uri
        });
        return;

    } catch (e) {
        dw.system.Logger.error(e.message + '\n\r' + e.stack);

        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        var zipErrorCode = null;

        if (e.name === 'ZipError') {
            zipErrorCode = e.message;
        }

        response.renderJSON({
            zipErrorCode: zipErrorCode,
            error: true
        });
    }
}

/**
 * @public
 * @function
 * @description Clears the form element for the currently selected payment method and removes the other payment methods.
 *
 * @return {Boolean} Returns true if payment is successfully reset. Returns false if the currently selected payment
 * method is bml and the ssn cannot be validated.
 */
function resetPaymentForms() {
    var Transaction = require('dw/system/Transaction');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var URLUtils = require('dw/web/URLUtils');
    var zipPaymentMethods = require("*/cartridge/config/config").ZIP_PAYMENT_METHODS;

    var cart = app.getModel('Cart').get();

    if (!cart) {
        response.redirect(URLUtils.https('Cart-Show'));
        return;
    }

    var status = Transaction.wrap(function () {
        if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals('PayPal')) {
            app.getForm('billing').object.paymentMethods.creditCard.clearFormElement();
            app.getForm('billing').object.paymentMethods.bml.clearFormElement();

            cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD));
            cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_BML));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.zip));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.quadpay));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.payflex));
        } else if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
            app.getForm('billing').object.paymentMethods.bml.clearFormElement();

            cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_BML));
            cart.removePaymentInstruments(cart.getPaymentInstruments('PayPal'));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.zip));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.quadpay));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.payflex));
        } else if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(PaymentInstrument.METHOD_BML)) {
            app.getForm('billing').object.paymentMethods.creditCard.clearFormElement();

            if (!app.getForm('billing').object.paymentMethods.bml.ssn.valid) {
                return false;
            }

            cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD));
            cart.removePaymentInstruments(cart.getPaymentInstruments('PayPal'));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.zip));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.quadpay));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.payflex));
        } else if (app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(zipPaymentMethods.zip) || app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(zipPaymentMethods.quadpay) || app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value.equals(zipPaymentMethods.payflex)) {
            app.getForm('billing').object.paymentMethods.creditCard.clearFormElement();
            app.getForm('billing').object.paymentMethods.bml.clearFormElement();

            cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD));
            cart.removePaymentInstruments(cart.getPaymentInstruments(PaymentInstrument.METHOD_BML));
            cart.removePaymentInstruments(cart.getPaymentInstruments('PayPal'));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.zip));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.quadpay));
            cart.removePaymentInstruments(cart.getPaymentInstruments(zipPaymentMethods.payflex));
        }
        return true;
    });

    return status;
}

exports.Landing = guard.ensure(['get', 'https'], landing);
exports.Redirect = guard.ensure(['get', 'https'], redirect);
exports.Cancel = guard.ensure(['post', 'https'], cancel);
exports.RemoveToken = guard.ensure(['post', 'https'], removeToken);
exports.Checkout = guard.ensure(['post', 'https'], checkout);
exports.ShowConfirmation = guard.ensure(['get'], showConfirmation);
exports.ResetPaymentForms = resetPaymentForms;
exports.handleBilling = handleBilling;
