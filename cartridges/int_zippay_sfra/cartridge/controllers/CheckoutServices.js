/* globals session, empty */
'use strict';

var page = module.superModule;
var server = require('server');

var ZipHelpers = require('~/cartridge/scripts/zip/helpers/zip');

server.extend(page);

server.append(
    'PlaceOrder',
    function (req, res, next) {
        if (!empty(session.privacy.ZipErrorCode)) {
            var viewData = res.getViewData();

            viewData.zipError = session.privacy.ZipErrorCode;

            session.privacy.ZipErrorCode = null;

            res.json(viewData);
        }

        next();
    }
);

server.append(
    'SubmitPayment',
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var BasketMgr = require('dw/order/BasketMgr');

        var viewData = res.viewData;

        if (empty(viewData.error) && !viewData.error && ZipHelpers.isPaymentMethodZip(viewData.paymentMethod.value)) {
            var CustomerTokenInWalletModel = require('~/cartridge/models/zip/customerTokenInWallet');
            var PaymentMgr = require('dw/order/PaymentMgr');

            var zipForm = server.forms.getForm('zip');

            var saveZip = zipForm.saveZip.selected;
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
                	collections.forEach(paymentInstruments, function(paymentInstrument){
                		paymentInstrument.custom.zipEmail = currentBasket.getCustomerEmail();
                		paymentInstrument.custom.zipPhone = billingAddress.getPhone();
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
