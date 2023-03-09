'use strict';

/**
 * Authority model
 *
 * @param {string} type authority type
 * @param {string} value authority value
 */
function Authority(type, value) {
    this.type = type;
    this.value = value;
}

Authority.prototype.toArray = function () {
    return {
        type: this.type,
        value: this.value
    };
};

module.exports = Authority;