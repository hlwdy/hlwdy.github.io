var tmpl = require('../html/prompt.html'),
    css  = require('../less/prompt.less');

var defaultOption = {
    negative: 'cancel',
    positive: 'ok'
};

/* @param: option{object}:
 *            title{string}
 *            placeholder{string}
 *            negative{string}
 *            positive{string}
 *            callback{function}
 */
function prompt(option) {
    option = $.extend(defaultOption, option);
    if ($('.js-prompt').length === 0) {
        $('body').append(tmpl);
        $('.js-prompt .js-positive').on('click', function() {
            $('.js-prompt').hide();
            option.callback(inputDiv.val());
        });
        $('.js-prompt .js-negative').on('click', function() {
            $('.js-prompt').hide();
            option.callback(null);
        });
    }
    var promptDiv = $('.js-prompt'),
        titleDiv = promptDiv.find('.js-title'),
        inputDiv = promptDiv.find('.js-input'),
        negDiv = promptDiv.find('.js-negative'),
        posDiv = promptDiv.find('.js-positive');
    titleDiv.html(option.title);
    inputDiv.attr('placeholder', option.placeholder);
    inputDiv.val('');
    posDiv.html(option.positive);
    negDiv.html(option.negative);
    promptDiv.show();
}

window.prompt = prompt;

