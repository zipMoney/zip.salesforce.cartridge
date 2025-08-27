/* globals empty */

'use strict';

/**
 * @abstract
 *
 * Order Line Item Builder.
 */
function OrderLineItem() {
    this.lineItem = null;

    if (this.constructor === OrderLineItem) {
        throw new Error("Can't instantiate abstract class!");
    }
}

OrderLineItem.prototype.getName = function () {
    throw new Error('Abstract method!');
};

OrderLineItem.prototype.getAmount = function () {
    throw new Error('Abstract method!');
};

OrderLineItem.prototype.getQuantity = function () {
    throw new Error('Abstract method!');
};

OrderLineItem.prototype.getType = function () {
    throw new Error('Abstract method!');
};

OrderLineItem.prototype.getReference = function () {
    throw new Error('Abstract method!');
};

OrderLineItem.prototype.getItemUri = function () {
    return null;
};

OrderLineItem.prototype.getImageUri = function () {
    return null;
};

OrderLineItem.prototype.build = function () {
    var item = {
        name: this.getName(),
        amount: this.getAmount(),
        quantity: this.getQuantity(),
        type: this.getType(),
        reference: this.getReference()
    };

    var itemUri = this.getItemUri();

    if (!empty(itemUri)) {
        item.item_uri = itemUri;
    }

    var imageUri = this.getImageUri();

    if (!empty(imageUri)) {
        item.image_uri = imageUri;
    }

    return item;
};

module.exports = OrderLineItem;
