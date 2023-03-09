/* globals empty */
'use strict';

var AddressModel = require('*/cartridge/models/address');
var URLUtils = require('dw/web/URLUtils');
var config = require('~/cartridge/config/config');

/**
 * Whether customer has zip token saved.
 * @param {dw.customer.Customer} customerRaw Customer entity.
 * @returns {boolean} true, if the customer has zip token.
 */
function hasZipToken(customerRaw) {
    if (!customerRaw.profile) {
        return false;
    }

    var customerProfile = customerRaw.profile;
    var CustomerTokenInWalletModel = require('~/cartridge/models/zip/customerTokenInWallet');

    var customerHasToken = false;

    var customerTokenInWalletModel = new CustomerTokenInWalletModel(customerProfile.getWallet());

    if (customerTokenInWalletModel.hasToken()) {
        return true;
    }

    return customerHasToken;
}

/**
 * Creates a plain object that contains profile information
 * @param {Object} profile - current customer's profile
 * @returns {Object} an object that contains information about the current customer's profile
 */
function getProfile(profile) {
    var result;
    if (profile) {
        result = {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone,
            password: '********'
        };
    } else {
        result = null;
    }
    return result;
}

/**
 * Creates an array of plain object that contains address book addresses, if any exist
 * @param {dw.customer.Customer} addressBook - target customer
 * @returns {Array<Object>} an array of customer addresses
 */
function getAddresses(addressBook) {
    var result = [];
    if (addressBook) {
        for (var i = 0, ii = addressBook.addresses.length; i < ii; i++) {
            result.push(new AddressModel(addressBook.addresses[i]).address);
        }
    }

    return result;
}

/**
 * Creates a plain object that contains the customer's preferred address
 * @param {dw.customer.Customer} addressBook - target customer
 * @returns {Object} an object that contains information about current customer's preferred address
 */
function getPreferredAddress(addressBook) {
    var result = null;
    if (addressBook && addressBook.preferredAddress) {
        result = new AddressModel(addressBook.preferredAddress).address;
    }

    return result;
}

/**
 * Return the first payment instrument that isn't Zip.
 *
 * @param {dw.customer.Wallet} wallet Customer's wallet.
 * @returns {dw.customer.CustomerPaymentInstrument} payment instrument entity.
 */
function getFirstNonZipPaymentInstrument(wallet) {
    var paymentInstruments = wallet.paymentInstruments;

    for (var c = 0; c < paymentInstruments.length; c++) {
        var paymentInstrument = paymentInstruments[c].raw;

        if (paymentInstrument.paymentMethod !== config.ZIP_PROCESSOR) {
            return paymentInstruments[c];
        }
    }

    return null;
}

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} wallet - current customer's wallet
 * @returns {Object} object that contains info about the current customer's payment instrument
 */
function getPayment(wallet) {
    if (wallet) {
        var paymentInstrument = getFirstNonZipPaymentInstrument(wallet);

        if (paymentInstrument) {
            return {
                maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
                creditCardType: paymentInstrument.creditCardType,
                creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
                creditCardExpirationYear: paymentInstrument.creditCardExpirationYear
            };
        }
    }
    return null;
}

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} userPaymentInstruments - current customer's paymentInstruments
 * @returns {Object} object that contains info about the current customer's payment instruments
 */
function getCustomerPaymentInstruments(userPaymentInstruments) {
    var paymentInstruments;

    paymentInstruments = userPaymentInstruments.map(function (paymentInstrument) {
        var result = {};

        var rawPaymentInstrument = paymentInstrument.raw;

        if (rawPaymentInstrument.paymentMethod === config.ZIP_PROCESSOR) {
            result = {
                hasZipToken: (!empty(rawPaymentInstrument.custom.ZipToken))
            };
        } else {
            result = {
                creditCardHolder: paymentInstrument.creditCardHolder,
                maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
                creditCardType: paymentInstrument.creditCardType,
                creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
                creditCardExpirationYear: paymentInstrument.creditCardExpirationYear
            };

            result.cardTypeImage = {
                src: URLUtils.staticURL('/images/' +
                    paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, '') +
                    '-dark.svg'),
                alt: paymentInstrument.creditCardType
            };
        }

        result.paymentMethod = rawPaymentInstrument.paymentMethod;
        result.UUID = paymentInstrument.UUID;

        return result;
    });

    return paymentInstruments;
}

/**
 * Account class that represents the current customer's profile dashboard
 * @param {dw.customer.Customer} currentCustomer - Current customer
 * @param {Object} addressModel - The current customer's preferred address
 * @param {Object} orderModel - The current customer's order history
 * @constructor
 */
function account(currentCustomer, addressModel, orderModel) {
    this.profile = getProfile(currentCustomer.profile);
    this.addresses = getAddresses(currentCustomer.addressBook);
    this.preferredAddress = addressModel || getPreferredAddress(currentCustomer.addressBook);
    this.orderHistory = orderModel;
    this.payment = getPayment(currentCustomer.wallet);
    this.hasZipToken = hasZipToken(currentCustomer.raw);
    this.registeredUser = currentCustomer.raw.authenticated && currentCustomer.raw.registered;
    this.isExternallyAuthenticated = currentCustomer.raw.externallyAuthenticated;
    this.customerPaymentInstruments = currentCustomer.wallet
        && currentCustomer.wallet.paymentInstruments
        ? getCustomerPaymentInstruments(currentCustomer.wallet.paymentInstruments)
        : null;
}

account.getCustomerPaymentInstruments = getCustomerPaymentInstruments;

module.exports = account;
