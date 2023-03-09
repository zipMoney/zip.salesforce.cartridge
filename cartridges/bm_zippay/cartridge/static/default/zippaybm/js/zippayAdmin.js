/* global Ext jQuery */

var zippayAdmin = (function ($) {
    var refundFormWindow;
    var $window = $(window);

    function initEvents() {
        $('.zip_refund_action').on('click', function () {
            var $button = $(this);
            refundFormWindow = new Ext.Window({
                title: $button.attr('title'),
                width: 780,
                height: 200,
                modal: true,
                autoScroll: true,
                cls: 'zippaybm_window_content',
                buttons: [
                    {
                        text: zippayAdmin.resources.submit,
                        handler: function () {
                            submitActionForm($('#zip_refund_form').find('form'));
                        }
                    },
                    {
                        text: zippayAdmin.resources.cancel,
                        handler: function () {
                        	refundFormWindow.close();
                        }
                    }
                ]
            });
            refundFormWindow.show();
            refundFormWindow.maskOver = zipPayCreateMaskOver(refundFormWindow);
            loadRefundForm($button.data('orderno'));

            return false;
        });

        $('.zip_capture_action').on('click', function (e) {
            e.preventDefault();

            var $button = $(this);
            captureFormWindow = new Ext.Window({
                title: $button.attr('title'),
                width: 780,
                height: 200,
                modal: true,
                autoScroll: true,
                cls: 'zippaybm_window_content',
                buttons: [
                    {
                        text: zippayAdmin.resources.submit,
                        handler: function () {
                            submitActionCaptureForm($('#zip_capture_form').find('form'));
                        }
                    },
                    {
                        text: zippayAdmin.resources.cancel,
                        handler: function () {
                        	captureFormWindow.close();
                        }
                    }
                ]
            });
            captureFormWindow.show();
            captureFormWindow.maskOver = zipPayCreateMaskOver(captureFormWindow);
            loadCaptureForm($button.data('orderno'));

            return false;
        });
    }

    function isFormValid($form) {
       //return true;
       var countErrors = 0;
       $form.find('.zippay_error_msg_box').hide();
       $form.find('.zippay_error_field').removeClass('zippay_error_field');
       $form.find('[data-validation]').not(':disabled').each(function () {
           var currentError = 0;
           var $field = $(this);
           var rules = $field.data('validation').replace(/\s/, '').split(',');
           var value = $.trim($field.val());
           $.each(rules, function (i, rule) { // eslint-disable-line consistent-return
               switch (rule) {
                   case 'required':
                       if (!value.length) {
                           currentError++;
                       }
                       break;
                   case 'float':
                       if (isNaN(parseFloat(value)) || !isFinite(value)) {
                           currentError++;
                       }
                       break;
                   case 'greaterzero':
                       if (parseFloat(value) <= 0) {
                           currentError++;
                       }
                       break;
                   default:
                       break;
               }
               if (currentError) {
                   var name = $field.data('general-validation') || $field.attr('name');
                   $field.parents('tr').addClass('zippay_error_field');
                   $form.find('.zippay_error_msg_box_' + name + '_' + rule).show();
                   countErrors += currentError;
                   return false;
               }
           });
       });
       return !!countErrors;
    }

    function showErrorMessage(text) {
        Ext.Msg.show({
            title: zippayAdmin.resources.errorMsgTitle,
            msg: text,
            buttons: Ext.Msg.OK,
            icon: Ext.MessageBox.ERROR
        });
    }

    function showResultMessage(text, title) {
        Ext.Msg.show({
            closable : false,
            title: title,
            msg: text,
            fn: function(buttonValue, inputText, showConfig) { window.location.reload(); },
            buttons: Ext.Msg.OK,
            icon: Ext.MessageBox.ОК
        });
    }

    function submitActionForm($form) {
        if (isFormValid($form)) return false;

        refundFormWindow.maskOver.show();

        $.ajax({
            url: $form.attr('action'),
            data: $form.serialize(),
            dataType: 'json',
            error: function (jqXHR, textStatus, errorThrown) {
                refundFormWindow.maskOver.hide();
                refundFormWindow.close();
            },
            success: function (data) {
                refundFormWindow.maskOver.hide();
                refundFormWindow.close();
                if (data.result === 'Success') {
                    showResultMessage(JSON.stringify(data), zippayAdmin.resources.refundTitle);
                } else if (data) {
                    showErrorMessage(data.message);
                } else {
                    showErrorMessage(zippayAdmin.resources.serverError);
                }
            }
        });

        return true;
    }

    function submitActionCaptureForm($form) {
        if (isFormValid($form)) return false;

        captureFormWindow.maskOver.show();

        $.ajax({
            url: $form.attr('action'),
            data: $form.serialize(),
            dataType: 'json',
            error: function (jqXHR, textStatus, errorThrown) {
                captureFormWindow.maskOver.hide();
                captureFormWindow.close();
            },
            success: function (data) {
                captureFormWindow.maskOver.hide();
                captureFormWindow.close();
                if (data.result === 'Success') {
                    showResultMessage(JSON.stringify(data), zippayAdmin.resources.captureTitle);
                } else if (data) {
                    showErrorMessage(data.message);
                } else {
                    showErrorMessage(zippayAdmin.resources.serverError);
                }
            }
        });

        return true;
    }

    function loadCaptureForm(orderNo) {
        var data = {
            format: 'ajax',
            orderNo: orderNo || null
        };

        captureFormWindow.maskOver.show();
        $.ajax({
            url: zippayAdmin.urls.captureForm,
            data: data,
            error: function () { // eslint-disable-line no-shadow*
                captureFormWindow.maskOver.hide();
                if (captureFormWindow) {
                    captureFormWindow.close();
                }
            },
            success: function (data) { // eslint-disable-line no-shadow
                captureFormWindow.maskOver.hide();
                if (captureFormWindow) {
                    $('#' + captureFormWindow.body.id).html(data);
                    captureFormWindow.setHeight('auto');
                    captureFormWindow.center();
                    $('#' + captureFormWindow.body.id).find('.full_capture_checkbox').on('click', function() {
                       var remainAmount = $('.capture_remain_amount').text();
                       if (remainAmount && $(this).is(':checked')) {
                           $('.capture_amount').val(remainAmount);
                       }
                       if (!$(this).is(':checked')) {
                           $('.capture_amount').val('');
                       }
                       return;
                    });
                    
                } else {
                    $('.js_zippaybm_content').html(data);
                }
            }
        });
    }

    function loadRefundForm(orderNo) {
        var data = {
            format: 'ajax',
            orderNo: orderNo || null
        };

        refundFormWindow.maskOver.show();
        $.ajax({
            url: zippayAdmin.urls.refundForm,
            data: data,
            error: function () { // eslint-disable-line no-shadow*
                refundFormWindow.maskOver.hide();
                if (refundFormWindow) {
                    refundFormWindow.close();
                }
            },
            success: function (data) { // eslint-disable-line no-shadow
                refundFormWindow.maskOver.hide();
                if (refundFormWindow) {
                    $('#' + refundFormWindow.body.id).html(data);
                    refundFormWindow.setHeight('auto');
                    refundFormWindow.center();
                    $('#' + refundFormWindow.body.id).find('.full_refund_checkbox').on('click', function() {
                       var remainAmount = $('.refund_remain_amount').text();
                       if (remainAmount && $(this).is(':checked')) {
                           $('.refund_amount').val(remainAmount);
                       }
                       if (!$(this).is(':checked')) {
                           $('.refund_amount').val('');
                       }
                       return;
                    });
                    
                } else {
                    $('.js_zippaybm_content').html(data);
                }
            }
        });
    }

    function zipPayCreateMaskOver(panel) {
        return (function () {
            return {
                ext: new Ext.LoadMask(panel.getEl()),
                show: function (type) {
                    this.ext.msg = zippayAdmin.resources.loadMaskText[type] || zippayAdmin.resources.pleaseWait;
                    this.ext.show();
                },
                hide: function () {
                    this.ext.hide();
                }
            };
        }());
    }

    return {
         init: function (config) {
            $.extend(this, config);
            $(document).ready(function () {
                initEvents();
            });
        }
    };
}(jQuery));
