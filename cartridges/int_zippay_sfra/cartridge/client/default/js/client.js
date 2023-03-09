/* globals $, Zip */

var ZipResources = {};
ZipResources.getText = function (key) {
    var zipResources = window.ZipResources;
    if (zipResources.texts[key]) {
        return zipResources.texts[key];
    }

    return key;
};

ZipResources.getUrl = function (key) {
    var zipResources = window.ZipResources;
    if (zipResources.urls[key]) {
        return zipResources.urls[key];
    }

    return key;
};

ZipResources.getConfig = function (key) {
    var zipResources = window.ZipResources;
    if (typeof zipResources.config[key] === 'undefined') {
        throw new Error('Invalid configuration key: ' + key);
    }

    return zipResources.config[key];
};

ZipResources.hasError = function () {
    var zipResources = window.ZipResources;

    return (typeof zipResources.error !== 'undefined' && zipResources.error);
};

var ZipForm = function (container) {
    this.$container = $(container);
};

ZipForm.prototype.getFields = function () {
    var $fields = this.$container.find('.zip-field');

    return $fields;
};

ZipForm.prototype.getInvalidFields = function () {
    return this.getFields().filter('.is-invalid');
};

ZipForm.prototype.getFirstInvalidField = function () {
    return this.getInvalidFields().eq(0);
};

/**
 * Initialize validation for ZIP form fields.
 *
 */
ZipForm.prototype.initValidation = function () {
    var instance = this;
    var $fields = this.getFields();

    $fields.on('keypress input', function () {
        if (instance.validateField(this)) {
            instance.markFieldAsValid(this);
        } else {
            instance.markFieldAsInvalid(this);
        }
    });
};

ZipForm.prototype.validate = function () {
    this.getFields().each(function (index, field) {
        this.validateField(field);
    }.bind(this));
};

ZipForm.prototype.isValid = function () {
    return (!this.getInvalidFields().length);
};

ZipForm.prototype.validateField = function (field) {
    var $field = $(field);
    var regExpPattern = $field.attr('pattern');
    var maxlength = parseInt($field.attr('maxlength'), 10);
    var fieldValue = $field.val();
    var regExp = new RegExp(regExpPattern);

    if (!fieldValue.length) {
        this.markFieldAsInvalid(field, $field.attr('missing-error'));
    } else if (fieldValue.length > maxlength) {
        this.markFieldAsInvalid(field, $field.attr('range-error'));
    } else if (!regExp.test(fieldValue)) {
        this.markFieldAsInvalid(field, $field.attr('parse-error'));
    } else {
        this.markFieldAsValid(field);
    }
};

ZipForm.prototype.markFieldAsValid = function (field) {
    var $field = $(field);

    $field.next('.invalid-feedback').hide();
    $field.removeClass('is-invalid');
};

ZipForm.prototype.markFieldAsInvalid = function (field, errorMsg) {
    var $field = $(field);

    $field.next('.invalid-feedback').html(errorMsg).show();
    $field.addClass('is-invalid');
};

var ZipPaymentsStage = function (zipPayments) {
    this.zipPayments = zipPayments;
    this.promise = null;
};

ZipPaymentsStage.prototype.setPromise = function (promise) {
    this.promise = promise;
};

ZipPaymentsStage.prototype.loaded = function () {
    if (this.promise) {
        this.promise.resolve();
    }
};

ZipPaymentsStage.prototype.initStage = function () {};
ZipPaymentsStage.prototype.refreshStage = function () {};

var ZipPaymentsSubmitPaymentStage = function (zipPayments) {
    this.promise = null;
    this.zipPayments = zipPayments;
    this.zipForms = {};
};

ZipPaymentsSubmitPaymentStage.prototype = Object.create(ZipPaymentsStage.prototype);

ZipPaymentsSubmitPaymentStage.prototype.initStage = function () {
    $('.zip-payments-content').each(function (index, content) {
        var $content = $(content);
        var form = new ZipForm(content);
        form.initValidation();
        this.zipForms[$content.attr('id')] = form;
    }.bind(this));

    if (ZipResources.hasError() && !this.zipPayments.isErrorSeen()) {
        this.zipPayments.showError({
            message: ZipResources.getText('zipDeclined'),
            scroll: true
        });
    }

    this.initPaymentOptionsTabs();

    this.initSubmitPaymentButton();

    this.loaded();
};

ZipPaymentsSubmitPaymentStage.prototype.isZipPaymentMethodActive = function () {
    return $('.zip-payments-content').hasClass('active');
};

