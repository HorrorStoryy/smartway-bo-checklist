// ==UserScript==
// @name         Smartway BO Checklist
// @namespace    https://smartway.today/
// @version      1.0
// @description  Чек-лист для добавления услуг в БО Smartway
// @author       Smartway
// @match        https://bo.smartway.today/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/HorrorStoryy/smartway-extensions/main/smartway-bo-checklist.meta.js
// @downloadURL  https://raw.githubusercontent.com/HorrorStoryy/smartway-extensions/main/smartway-bo-checklist.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Unicode-иконки
    var ICON_TRANSFER = '\uD83D\uDE95';
    var ICON_CUSTOM = '\u2699\uFE0F';
    var ICON_VIP = '\uD83D\uDECB\uFE0F';
    var ICON_BUS = '\uD83D\uDE8C';

    var isInternalClick = false;

    var BO_CHECKLISTS = {
        transfer: {
            title: 'Трансфер',
            icon: ICON_TRANSFER,
            items: [
                'Номер заказа',
                'ФИО сотрудника (Если однофамильцы - смотрим дату рождения и паспорт)',
                'Аналитики',
                'Откуда отправление, Дата и время подачи авто',
                'Куда прибывает, Дата и время приезда авто',
                'Встреча с табличкой',
                'Цена'
            ]
        },
        custom: {
            title: 'Кастомная услуга',
            icon: ICON_CUSTOM,
            items: [
                'Название услуги',
                'ФИО сотрудника (Если однофамильцы - смотрим дату рождения и паспорт)',
                'Аналитики',
                'Тип оплаты',
                'Дата и время начала услуги',
                'Дата и время окончания услуги',
                'Цена (Стоимость/Наценка Smartway)'
            ]
        },
        vip: {
            title: 'VIP-зал',
            icon: ICON_VIP,
            items: [
                'Название услуги',
                'ФИО сотрудника (Если однофамильцы - смотрим дату рождения и паспорт)',
                'Аналитики',
                'Направление и Тип перелёта',
                'Место вылета, Дата и время',
                'Место прилёта, Дата и время',
                'Цена (Стоимость/Наценка Smartway)',
                'С НДС (Россия)/Без НДС (зарубеж)'
            ]
        },
        bus: {
            title: 'Автобусный билет',
            icon: ICON_BUS,
            items: [
                'Название поездки',
                'ФИО сотрудника (Если однофамильцы - смотрим дату рождения и паспорт)',
                'Аналитики',
                'Тип багажа',
                'Пункт отправления, Дата и время',
                'Пункт прибытия, Дата и время',
                'Цена'
            ]
        }
    };

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showBoServiceSelectorModal(originalBtn) {
        if (document.getElementById('smartway-bo-root')) return;

        var root = document.createElement('div');
        root.id = 'smartway-bo-root';
        document.body.appendChild(root);

        var shadow = root.attachShadow({ mode: 'open' });

        var style = document.createElement('style');
        style.textContent =
            '.overlay {' +
            '  position: fixed; top: 0; left: 0; width: 100%; height: 100%;' +
            '  background: rgba(15, 23, 42, 0.4);' +
            '  display: flex; align-items: center; justify-content: center;' +
            '  z-index: 2147483647; font-family: system-ui, -apple-system, sans-serif;' +
            '  pointer-events: none;' +
            '}' +
            '.modal {' +
            '  background: #ffffff; border-radius: 24px; width: 500px; padding: 35px;' +
            '  box-shadow: 0 30px 60px -12px rgba(0,0,0,0.4); color: #1e293b;' +
            '  border: 1px solid #e2e8f0; animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);' +
            '  pointer-events: auto;' +
            '}' +
            '.overlay.sidebar-mode {' +
            '  justify-content: flex-end; align-items: stretch; background: transparent;' +
            '}' +
            '.overlay.sidebar-mode .modal {' +
            '  width: 420px; height: 100vh; border-radius: 24px 0 0 24px; margin: 0;' +
            '  box-sizing: border-box; display: flex; flex-direction: column;' +
            '  justify-content: space-between; animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1);' +
            '  border-right: none; border-top: none; border-bottom: none;' +
            '}' +
            '@keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }' +
            '@keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }' +
            'h2 { margin: 0 0 10px; font-size: 20px; font-weight: 800; text-align: center; color: #0f172a; }' +
            'p.subtitle { margin: 0 0 25px; text-align: center; color: #64748b; font-size: 14px; }' +
            '.services-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }' +
            '.service-btn {' +
            '  background: #f8fafc; border: 2px solid #e2e8f0; padding: 20px 15px;' +
            '  border-radius: 16px; cursor: pointer; text-align: center; transition: all 0.2s ease;' +
            '  display: flex; flex-direction: column; align-items: center; gap: 10px;' +
            '}' +
            '.service-btn:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-2px); }' +
            '.service-icon { font-size: 32px; }' +
            '.service-name { font-weight: 700; color: #334155; font-size: 14px; }' +
            '.checklist { margin-bottom: 25px; display: flex; flex-direction: column; gap: 10px; }' +
            '.check-item {' +
            '  display: flex; align-items: center; padding: 12px 16px; border-radius: 12px;' +
            '  background: #f8fafc; border: 1px solid #e2e8f0; cursor: pointer; transition: background 0.15s;' +
            '}' +
            '.check-item:hover { background: #f1f5f9; }' +
            '.check-item.checked { border-color: #10b981; background: #f0fdf4; }' +
            '.check-item input { width: 20px; height: 20px; margin-right: 15px; cursor: pointer; accent-color: #10b981; }' +
            '.check-item span { font-weight: 600; font-size: 14px; color: #334155; text-align: left; }' +
            '.actions { display: flex; gap: 12px; }' +
            '.btn { flex: 1; padding: 14px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; font-size: 14px; text-transform: uppercase; transition: all 0.2s; }' +
            '.btn-submit { background: #10b981; color: #ffffff; }' +
            '.btn-submit:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }' +
            '.btn-cancel { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }' +
            '.btn-cancel:hover { background: #e2e8f0; }';

        var container = document.createElement('div');
        container.className = 'overlay';
        container.id = 'bo-overlay-container';

        container.innerHTML =
            '<div class="modal" id="bo-modal-content">' +
            '  <h2>Добавление услуги в БО</h2>' +
            '  <p class="subtitle">Пожалуйста, выберите тип создаваемой услуги:</p>' +
            '  <div class="services-grid">' +
            '    <div class="service-btn" data-service="transfer">' +
            '      <span class="service-icon">' + ICON_TRANSFER + '</span>' +
            '      <span class="service-name">Трансфер</span>' +
            '    </div>' +
            '    <div class="service-btn" data-service="custom">' +
            '      <span class="service-icon">' + ICON_CUSTOM + '</span>' +
            '      <span class="service-name">Кастомная услуга</span>' +
            '    </div>' +
            '    <div class="service-btn" data-service="vip">' +
            '      <span class="service-icon">' + ICON_VIP + '</span>' +
            '      <span class="service-name">VIP-зал</span>' +
            '    </div>' +
            '    <div class="service-btn" data-service="bus">' +
            '      <span class="service-icon">' + ICON_BUS + '</span>' +
            '      <span class="service-name">Автобусный билет</span>' +
            '    </div>' +
            '  </div>' +
            '  <div class="actions">' +
            '    <button class="btn btn-cancel" id="cancel-selector">Отмена</button>' +
            '  </div>' +
            '</div>';

        shadow.appendChild(style);
        shadow.appendChild(container);

        shadow.getElementById('cancel-selector').onclick = function() { root.remove(); };

        var serviceButtons = shadow.querySelectorAll('.service-btn');
        for (var i = 0; i < serviceButtons.length; i++) {
            (function(btn) {
                btn.onclick = function() {
                    var selectedServiceKey = btn.getAttribute('data-service');
                    renderBoChecklist(shadow, selectedServiceKey, originalBtn, root);
                };
            })(serviceButtons[i]);
        }
    }

    function renderBoChecklist(shadow, serviceKey, originalBtn, rootNode) {
        var serviceInfo = BO_CHECKLISTS[serviceKey];
        if (!serviceInfo) return;

        var overlayContainer = shadow.getElementById('bo-overlay-container');
        var modalContainer = shadow.getElementById('bo-modal-content');
        if (!overlayContainer || !modalContainer) return;

        overlayContainer.classList.add('sidebar-mode');

        var checklistItemsHtml = '';
        for (var i = 0; i < serviceInfo.items.length; i++) {
            checklistItemsHtml += '<label class="check-item" data-idx="' + i + '">' +
                '<input type="checkbox" class="bo-safeguard">' +
                '<span>' + escapeHtml(serviceInfo.items[i]) + '</span>' +
                '</label>';
        }

        modalContainer.innerHTML =
            '<div>' +
            '  <h2 style="text-align: left; margin-top: 10px;">Проверка: ' + escapeHtml(serviceInfo.title) + '</h2>' +
            '  <p class="subtitle" style="text-align: left; margin-bottom: 25px;">Сверьте данные с формой слева:</p>' +
            '  <div class="checklist">' + checklistItemsHtml + '</div>' +
            '</div>' +
            '<div class="actions">' +
            '  <button class="btn btn-cancel" id="back-to-selector">Назад</button>' +
            '  <button class="btn btn-submit" id="confirm-bo" disabled>Добавить заказ</button>' +
            '</div>';

        var checkboxes = shadow.querySelectorAll('.bo-safeguard');
        var confirmBtn = shadow.getElementById('confirm-bo');
        var backBtn = shadow.getElementById('back-to-selector');

        for (var j = 0; j < checkboxes.length; j++) {
            (function(cb) {
                cb.onchange = function() {
                    cb.closest('.check-item').classList.toggle('checked', cb.checked);
                    var allChecked = true;
                    for (var k = 0; k < checkboxes.length; k++) {
                        if (!checkboxes[k].checked) { allChecked = false; break; }
                    }
                    confirmBtn.disabled = !allChecked;
                };
            })(checkboxes[j]);
        }

        backBtn.onclick = function() {
            modalContainer.remove();
            rootNode.remove();
            showBoServiceSelectorModal(originalBtn);
        };

        confirmBtn.onclick = function() {
            isInternalClick = true;
            var triggerClick = function(el) {
                var events = ['mousedown', 'mouseup', 'click'];
                for (var m = 0; m < events.length; m++) {
                    el.dispatchEvent(new MouseEvent(events[m], { bubbles: true, cancelable: true, view: window }));
                }
            };
            var realBtn = originalBtn.closest('button, a, input') || originalBtn;
            triggerClick(realBtn);
            isInternalClick = false;
            rootNode.remove();
        };
    }

    // Главный перехватчик кликов
    document.addEventListener('click', function(e) {
        if (isInternalClick) return;

        var clickedButton = e.target.closest('button, a, [role="button"], input[type="button"], input[type="submit"]');
        if (!clickedButton) return;

        var buttonText = (clickedButton.innerText || clickedButton.textContent || clickedButton.value || '').toLowerCase().trim();
        if (buttonText !== 'добавить заказ' && buttonText !== 'добавить услугу') return;

        var pageText = (document.body.innerText || '').toLowerCase();
        var hasPriceField = pageText.indexOf('цена') !== -1 || pageText.indexOf('стоимость') !== -1;

        var allInputs = document.querySelectorAll('input, select');
        var visibleInputs = [];
        for (var i = 0; i < allInputs.length; i++) {
            var el = allInputs[i];
            var type = (el.type || '').toLowerCase();
            if (type !== 'hidden' && type !== 'submit' && type !== 'button' && type !== 'checkbox' && type !== 'radio' && el.offsetParent !== null) {
                visibleInputs.push(el);
            }
        }

        var isFormVisible = hasPriceField && visibleInputs.length > 0;
        if (!isFormVisible) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showBoServiceSelectorModal(clickedButton);
    }, true);

    console.log('[Smartway BO Checklist] Загружен');

})();
