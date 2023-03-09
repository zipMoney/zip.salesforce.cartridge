'use strict';

/**
 * Capture charge Request Builder.
 */
function CaptureCharge() {
    this.chargeId = 0;
    this.isPartialCapture = false;
}

CaptureCharge.prototype.setChargeId = function (chargeId) {
    this.chargeId = chargeId;

    return this;
};

CaptureCharge.prototype.getChargeId = function () {
    return this.chargeId;
};

CaptureCharge.prototype.setIsPartialCapture = function (isPartialCapture) {
    this.isPartialCapture = isPartialCapture;

    return this;
};

CaptureCharge.prototype.build = function (amount) {
    return {
        amount: parseFloat(amount),
        is_partial_capture: this.isPartialCapture
    };
};

module.exports = CaptureCharge;
