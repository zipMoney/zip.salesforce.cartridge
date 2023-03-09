'use strict';

var Site = require('dw/system/Site');

function loadStorefrontCartridgeName () {
    var storefrontCartridge = Site.getCurrent().getCustomPreferenceValue('zipStorefrontCartridge');
    return storefrontCartridge;
}

module.exports.loadStorefrontCartridgeName = loadStorefrontCartridgeName;
