define(['jquery', 'underscore', 'twigjs'], function ($, _, twigjs) {
  var CustomWidget = function () {
    var self = this;

    this.getTemplate = _.bind(function (template, params, callback) {
      params = typeof params == 'object' ? params : {};
      template = template || '';

      return this.render({
        href: '/templates/' + template + '.twig',
        base_path: this.params.path,
        v: this.get_version(),
        load: callback
      }, params);
    }, this);

    this.callbacks = {
      render: function () {
        console.log('render');

        return true;
      },

      init: _.bind(function () {
        console.log('init');

        AMOCRM.addNotificationCallback(self.get_settings().widget_code, function (data) {
          console.log(data);
        });

        this.add_action('phone', function (params) {
          /**
           * код взаимодействия с виджетом телефонии
           */
          console.log(params);
        });

        this.add_source('sms', function (params) {
          /**
           params - это объект в котором будут  необходимые параметры для отправки смс

           {
             // телефон получателя
             "phone": 75555555555,
             // сообщение для отправки
             "message": "sms text",
             // идентификатор контакта, к которому привязан номер телефона
             "contact_id": 12345
          }
           */

          return new Promise(_.bind(function (resolve, reject) {
            // тут будет описываться логика для отправки смс
            self.crm_post(
              'https://example.com/',
              params,
              // eslint-disable-next-line max-nested-callbacks
              function (msg) {
                console.log(msg);
                resolve();
              },
              'text'
            );
          }, this)
          );
        });

        return true;
      }, this),

      bind_actions: function () {
        console.log('bind_actions');

        return true;
      },

      settings: _.bind(function ($modal_body) {
        this.getTemplate(
          'oferta',
          {},
          function (template) {
            var $install_btn = $('button.js-widget-install'),
                $oferta_error = $('div.oferta_error');

            $modal_body.find('input[name="oferta"]').val(''); // очищаем принудительно поле oferta
            $modal_body.find('.widget_settings_block__item_field:visible')
              .last()
              .after(
                template.render({ oferta: self.i18n('settings').oferta, oferta_error: self.i18n('settings').oferta_error })
              ); // отрисовываем шаблон и добавляем в блок настроек виджета
            $modal_body.find('input[name="oferta_check"]').on('change', function (e) {
              var $checkbox = $(e.currentTarget);

              if ($checkbox.prop('checked')) {
                $modal_body.find('input[name="oferta"]').val('1'); // заполняем поле oferta, если чекбокс отмечен
                $oferta_error.addClass('hidden'); // скрываем предупреждение, если оно отображено
              } else {
                $modal_body.find('input[name="oferta"]').val(''); // очищаем поле oferta, если не отмечен чекбокс
              }
            });

            // при нажатии на кнопку "Установить", если не отмечен чекбокс,
            // отображаем предупреждение
            $install_btn.on('click', function () {
              if (!$modal_body.find('input[name="oferta"]').val()) {
                $oferta_error.removeClass('hidden');
              }
            });
          }
        );

        return true;
      }, this),

      onSave: function () {
        console.log('click');

        return true;
      },

      destroy: function () {
        _.noop();
      },

      contacts: {
        // select contacts in list and clicked on widget name
        selected: function () {
          console.log('contacts');
        }
      },

      leads: {
        // select leads in list and clicked on widget name
        selected: function () {
          console.log('leads');
        }
      },

      tasks: {
        // select taks in list and clicked on widget name
        selected: function () {
          console.log('tasks');
        }
      },

      advancedSettings: _.bind(function () {
        var $work_area = $('#work-area-' + self.get_settings().widget_code),
            $save_button = $(
              twigjs({ ref: '/tmpl/controls/button.twig' }).render({
                text: 'Сохранить',
                class_name: 'button-input_blue button-input-disabled js-button-save-' + self.get_settings().widget_code,
                additional_data: ''
              })
            ),
            $cancel_button = $(
              twigjs({ ref: '/tmpl/controls/cancel_button.twig' }).render({
                text: 'Отмена',
                class_name: 'button-input-disabled js-button-cancel-' + self.get_settings().widget_code,
                additional_data: ''
              })
            );

        console.log('advancedSettings');

        $save_button.prop('disabled', true);
        $('.content__top__preset').css({ float: 'left' });

        $('.list__body-right__top').css({ display: 'block' })
          .append('<div class="list__body-right__top__buttons"></div>');
        $('.list__body-right__top__buttons').css({ float: 'right' })
          .append($cancel_button)
          .append($save_button);

        self.getTemplate('advanced_settings', {}, function (template) {
          var $page = $(
            template.render({ title: self.i18n('advanced').title, widget_code: self.get_settings().widget_code })
          );

          $work_area.append($page);
        });
      }, self),

      /**
       * Метод срабатывает, когда пользователь в конструкторе
       * Salesbot размещает один из хендлеров виджета.
       * Мы должны вернуть JSON код salesbot'а
       *
       * @param handler_code - Код хендлера, который мы предоставляем.
       * Описан в manifest.json, в примере равен handler_code
       * @param params - Передаются настройки виджета. Формат такой:
       * {
       *   button_title: "TEST",
       *   button_caption: "TEST",
       *   text: "{{lead.cf.10929}}",
       *   number: "{{lead.price}}",
       *   url: "{{contact.cf.10368}}"
       * }
       *
       * @return {{}}
       */
      onSalesbotDesignerSave: function (handler_code, params) {
        var salesbot_source = {
              question: [],
              require: []
            },
            button_caption = params.button_caption || '',
            button_title = params.button_title || '',
            text = params.text || '',
            number = params.number || 0,
            handler_template = {
              handler: 'show',
              params: {
                type: 'buttons',
                value: text + ' ' + number,
                buttons: [
                  button_title + ' ' + button_caption,
                ]
              }
            };

        console.log(params);

        salesbot_source.question.push(handler_template);

        return JSON.stringify([salesbot_source]);
      },
    };

    return this;
  };

  return CustomWidget;
});