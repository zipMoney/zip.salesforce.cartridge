'use strict';

var TaxMgr = require('dw/order/TaxMgr');

/**
 * Check if site's taxation policy is Net.
 *
 * @returns {bool} true, if Net; false - otherwise (Gross).
 */
function isTaxationPolicyNet() {
    return (TaxMgr.getTaxationPolicy() === TaxMgr.TAX_POLICY_NET);
}

module.exports = isTaxationPolicyNet;
