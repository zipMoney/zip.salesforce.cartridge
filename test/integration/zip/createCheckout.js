var assert = require('chai').assert;
var chaiSubset = require('chai-subset');
var chai = require('chai');
chai.use(chaiSubset);

var request = require('request-promise');
var config = require('../it.config');

describe('Create Checkout', function () {
    var cookieJar = request.jar();

    var csrfGenerateRequest = {
        url: config.baseUrl + '/CSRF-Generate',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        form: {},
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    var addProductToCartRequest = {
        url: config.baseUrl + '/Cart-AddProduct',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        form: {
            pid: '701644329402M',
            quantity: 1,
            options: []
        },
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    var updateShippingRequest = {
        url: config.baseUrl + '/CheckoutShippingServices-SubmitShipping',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        form: {
            originalShipmentUUID: '',
            shipmentUUID: '',
            shipmentSelector: 'new',
            dwfrm_shipping_shippingAddress_addressFields_firstName: 'Hannah',
            dwfrm_shipping_shippingAddress_addressFields_lastName: 'Hollinworth',
            dwfrm_shipping_shippingAddress_addressFields_address1: '39 Farrar Parade',
            dwfrm_shipping_shippingAddress_addressFields_address2: '',
            dwfrm_shipping_shippingAddress_addressFields_country: 'AU',
            dwfrm_shipping_shippingAddress_addressFields_states_stateCode: 'OTHER',
            dwfrm_shipping_shippingAddress_addressFields_city: 'Waddington',
            dwfrm_shipping_shippingAddress_addressFields_postalCode: '5280',
            dwfrm_shipping_shippingAddress_addressFields_phone: '(08) 8794 8066',
            dwfrm_shipping_shippingAddress_shippingMethodID: 'AUD001',
            dwfrm_shipping_shippingAddress_giftMessage: ''

        },
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    var submitPaymentRequest = {
        url: config.baseUrl + '/CheckoutServices-SubmitPayment',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        form: {
            addressSelector: '0f908cc8c6eff4d33ffc225b4e',
            shipmentUUID: '',
            shipmentSelector: 'new',
            dwfrm_billing_addressFields_firstName: 'Hannah',
            dwfrm_billing_addressFields_lastName: 'Hollinworth',
            dwfrm_billing_addressFields_address1: '39 Farrar Parade',
            dwfrm_billing_addressFields_address2: '',
            dwfrm_billing_addressFields_country: 'AU',
            dwfrm_billing_addressFields_states_stateCode: 'OTHER',
            dwfrm_billing_addressFields_city: 'Waddington',
            dwfrm_billing_addressFields_postalCode: '5280',
            dwfrm_billing_contactInfoFields_email: 'ivan.zanev@tryzens.com',
            dwfrm_billing_contactInfoFields_phone: '(08) 8794 8066',
            dwfrm_shipping_shippingAddress_giftMessage: '',
            dwfrm_billing_paymentMethod: 'Zip'
        },
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }

    };

    var zipCheckoutRequest = {
        url: config.baseUrl + '/Zip-Checkout',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        jar: cookieJar
    };

    var csrfJsonResponse = {};

    it('should create a new Zip checkout experience', function () {
        this.timeout(30000);

        return request(addProductToCartRequest)
        .then(function (response) {
            assert.equal(response.statusCode, 200, 'Expected POST Cart-AddProduct call statusCode to be 200.');

            var nextRequest = csrfGenerateRequest;

            var cookieString = cookieJar.getCookieString(addProductToCartRequest.url);
            var cookie = request.cookie(cookieString);
            cookieJar.setCookie(cookie, addProductToCartRequest.url);
            // step2 : get cookies, Generate CSRF, then set cookies
            return request(nextRequest);
        })
        .then(function (response) {
            assert.equal(response.statusCode, 200, 'Expected POST CSRF-Generate call statusCode to be 200.');

            var nextRequest = updateShippingRequest;

            csrfJsonResponse = JSON.parse(response.body);
            // step3 : submit billing request with token aquired in step 2
            nextRequest.url += '?' +
                csrfJsonResponse.csrf.tokenName + '=' +
                csrfJsonResponse.csrf.token;

            return request(nextRequest);
        })
        .then(function (response) {
            assert.equal(response.statusCode, 200, 'Expected POST CheckoutShippingServices-SubmitShipping call statusCode to be 200.');

            var nextRequest = submitPaymentRequest;

            nextRequest.url += '?' +
                csrfJsonResponse.csrf.tokenName + '=' +
                csrfJsonResponse.csrf.token;

            return request(nextRequest);
        })
        .then(function (response) {
            assert.equal(response.statusCode, 200, 'Expected POST CheckoutServices-SubmitPayment call statusCode to be 200.');

            var nextRequest = zipCheckoutRequest;

            nextRequest.url += '?' +
                csrfJsonResponse.csrf.tokenName + '=' +
                csrfJsonResponse.csrf.token;

            return request(nextRequest).then(function (zipCheckoutResponse) {
                assert.equal(response.statusCode, 200, 'Expected POST Zip-Checkout call statusCode to be 200.');

                var zipCheckoutResponseData = JSON.parse(zipCheckoutResponse);

                assert.isNotNull(zipCheckoutResponseData.id);
                assert.isString(zipCheckoutResponseData.uri);
                assert.isString(zipCheckoutResponseData.redirectUri);
            });
        });
    });
});
