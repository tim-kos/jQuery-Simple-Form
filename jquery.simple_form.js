jQuery.extend({
  processResponse: function(json) {
    if (!json.error && json.redirect) {
      window.location = json.redirect;
    }
    return json;
  },

  validateForm: function(formId, rules, invalidHandler) {
    var form = $('#' + formId);
    var validation = {
      rules: {},
      messages: {}
    };

    if (rules) {
      for (var key in rules) {
        if (typeof rules[key] != 'object' || typeof rules[key].length == 'undefined') {
          rules[key] = $.makeArray(rules[key]);
        }

        $(rules[key]).each(function() {
          var rule = this;

          elements = key.split('.');
          if (elements.length == 2) {
            key = 'data[' + elements[0] + '][' + elements[1] + ']';
          } else if (elements.length == 3) {
            key = 'data[' + elements[0] + '][' + elements[1] + '][' + elements[2] + ']';
          }

          ruleName = rule.rule;
          value = rule.value || true;

          if (typeof validation.rules[key] == 'undefined') {
            validation.rules[key] = {};
          }

          if (typeof validation.messages[key] == 'undefined') {
            validation.messages[key] = {};
          }

          validation.rules[key][ruleName] = value;
          validation.messages[key][ruleName] = rule.message || 'Please specify a valid value';
        });
      }
    }

    invalidHandler = invalidHandler || null;
    var success = form.validate(jQuery.extend({
      debug: false,
      errorPlacement: function(error, element) {
        error.appendTo(element.parent());
      },
      invalidHandler: invalidHandler
    }, validation || {})).form();

    return success;
  },

  processForm: function(formId, rules, successCb, url, invalidHandler) {
    var success = $.validateForm(formId, rules, invalidHandler);
    var $form = $('#' + formId);
    var $btn = $('.submit input', $form);
    var btnTxt = $btn.attr('value');

    if (success) {
      $.postForm(url || $form.attr('action'), $form.serialize(), successCb);
    } else {
      $btn.attr('value', btnTxt).attr('disabled', false);
    }

    return success;
  },

  postForm: function(url, data, onSuccess) {
    if (typeof onSuccess != 'function' && typeof onSuccess != 'object') {
      onSuccess = false;
    }

    var options = {
      url: url,
      dataType: 'json',
      error: function (xhr, desc, exceptionobj) {
        alert('There has been an error: ' + xhr.responseText);
      },
      success : function (json) {
        json.success = (typeof json.success == 'undefined' ? true : json.success);

        if (typeof onSuccess == 'function') {
          onSuccess(json);
        }

        if (!json.msg && json.responseText) {
          json.msg = json.responseText;
        }

        if (typeof onSuccess == 'object') {
          if (typeof onSuccess.container != 'undefined') {
            $(onSuccess.container).load(onSuccess.url, function() {
              if (json.msg) {
                $.renderMessage(json.msg, json.success);
              }
            });
          } else if (typeof onSuccess.url != 'undefined') {
            window.location.href = onSuccess.url;
          }

          if (typeof onSuccess.callback == 'function') {
            onSuccess.callback(json);
          }
        } else if (json.msg) {
          $.renderMessage(json.msg, json.success);
        }

        $.processResponse(json);
      }
    };

    if (data) {
      options = $.extend(options, {
        type: 'POST',
        data: data
      });
    }

    $.ajax(options);
  },

  renderMessage: function (message, success) {
    var container = '#messages';
    if ($(container).length == 0) {
      return;
    }

    var myClass = success ? 'ok' : 'error';
    var $li = $('<li class="' + myClass +'">' + message + '</li>');
    var $container = $(container).html($li).show();

    setTimeout(function() {
      $container.fadeOut('slow');
    }, 3000)
  }
});