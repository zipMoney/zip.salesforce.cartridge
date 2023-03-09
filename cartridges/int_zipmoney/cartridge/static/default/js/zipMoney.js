'use strict';

window.ZipResources = window.ZipResources || {};

var ZipResourcesMgr = {};
ZipResourcesMgr.getText = function (key) {
    var zipResources = window.ZipResources;
    if (zipResources.texts[key]) {
        return zipResources.texts[key];
    }

    return key;
};

ZipResourcesMgr.getUrl = function (key) {
    var zipResources = window.ZipResources;
    if (zipResources.urls[key]) {
        return zipResources.urls[key];
    }

    return key;
};

ZipResourcesMgr.getConfig = function (key) {
    var zipResources = window.ZipResources;
    if (typeof zipResources.config[key] === 'undefined') {
        throw new Error('Invalid configuration key: ' + key);
    }

    return zipResources.config[key];
};

ZipResourcesMgr.hasErrorCode = function () {
    var zipResources = window.ZipResources;

    return (typeof zipResources.error !== 'undefined' && zipResources.error);
};

ZipResourcesMgr.getErrorCode = function () {
    var zipResources = window.ZipResources;

    return zipResources.error;
};

function orderSummaryShowTechnicalError(errorMsg) {
	if ($('.error-form').length) {
		var $errorFrm = $('.error-form');
		$errorFrm.html(errorMsg);
	} else {
		var $errorFrm = $('<div class="error-form">' + errorMsg + '</div>');
		$('.item-list').before($errorFrm);
	}

    $([document.documentElement, document.body]).animate({
        scrollTop: $errorFrm.offset().top
    }, 500);
};

function handleZipError(errorCode) {
	var errorMsg = "";

	switch (errorCode) {
		case "Order.Shipping.Address.Country":
		case "Shopper.BillingAddress.Country":
			errorMsg = ZipResourcesMgr.getText('errorZipAddress');
			break;
		case "account_insufficient_funds":
			errorMsg = ZipResourcesMgr.getText('errorInsufficientFunds');
			break;
		default:
			errorMsg = ZipResourcesMgr.getText('technicalError');
			break;
	}

	orderSummaryShowTechnicalError(errorMsg);
}

function handleError(error) {
	if (typeof error.zipErrorCode !== 'undefined') {
		handleZipError(error.zipErrorCode);
	} else {
		orderSummaryShowTechnicalError(ZipResourcesMgr.getText('technicalError'));
	}
}

var initContinueToZipButton = function (continueToZipBtn) {
	var $continueToZipBtn = $(continueToZipBtn);

	var zipLightbox = ZipResourcesMgr.getConfig('zipLightbox');

	if (zipLightbox) {
		$continueToZipBtn.click(function (ev) {
			ev.preventDefault();
			ev.stopPropagation();
		});

		Zip.Checkout.attachButton('#zip-checkout', {
			checkoutUri: ZipResourcesMgr.getUrl('checkout'),
			redirectUri: ZipResourcesMgr.getUrl('redirect'),
			onComplete: function (args) {
				var state = args.state;

				if (state === 'cancelled' || state === 'declined') {
					$.ajax({
						url: ZipResourcesMgr.getUrl('cancel'),
						method: 'POST',
						data: {
                            checkoutId: args.checkoutId
                        },
                        success: function (data) {
                            if (state === 'declined') {
                                window.location.href = data.redirectUrl;
                            }
                        }
					});
				} else {
					window.location.href = ZipResourcesMgr.getUrl('redirect') + '?result=' + state + '&checkoutId=' + args.checkoutId;
				}
			},
			onError: function(args) {
				handleError(args.detail);
			}
		});
	} else {
		$continueToZipBtn.click(function (ev) {
			ev.preventDefault();
			ev.stopPropagation();

			$.ajax({
				url: ZipResourcesMgr.getUrl('checkout'),
				method: 'POST',
				success: function (data) {
					if (typeof data.uri !== 'undefined' && data.uri.length) {
						window.location.href = data.uri;
					} else {
						handleError(data);
					}
				},
				error: function () {
				}
			});
		});
	}
};

function initZipPaymentInstruments() {
	$('.zip-payment-list').on('click', '.delete', function (e) {
		e.preventDefault();

		var $currentTarget = $(e.currentTarget);
		var $btn = null;

		if ($currentTarget.is('button')) {
			$btn = $currentTarget;
		} else {
			$btn = $currentTarget.parents('button');
		}

		if (window.confirm(ZipResourcesMgr.getText('confirmZipTokenDelete'))) {
			$.ajax({
				url: ZipResourcesMgr.getUrl('removeToken'),
				data: {
					paymentMethodId: $btn.val()
				},
				method: 'POST'
			}).done(function () {
				setTimeout(function () {
					window.location.assign(window.location.href);
				}, 500);
			});
		}
	});
}

//initialize app
$(document).ready(function () {
	if ($('.zip-payment-list').length) {
		initZipPaymentInstruments();
	}

	if (ZipResourcesMgr.hasErrorCode()) {
		handleZipError(ZipResourcesMgr.getErrorCode());
	}

	if ($('button.continue-with-zip').length) {
		initContinueToZipButton($('button.continue-with-zip'));
	}
});