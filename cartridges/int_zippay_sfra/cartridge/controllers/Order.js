var page = module.superModule; // inherits functionality
var server = require('server');

server.extend(page);

server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');

    var viewData = res.getViewData();

    var order = OrderMgr.getOrder(req.querystring.ID);

    viewData.zipRequireApproval = order.custom.zipRequireApproval;
    viewData.zipReceipt = order.custom.ZipReceiptNumber;

    return next();
});

module.exports = server.exports();
