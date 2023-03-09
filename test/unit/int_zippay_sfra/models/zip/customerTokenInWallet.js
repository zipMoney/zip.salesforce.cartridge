'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var zipConfig = require('../../../../../cartridges/int_zippay_sfra/cartridge/config/config');

var createCustomerWithNoZipInWallet = function () {
    return {
        addressBook: {
            addresses: {},
            preferredAddress: {
                address1: '15 South Point Drive',
                address2: null,
                city: 'Boston',
                countryCode: {
                    displayValue: 'United States',
                    value: 'US'
                },
                firstName: 'John',
                lastName: 'Snow',
                ID: 'Home',
                postalCode: '02125',
                stateCode: 'MA'
            }
        },
        customer: {},
        profile: {
            firstName: 'John',
            lastName: 'Snow',
            email: 'jsnow@starks.com'
        },
        wallet: {
            getPaymentInstruments: function () {
                return [
                    {
                        creditCardExpirationMonth: '6',
                        creditCardExpirationYear: '2019',
                        maskedCreditCardNumber: '***********4215',
                        creditCardType: 'Master Card',
                        paymentMethod: 'CREDIT_CARD'
                    }
                ];
            }
        },
        raw: {
            authenticated: true,
            registered: true
        }
    };
};

var createCustomerWithZipInWallet = function () {
    return {
        addressBook: {
            addresses: {},
            preferredAddress: {
                address1: '15 South Point Drive',
                address2: null,
                city: 'Boston',
                countryCode: {
                    displayValue: 'United States',
                    value: 'US'
                },
                firstName: 'John',
                lastName: 'Snow',
                ID: 'Home',
                postalCode: '02125',
                stateCode: 'MA'
            }
        },
        customer: {},
        profile: {
            firstName: 'John',
            lastName: 'Snow',
            email: 'jsnow@starks.com'
        },
        wallet: {
            getPaymentInstruments: function () {
                return [
                    {
                        paymentMethod: zipConfig.ZIP_PROCESSOR,
                        custom: {
                            ZipToken: 'test1234567'
                        }
                    },
                    {
                        creditCardExpirationMonth: '6',
                        creditCardExpirationYear: '2019',
                        maskedCreditCardNumber: '***********4215',
                        creditCardType: 'Master Card',
                        paymentMethod: 'CREDIT_CARD'
                    }
                ];
            }
        },
        raw: {
            authenticated: true,
            registered: true
        }
    };
};

describe('customerTokenInWallet', function () {
    it('should find token already added in customer wallet', function () {
        var ZipCustomerTokenInWalletModel = proxyquire('../../../../../cartridges/int_zippay_sfra/cartridge/models/zip/customerTokenInWallet', {
            'dw/system/Transaction': {
                wrap: function (callback) {
                    callback.apply();
                }
            },
            '~/cartridge/config/config': require('../../../../../cartridges/int_zippay_sfra/cartridge/config/config')
        });

        var customer = createCustomerWithZipInWallet();
        var wallet = customer.wallet;

        var model = new ZipCustomerTokenInWalletModel(wallet);
        assert.equal(model.hasToken(), true);
        assert.equal(model.findToken(), 'test1234567');
    });

    it('should not find token removed from customer wallet ', function () {
        var ZipCustomerTokenInWalletModel = proxyquire('../../../../../cartridges/int_zippay_sfra/cartridge/models/zip/customerTokenInWallet', {
            'dw/system/Transaction': {
                wrap: function (callback) {
                    callback.apply();
                }
            },
            '~/cartridge/config/config': require('../../../../../cartridges/int_zippay_sfra/cartridge/config/config')
        });

        var customer = createCustomerWithNoZipInWallet();
        var wallet = customer.wallet;
        var model = new ZipCustomerTokenInWalletModel(wallet);

        assert.equal(model.findToken(), '');
        assert.equal(model.hasToken(), false);
    });
});
