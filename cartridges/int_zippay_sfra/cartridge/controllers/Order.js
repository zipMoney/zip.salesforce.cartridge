var page = module.superModule; // inherits functionality
var server = require('server');

server.extend(page);

/**
 * Order-Confirm : Append this method to add zip reciept number after order is placed
 * @name Base/Order-Confirm
 * @function
 * @memberof Order
 * @param {category} - sensitive
 * @param {serverfunction} - append
 */
server.append('Confirm', function (req, res, next) {
    var TempateUtils = require('*/cartridge/scripts/util/template');
    var zippayEnabled = TempateUtils.isZippayEnabled();
    if (zippayEnabled) {
        var OrderMgr = require('dw/order/OrderMgr');

        var viewData = res.getViewData();

        if (viewData.order) {
            var order = OrderMgr.getOrder(viewData.order.orderNumber);
            viewData.zipReceipt = order.custom.ZipReceiptNumber;
        }
    }

    return next();
});

module.exports = server.exports();
