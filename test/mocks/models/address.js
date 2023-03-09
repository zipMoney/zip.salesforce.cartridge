'use strict';

var createOrderAddress = function () {
    return {
        address1: '1 Drury Lane',
        address2: null,
        countryCode: {
            displayValue: 'United States',
            value: 'US'
        },
        firstName: 'The Muffin',
        lastName: 'Man',
        city: 'Far Far Away',
        phone: '333-333-3333',
        postalCode: '04330',
        stateCode: 'ME'
    };
};

function mockAddress() {
    this.address = createOrderAddress();
}

module.exports = mockAddress;
