'use strict';

/**
 * Create Cancel Charge Request Builder.
 */
function CreateCancel() {}

CreateCancel.prototype.build = function (chargeId) {
    return {
        chargeId: chargeId
    };
};

module.exports = CreateCancel;
