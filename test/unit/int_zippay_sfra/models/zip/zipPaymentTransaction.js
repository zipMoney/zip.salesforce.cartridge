'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var MockedMoney = require('../../../../mocks/dw/value/Money');

var MockedPaymentTransaction = require('../../../../mocks/dw/order/PaymentTransaction');

describe('zipPaymentTransaction', function () {
    var ZipPaymentTransactionModel = proxyquire('../../../../../cartridges/int_zippay_sfra/cartridge/models/zip/zipPaymentTransaction', {
        'dw/order/PaymentTransaction': {
            TYPE_CAPTURE: 'CAPTURE',
            TYPE_AUTH: 'AUTH'
        },
        'dw/value/Money': MockedMoney
    });

    it('should update upon Zip charge authorization', function () {
        var mockedPaymentTransaction = new MockedPaymentTransaction();
        mockedPaymentTransaction.setAmount(new MockedMoney(true, 15.35));
        var zipReceiptNumber = 'someReceiptNumber';
        var chargeResult = {
            id: 'testId',
            receipt_number: zipReceiptNumber,
            amount: 15.35
        };

        ZipPaymentTransactionModel.reflectChargeAuthorized(mockedPaymentTransaction, chargeResult, true);

        assert.equal(mockedPaymentTransaction.type, 'CAPTURE');
        assert.equal(mockedPaymentTransaction.amount.value, 15.35);
        assert.equal(mockedPaymentTransaction.custom.isZipAutoCapture, true);
        assert.equal(mockedPaymentTransaction.custom.ZipChargeId, 'testId');
        assert.equal(mockedPaymentTransaction.custom.ZipReceiptNumber, zipReceiptNumber);
    });

    it('should update payment transaction upon amount captured', function () {
        var mockedPaymentTransaction = new MockedPaymentTransaction();

        ZipPaymentTransactionModel.reflectCapture(mockedPaymentTransaction);

        assert.equal(mockedPaymentTransaction.type, 'CAPTURE');
    });
});
