'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var createMockedOrder = function (value) {
    return {
        custom: {
            ZipCapturedAmount: 0.0,
            ZipRefundedAmount: 0.0,
            ZipReceiptNumber: ''
        },
        status: '',
        paymentStatus: '',
        setPaymentStatus: function (status) {
            this.paymentStatus = status;
        },
        getPaymentStatus: function () {
            return {
                getValue: function () {
                    return this.paymentStatus;
                }
            };
        },
        setStatus: function (status) {
            this.status = status;
        },
        getStatus: function () {
            return {
                getValue: function () {
                    return this.status;
                }
            };
        },
        getPaymentInstruments: function () {
            return [
                {
                    getPaymentTransaction: function () {
                        return {
                            getAmount: function () {
                                return {
                                    getValue: function () {
                                        return value;
                                    }
                                };
                            }
                        };
                    }
                }
            ];
        },
        getPaymentTransaction: function () {
            return {
                getAmount: function () {
                    return {
                        getValue: function () {
                            return value;
                        }
                    };
                }
            };
        },
        getTotalGrossPrice: function () {
            return {
                getValue: function () {
                    return value;
                }
            };
        }
    };
};

describe('zipOrder', function () {
    it('should update order upon cancellation', function () {
        var mockedOrder = createMockedOrder(15.35);

        var ZipHelpers = require('../../../../mocks/scripts/zip/helpers/zip');
        var ZipPaymentTransactionModel = require('../../../../mocks/models/zip/zipPaymentTransaction');
        var ZipOrderModel = proxyquire('../../../../../cartridges/int_zippay_sfra/cartridge/models/zip/zipOrder', {
            '~/cartridge/models/zip/zipPaymentTransaction': ZipPaymentTransactionModel,
            '~/cartridge/scripts/zip/helpers/zip': ZipHelpers
        });

        ZipOrderModel.reflectCancel(mockedOrder);

        assert.equal(mockedOrder.getPaymentStatus().getValue(), mockedOrder.PAYMENT_STATUS_NOTPAID);
        assert.equal(mockedOrder.getStatus().getValue(), mockedOrder.ORDER_STATUS_CANCELLED);
    });

    it('should update Zip refunded amount of order upon refund', function () {
        var mockedOrder = createMockedOrder(15.35);

        var ZipHelpers = require('../../../../mocks/scripts/zip/helpers/zip');
        var ZipPaymentTransactionModel = require('../../../../mocks/models/zip/zipPaymentTransaction');
        var ZipOrderModel = proxyquire('../../../../../cartridges/int_zippay_sfra/cartridge/models/zip/zipOrder', {
            '~/cartridge/models/zip/zipPaymentTransaction': ZipPaymentTransactionModel,
            '~/cartridge/scripts/zip/helpers/zip': ZipHelpers
        });

        ZipOrderModel.reflectRefund(mockedOrder, 10.35);

        assert.equal(ZipOrderModel.getZipRefundedAmount(mockedOrder), 10.35);
    });

    it('should update Zip captured amount of an order upon capture', function () {
        var mockedOrder = createMockedOrder(50.00);

        var ZipHelpers = require('../../../../mocks/scripts/zip/helpers/zip');
        var ZipPaymentTransactionModel = require('../../../../mocks/models/zip/zipPaymentTransaction');
        var ZipOrderModel = proxyquire('../../../../../cartridges/int_zippay_sfra/cartridge/models/zip/zipOrder', {
            '~/cartridge/models/zip/zipPaymentTransaction': ZipPaymentTransactionModel,
            '~/cartridge/scripts/zip/helpers/zip': ZipHelpers
        });

        ZipOrderModel.reflectCapture(mockedOrder, 10.35);

        assert.equal(ZipOrderModel.getZipCapturedAmount(mockedOrder), 10.35);
    });

    it('should mark Zip order as paid when a capture with total amount is made', function () {
        var ZipHelpers = require('../../../../mocks/scripts/zip/helpers/zip');
        var ZipPaymentTransactionModel = require('../../../../mocks/models/zip/zipPaymentTransaction');
        var ZipOrderModel = proxyquire('../../../../../cartridges/int_zippay_sfra/cartridge/models/zip/zipOrder', {
            '~/cartridge/models/zip/zipPaymentTransaction': ZipPaymentTransactionModel,
            '~/cartridge/scripts/zip/helpers/zip': ZipHelpers
        });

        var mockedOrder = createMockedOrder(46.05);
        ZipOrderModel.reflectCapture(mockedOrder, 46.05);

        assert.equal(ZipOrderModel.getZipCapturedAmount(mockedOrder), 46.05);
        assert.equal(ZipOrderModel.getAmountNotCapturedYet(mockedOrder), 0);
        assert.equal(ZipOrderModel.isFullyPaid(mockedOrder), true);
    });

    it('should mark Zip order as paid when multiple captures result in full amount capture', function () {
        var ZipHelpers = require('../../../../mocks/scripts/zip/helpers/zip');
        var ZipPaymentTransactionModel = require('../../../../mocks/models/zip/zipPaymentTransaction');
        var ZipOrderModel = proxyquire('../../../../../cartridges/int_zippay_sfra/cartridge/models/zip/zipOrder', {
            '~/cartridge/models/zip/zipPaymentTransaction': ZipPaymentTransactionModel,
            '~/cartridge/scripts/zip/helpers/zip': ZipHelpers
        });

        var mockedOrder = createMockedOrder(46.05);
        ZipOrderModel.reflectCapture(mockedOrder, 15.35);
        ZipOrderModel.reflectCapture(mockedOrder, 15.35);
        ZipOrderModel.reflectCapture(mockedOrder, 15.35);

        assert.equal(ZipOrderModel.getZipCapturedAmount(mockedOrder), 46.05);
        assert.equal(ZipOrderModel.getAmountNotCapturedYet(mockedOrder), 0);
        assert.equal(ZipOrderModel.isFullyPaid(mockedOrder), true);
    });

    it('should update order and payment transaction upon charge authorization', function () {
        var autoCapture = true;
        var zipReceiptNumber = '123456';
        var chargeResult = {
            id: 'testId',
            receipt_number: zipReceiptNumber,
            amount: 15.35
        };
        var mockedOrder = createMockedOrder(50.00);

        var ZipHelpers = require('../../../../mocks/scripts/zip/helpers/zip');
        var MockedZipPaymentTransactionModel = require('../../../../mocks/models/zip/zipPaymentTransaction');
        var ZipOrderModel = proxyquire('../../../../../cartridges/int_zippay_sfra/cartridge/models/zip/zipOrder', {
            '~/cartridge/models/zip/zipPaymentTransaction': MockedZipPaymentTransactionModel,
            '~/cartridge/scripts/zip/helpers/zip': ZipHelpers
        });

        ZipOrderModel.reflectChargeAuthorized(mockedOrder, mockedOrder.getPaymentTransaction(), chargeResult, autoCapture);

        assert.equal(ZipOrderModel.getZipReceiptNumber(mockedOrder), zipReceiptNumber);
    });
});
