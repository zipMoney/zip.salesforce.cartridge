/* globals empty */
'use strict';

var URLUtils = require('dw/web/URLUtils');

/**
 * Return product image Url.
 *
 * @param {dw.order.Product} product Product
 * @param {viewType} viewType view type
 * @returns {string} image url.
 */
function getProductImageUrl(product, viewType) {
    var productImage = product.getImage(viewType);
    var imageURL = URLUtils.absStatic('/images/noimagesmall.png');

    if (!empty(productImage)) {
        if (productImage.absURL) {
            imageURL = productImage.absURL;
        }
    }
    return imageURL.toString();
}

module.exports = getProductImageUrl;