ZipPaymentsSubmitPaymentStage.prototype.initSubmitPaymentButton = function () {
    var instance = this;
    var $btn = $('.submit-payment');

    $btn.click(function (event) {
        var $tabContent = $('.tab-content').find('.tab-pane.active');
        var zipForm = instance.zipForms[$tabContent.attr('id')];

        if ($tabContent.hasClass('zip-payments-content')) {
            zipForm.validate();

            if (!zipForm.isValid()) {
                $([document.documentElement, document.body]).animate({
                    scrollTop: zipForm.getFirstInvalidField().parent('.form-group').offset().top
                }, 500);

                event.stopPropagation();
                return;
            }
        }
    });
};

/**
 * Initialize payment options tabs.
 */
ZipPaymentsSubmitPaymentStage.prototype.initPaymentOptionsTabs = function () {
    ZipPaymentsSubmitPaymentStage.disableFormFieldsOfInactivePaymentTabs();

    var selectedPaymentMethod = this.zipPayments.getSelectedPaymentMethod();

    var $paymentOptionsTab = $('.payment-options li[data-method-id="' + selectedPaymentMethod + '"] a[data-toggle="tab"]');
    $paymentOptionsTab.click();
};

/**
 * Disable form fields of inactive payment tabs.
 *
 * SFRA, by default, doesn't disable fields of inactive payment tabs. When a user
 * wants to submit a payment, validation errors appear on inactive payment tabs.
 * This method patches this issue by disabling the fields so the validation doesn't
 * mark them as invalid and form submission may continue.
 */
ZipPaymentsSubmitPaymentStage.disableFormFieldsOfInactivePaymentTabs = function () {
    var $paymentOptionsTabs = $('.payment-options a[data-toggle="tab"]');

    $paymentOptionsTabs.on('shown.bs.tab', function (e) {
        $('.tab-content').find('input, textarea, select').prop('disabled', true);

        $paymentOptionsTabs.each(function () {
            var $tabLink = $(this);
            var tabId = $tabLink.attr('href');
            var $tabContent = $(tabId);

            if (this === e.target) {
                $tabContent.find('input, textarea, select').prop('disabled', false);
            }
        });
    });
};

ZipPaymentsSubmitPaymentStage.prototype.getActivePaymentMethodTab = function () {
    var $activeTabLink = $('.payment-options .nav-link.active');

    var $activeTab = $activeTabLink.parent();

    return $activeTab;
};

var ZipPaymentsPlaceOrderStage = function (zipPayments) {
    this.zipPayments = zipPayments;
};

ZipPaymentsPlaceOrderStage.prototype = Object.create(ZipPaymentsStage.prototype);

ZipPaymentsPlaceOrderStage.prototype.initStage = function () {
    if (ZipResources.hasError() && !this.zipPayments.isErrorSeen()) {
        this.zipPayments.showError({
            message: ZipResources.getText('technicalError'),
            scroll: false
        });
    }

    $(document).ajaxSuccess(function (event, xhr, settings) {
        var submitUrl = $('.place-order').data('action');

        if (settings.url === submitUrl && xhr.responseJSON.zipError) {
            this.handleZipError(xhr.responseJSON.zipError);
        }
    }.bind(this));

    this.initPlaceOrderButton();

    this.loaded();
};

ZipPaymentsPlaceOrderStage.prototype.refreshStage = function () {
    var selectedPaymentMethod = this.zipPayments.getSelectedPaymentMethod();

    if (this.zipPayments.isZipPaymentMethod(selectedPaymentMethod) && !this.zipPayments.getHasZipToken()) {
        $('#checkout-main').addClass('zip');
    } else {
        $('#checkout-main').removeClass('zip');
    }
};

