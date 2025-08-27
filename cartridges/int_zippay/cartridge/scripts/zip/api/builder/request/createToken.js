'use strict';

/**
 * Create Token Request Builder.
 */
function CreateToken() {
    this.authority = null;
}

CreateToken.prototype.setAuthority = function (authority) {
    this.authority = authority;
};

CreateToken.prototype.getAuthority = function () {
    return this.authority;
};

CreateToken.prototype.build = function () {
    return {
        authority: this.getAuthority().toArray()
    };
};

module.exports = CreateToken;
