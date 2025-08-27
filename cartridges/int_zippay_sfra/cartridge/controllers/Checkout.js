/* globals empty, session */

var server = require('server');
server.extend(module.superModule);

/**
 * Return selected payment method in the payment checkout stage.
 *
 * @returns {string} payment method id.
 */
function getCheckoutSelectedPaymentMethod() {
    var BasketMgr = require('dw/order/BasketMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var paymentInstruments = currentBasket.getPaymentInstruments();

    if (!paymentInstruments.length) {
        return null;
    }

    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstruments[0].paymentMethod);

    return paymentMethod;
}

/**
 * Checkout-Begin : Append this method to add zip params to customer profile
 * @name Base/Checkout-Begin
 * @function
 * @memberof Checkout
 * @param {renders} - isml
 * @param {serverfunction} - append
 */
server.append('Begin', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var TempateUtils = require('*/cartridge/scripts/util/template');
    var zippayEnabled = TempateUtils.isZippayEnabled();
    if (zippayEnabled) {
        var CustomerTokenInWalletModel = require('*/cartridge/models/zip/customerTokenInWallet');

        var viewData = res.getViewData();
        viewData.zipForm = server.forms.getForm('zip');
        viewData.zipError = req.querystring.error;

        viewData.hasZipToken = false;

        var saveZip = (!empty(session.privacy.ZipSavePaymentMethod)) ? session.privacy.ZipSavePaymentMethod : false;
        var customerRawData = req.currentCustomer.raw;
        var customerProfile = customerRawData.getProfile();

        if (saveZip && !empty(customerProfile) && customerRawData.authenticated) {
            var checkoutSelectedPaymentMethod = getCheckoutSelectedPaymentMethod();
            if (checkoutSelectedPaymentMethod) {
                var customerTokenInWalletModel = new CustomerTokenInWalletModel(customerProfile.getWallet());

                if (checkoutSelectedPaymentMethod && customerTokenInWalletModel.hasToken()) {
                    viewData.hasZipToken = true;
                }
            } else {
                Transaction.wrap(function () {
                    customerProfile.custom.ZipSaveToken = false;
                });
            }
        }
    }

    return next();
});

module.exports = server.exports();
