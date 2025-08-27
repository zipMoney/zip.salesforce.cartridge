'use strict';

var Site = require('dw/system/Site');

/**
 * Retrieves zip storefront cartridge name.
 *
 * @returns {string} zip storefront cartridge name.
 */
function loadStorefrontCartridgeName () {
    var storefrontCartridge = Site.getCurrent().getCustomPreferenceValue('zipStorefrontCartridge');
    return storefrontCartridge;
}

module.exports.loadStorefrontCartridgeName = loadStorefrontCartridgeName;