ZipPaymentsPlaceOrderStage.prototype.initPlaceOrderButton = function () {
    var instance = this;
    var $placeOrderBtn = $('.place-order');
    var $continueToZipBtn = $placeOrderBtn.clone().insertAfter($placeOrderBtn);

    $continueToZipBtn.removeClass('place-order').addClass('zip-checkout');
    $continueToZipBtn.attr('id', 'zip-checkout');
    $continueToZipBtn.html(ZipResources.getText('continueToZip'));
    $continueToZipBtn.attr('href', '#');
    $continueToZipBtn.attr('type', 'button');

    var zipLightbox = ZipResources.getConfig('zipLightbox');

    if (zipLightbox) {
        $continueToZipBtn.click(function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        });

        Zip.Checkout.attachButton('#zip-checkout', {
            checkoutUri: ZipResources.getUrl('checkout'),
            redirectUri: ZipResources.getUrl('redirect'),
            onComplete: function (args) {
                var state = args.state;

                if (state === 'cancelled' || state === 'declined') {
                    $.ajax({
                        url: ZipResources.getUrl('cancel'),
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
                    window.location.href = ZipResources.getUrl('redirect') + '?result=' + state + '&checkoutId=' + args.checkoutId;
                }
            },
            onError: function (args) {
                instance.handleError(args.detail);
            }
        });
    } else {
        $continueToZipBtn.click(function (ev) {
            ev.preventDefault();
            ev.stopPropagation();

            $.ajax({
                url: ZipResources.getUrl('checkout'),
                method: 'POST',
                success: function (data) {
                    if (typeof data.uri !== 'undefined' && data.uri.length) {
                        window.location.href = data.uri;
                    } else {
                        instance.handleError(data);
                    }
                },
                error: function () {
                }
            });
        });
    }
};

ZipPaymentsPlaceOrderStage.prototype.handleZipError = function (errorCode) {
    var errorMsg = '';

    switch (errorCode) {
        case 'Order.Shipping.Address.Country':
        case 'Shopper.BillingAddress.Country':
            errorMsg = ZipResources.getText('errorZipAddress');
            break;
        case 'account_insufficient_funds':
            errorMsg = ZipResources.getText('errorInsufficientFunds');
            break;
        default:
            errorMsg = ZipResources.getText('technicalError');
            break;
    }

    this.zipPayments.showError({
        message: errorMsg,
        scroll: true
    });
};

ZipPaymentsPlaceOrderStage.prototype.handleError = function (error) {
    if (typeof error.zipErrorCode !== 'undefined') {
        this.handleZipError(error.zipErrorCode);
    } else {
        this.showTechnicalError(ZipResources.getText('technicalError'));
    }
};

ZipPaymentsPlaceOrderStage.prototype.showTechnicalError = function (errorMsg) {
    $('.error-message').show();
    $('.error-message-text').text(errorMsg);

    $([document.documentElement, document.body]).animate({
        scrollTop: $('.error-message-text').offset().top
    }, 500);
};

ZipPaymentsPlaceOrderStage.prototype.handleUpdateCheckoutView = function (data) {
    var order = data.order;

    if (!order.billing.payment || !order.billing.payment.selectedPaymentInstruments
		|| !order.billing.payment.selectedPaymentInstruments.length > 0) {
        return;
    }

    var hasZipToken = false;

    if (typeof data.customer.zip !== 'undefined') {
        if (typeof data.customer.zip.hasZipToken !== 'undefined' && data.customer.zip.hasZipToken) {
            hasZipToken = true;
        }
    }

    this.zipPayments.setHasZipToken(hasZipToken);

    this.updatePaymentSummary(order, data.options);
};

ZipPaymentsPlaceOrderStage.prototype.updatePaymentSummary = function (order) {
    var selectedPaymentInstruments = order.billing.payment.selectedPaymentInstruments;
    var firstPaymentInstrument = selectedPaymentInstruments[0];
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (this.zipPayments.isZipPaymentMethod(firstPaymentInstrument.paymentMethod)) {
        this.zipPayments.setSelectedPaymentMethod(firstPaymentInstrument.paymentMethod);

        htmlToAppend += '<div class="payment">';
        htmlToAppend += '<div class="method-name">' + firstPaymentInstrument.name + '</div>';
        if (typeof firstPaymentInstrument.amountFormatted !== 'undefined') {
            htmlToAppend += '<div class="amount">' + firstPaymentInstrument.amountFormatted + '</span>';
        }
        htmlToAppend += '</div>';
    } else {
        htmlToAppend += '<span>' + order.resources.cardType + ' '
			+ firstPaymentInstrument.type
			+ '</span><div>'
			+ firstPaymentInstrument.maskedCreditCardNumber
			+ '</div><div><span>'
			+ order.resources.cardEnding + ' '
			+ firstPaymentInstrument.expirationMonth
			+ '/' + firstPaymentInstrument.expirationYear
			+ '</span></div>';
    }

    $paymentSummary.empty().append(htmlToAppend);
};

var ZipPayments = function () {
    this.stages = {
        shipping: {
            instance: null,
            init: false
        },
        payment: {
            instance: new ZipPaymentsSubmitPaymentStage(this),
            init: false
        },
        placeOrder: {
            instance: new ZipPaymentsPlaceOrderStage(this),
            init: false
        }
    };

    this.errorSeen = false;

    this.handleStageChanges();
};

ZipPayments.prototype.getStageInstance = function (stage) {
    var instance = null;

    if (typeof this.stages[stage] !== 'undefined' && this.stages[stage].instance) {
        instance = this.stages[stage].instance;
    }

    return instance;
};

ZipPayments.prototype.getCurrentStage = function () {
    return $('.data-checkout-stage').attr('data-checkout-stage');
};

/**
 * Handle stage changes.
 *
 * This method sets a recurring interval to handle stage changes.
 *
 * Stage changes happen in three cases:
 *  - User progressing to next checkout step via submit button.
 *  - User going back via Edit.
 *  - On page load.
 */
ZipPayments.prototype.handleStageChanges = function () {
    setInterval(function () {
        var currentStage = this.getCurrentStage();

        if (this.currentStage !== currentStage) {
            this.handleStageChanged(currentStage);

            this.currentStage = currentStage;
        }
    }.bind(this), 100);
};

/**
 * Handle checkout stage changed.
 *
 * Usually, the user progresses further through the stages
 * by filling out valid information. The first time a stage
 * is loaded, ZipPayments initializes the stage by adding
 * stage-specific enhancements. If a stage is already initialized,
 * the stage is only refreshed.
 *
 * @param {string} newStage - ID of new stage.
 */
ZipPayments.prototype.handleStageChanged = function (newStage) {
    var promise = null;

    if (typeof this.stages[newStage] === 'undefined') {
        return;
    }

    if (!this.stages[newStage].init) {
        try {
            promise = this.initStage(newStage);

            promise.done(function () {
                this.refreshStage(newStage);
            }.bind(this));
        } catch (e) {
           // console.log(e);
        }

        this.stages[newStage].init = true;
    } else {
        this.refreshStage(newStage);
    }
};

ZipPayments.prototype.initStage = function (stage) {
    var promise = $.Deferred(); // eslint-disable-line

    if (typeof this.stages[stage] !== 'undefined' && this.stages[stage].instance) {
        this.stages[stage].instance.setPromise(promise);
        this.stages[stage].instance.initStage();
    }

    return promise;
};

ZipPayments.prototype.refreshStage = function (stage) {
    if (typeof this.stages[stage] !== 'undefined' && this.stages[stage].instance) {
        this.stages[stage].instance.refreshStage();
    }
};

ZipPayments.prototype.getSelectedPaymentMethod = function () {
    return $('.payment-information').attr('data-payment-method-id');
};

ZipPayments.prototype.setHasZipToken = function (hasZipToken) {
    var zipHasTokenAttributeValue = (hasZipToken) ? 'true' : 'false';

    $('.payment-information').attr('data-zip-has-token', zipHasTokenAttributeValue);
};

ZipPayments.prototype.getHasZipToken = function () {
    var zipHasTokenAttributeValue = $('.payment-information').attr('data-zip-has-token');

    var zipHasToken = (zipHasTokenAttributeValue === 'true');
    return zipHasToken;
};

ZipPayments.prototype.setSelectedPaymentMethod = function (paymentMethod) {
    $('.payment-information').attr('data-payment-method-id', paymentMethod);
};

ZipPayments.prototype.isZipPaymentMethod = function (paymentMethodId) {
    var found = false;
    var zipPaymentMethods = ZipResources.getConfig('zip_payment_methods');

    Object.values(zipPaymentMethods).forEach(function (methodId) {
        if (methodId === paymentMethodId) {
            found = true;
        }
    });

    return found;
};

ZipPayments.prototype.isErrorSeen = function () {
    return this.errorSeen;
};

ZipPayments.prototype.setErrorSeen = function (flag) {
    this.errorSeen = flag;
};

ZipPayments.prototype.showError = function (params) {
    var message = (typeof params.message === 'undefined') ? ZipResources.getText('technicalError') : params.message;
    var scroll = !((typeof params.scroll === 'undefined' || !params.scroll));

    $('.error-message').show();
    $('.error-message-text').text(message);

    if (scroll) {
        $([document.documentElement, document.body]).animate({
            scrollTop: $('.error-message-text').offset().top
        }, 500);
    }

    this.setErrorSeen(true);
};

$(function () {
    var zipPayments = new ZipPayments();

    $('body').on('checkout:updateCheckoutView', function (e, data) {
        var placeOrderStageInstance = zipPayments.getStageInstance('placeOrder');
        if (placeOrderStageInstance) {
            placeOrderStageInstance.handleUpdateCheckoutView(data);
        }
    });
});
