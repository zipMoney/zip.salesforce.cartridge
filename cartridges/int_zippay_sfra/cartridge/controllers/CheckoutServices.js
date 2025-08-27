/* globals session, empty */
'use strict';

var page = module.superModule;
var server = require('server');
var TempateUtils = require('*/cartridge/scripts/util/template');
var zippayEnabled = TempateUtils.isZippayEnabled();

var ZipHelpers = require('*/cartridge/scripts/zip/helpers/zip');

server.extend(page);

/**
 * CheckoutServices-PlaceOrder : Append this method to clear zip session variable
 * @name Base/CheckoutServices-PlaceOrder
 * @function
 * @memberof CheckoutServices
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - append
 */
server.append(
    'PlaceOrder',
    function (req, res, next) {
        if (zippayEnabled && !empty(session.privacy.ZipErrorCode)) {
            var viewData = res.getViewData();

            viewData.zipError = session.privacy.ZipErrorCode;

            session.privacy.ZipErrorCode = null;

            res.json(viewData);
        }

        next();
    }
);

/**
 * CheckoutServices-SubmitPayment : Append this method to add zip params after submitting payment information
 * @name Base/CheckoutServices-SubmitPayment
 * @function
 * @memberof CheckoutServices
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - append
 */
server.append(
    'SubmitPayment',
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var BasketMgr = require('dw/order/BasketMgr');

        var viewData = res.viewData;

        if (zippayEnabled && empty(viewData.error) && !viewData.error) {
            var CustomerTokenInWalletModel = require('*/cartridge/models/zip/customerTokenInWallet');
            var PaymentMgr = require('dw/order/PaymentMgr');

            var params = request.httpParameterMap; // eslint-disable-line no-undef
            var saveZipParam = params.dwfrm_zip_saveZip;
            var saveZip = true;
            if (saveZipParam && saveZipParam.empty) {
                saveZip = false;
            }

            var hasZipToken = false;
            var customerRawData = req.currentCustomer.raw;
            var customerProfile = customerRawData.getProfile();
            var paymentMethodId = viewData.paymentMethod.value;
            var paymentMethod = PaymentMgr.getPaymentMethod(paymentMethodId);

            if (ZipHelpers.isTokenizationRequired(paymentMethod) && !empty(customerProfile) && customerRawData.authenticated) {
                var customerTokenInWalletModel = new CustomerTokenInWalletModel(customerProfile.getWallet());

                if (customerTokenInWalletModel.hasToken()) {
                    hasZipToken = true;
                }

                Transaction.wrap(function () {
                    customerProfile.custom.ZipSaveToken = saveZip;
                });
            }

            Transaction.wrap(function () {
                session.privacy.ZipPaymentMethodId = paymentMethodId;
                session.privacy.ZipSavePaymentMethod = saveZip;
            });

            Transaction.wrap(function () {
                var currentBasket = BasketMgr.getCurrentBasket();
                currentBasket.removeAllPaymentInstruments();
            });

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var viewDataInner = res.viewData;
                var currentBasket = BasketMgr.getCurrentBasket();
                var billingAddress = currentBasket.billingAddress;

                Transaction.wrap(function () {
                    var collections = require('*/cartridge/scripts/util/collections');

                    var paymentInstruments = currentBasket.getPaymentInstruments(paymentMethodId);
                    collections.forEach(paymentInstruments, function (paymentInstrument) {
                        paymentInstrument.custom.zipEmail = currentBasket.getCustomerEmail(); // eslint-disable-line no-param-reassign
                        paymentInstrument.custom.zipPhone = billingAddress.getPhone(); // eslint-disable-line no-param-reassign
                    });
                });

                if (empty(viewDataInner.customer)) {
                    viewDataInner.customer = {};
                }

                viewDataInner.customer.zip = {
                    hasZipToken: hasZipToken
                };
            });
        }

        return next();
    }
);

module.exports = server.exports();
