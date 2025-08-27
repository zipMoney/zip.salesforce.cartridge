'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');
var OrderItemBuilder = require('~/cartridge/scripts/zip/api/builder/orderItem');
var getProductImageUrl = require('~/cartridge/scripts/util/getProductImageUrl');

/**
 * Sku order item type.
 * @param {dw.order.LineItem} lineItem line item.
 */
function Sku(lineItem) {
    this.setLineItem(lineItem);
}

Sku.prototype = Object.create(OrderItemBuilder.prototype);
Sku.prototype.constructor = Sku;

Sku.prototype.getQuantifier = function () {
    return 1;
};

Sku.prototype.setLineItem = function (lineItem) {
    this.lineItem = lineItem;
};

Sku.prototype.getName = function () {
    var li = this.lineItem;

    return li.productName;
};

Sku.prototype.getAmount = function () {
    var li = this.lineItem;

    return (li.basePrice.value) * this.getQuantifier();
};

Sku.prototype.getQuantity = function () {
    return this.lineItem.quantityValue;
};

Sku.prototype.getType = function () {
    return 'sku';
};

Sku.prototype.getReference = function () {
    return this.lineItem.productID;
};

Sku.prototype.getItemUri = function () {
    var li = this.lineItem;
    var url = '';

    if (li.optionProductLineItem) {
        url = (URLUtils.http('Product-Show', 'pid', li.parent.productID).toString());
    } else {
        url = (URLUtils.http('Product-Show', 'pid', li.productID).toString());
    }

    return url;
};

Sku.prototype.getImageUri = function () {
    var product = null;

    if (this.lineItem.isOptionProductLineItem()) {
        var optionId = this.lineItem.getOptionID();
        product = ProductMgr.getProduct(optionId);
    } else {
        product = this.lineItem.getProduct();
    }

    var imageUrl = getProductImageUrl(product, 'medium');

    return imageUrl;
};

module.exports = Sku;
