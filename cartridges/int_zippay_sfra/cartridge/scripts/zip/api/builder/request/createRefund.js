'use strict';

/**
 * Create Refund Request Builder.
 */
function CreateRefund() {}

CreateRefund.prototype.build = function (chargeId, reason, amount) {
    return {
        charge_id: chargeId,
        reason: reason,
        amount: amount
    };
};

module.exports = CreateRefund;
