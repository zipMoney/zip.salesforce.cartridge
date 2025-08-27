'use strict';

var page = module.superModule; // inherits functionality
var server = require('server');

server.extend(page);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

/**
 * PaymentInstruments-DeletePayment : Append this method to remove zip save token param from customer profile
 * @name Base/PaymentInstruments-DeletePayment
 * @function
 * @memberof PaymentInstruments
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - append
 */
server.append('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var viewData = res.getViewData();
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');

    if (viewData.raw && viewData.raw.paymentMethod === 'Zip') {
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var customerProfile = customer.getProfile();
        Transaction.wrap(function () {
            customerProfile.custom.ZipSaveToken = false;
        });
    }
    return next();
});

module.exports = server.exports();
