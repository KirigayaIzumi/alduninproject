/* ==========================================================================
   РУТ МИИТ — 130 лет. Страница расписания: фильтр по типу мероприятий.
   Работает поверх js/main.js (тема, меню, анимации появления).
   ========================================================================== */
(function () {
  'use strict';

  var filtersBox = document.getElementById('schedFilters');
  if (!filtersBox) return;

  var chips = Array.prototype.slice.call(filtersBox.querySelectorAll('.chip'));
  var items = Array.prototype.slice.call(document.querySelectorAll('.sched-item'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.sched-group'));
  var status = document.getElementById('schedStatus');
  var empty = document.querySelector('.sched-empty');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function plural(n) {
    var tail = n % 100;
    if (tail >= 11 && tail <= 14) return 'событий';
    switch (n % 10) {
      case 1: return 'событие';
      case 2:
      case 3:
      case 4: return 'события';
      default: return 'событий';
    }
  }

  function apply(filter, isInit) {
    var shown = 0;

    items.forEach(function (item) {
      var match = filter === 'all' || item.getAttribute('data-cat') === filter;
      item.hidden = !match;
      if (!match) return;
      shown++;

      // страховка: если блок уже в кадре, а наблюдатель появления не сработал
      // (например, элемент только что вышел из display:none) — показываем сразу
      if (!reduceMotion && !item.classList.contains('is-visible')) {
        var box = item.getBoundingClientRect();
        if (box.top < window.innerHeight && box.bottom > 0) item.classList.add('is-visible');
      }
    });

    // прячем месяцы, в которых не осталось событий
    groups.forEach(function (group) {
      group.hidden = !group.querySelector('.sched-item:not([hidden])');
    });

    if (empty) empty.hidden = shown !== 0;

    if (status && !isInit) {
      status.textContent = filter === 'all'
        ? 'Показаны все ' + shown + ' ' + plural(shown)
        : 'Показано ' + shown + ' из ' + items.length + ' ' + plural(items.length);
    }
  }

  filtersBox.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip || !filtersBox.contains(chip)) return;

    chips.forEach(function (c) {
      var isActive = c === chip;
      c.classList.toggle('is-active', isActive);
      c.setAttribute('aria-pressed', String(isActive));
    });

    apply(chip.getAttribute('data-filter'), false);
  });

  // начальное состояние: разметка уже показывает все события,
  // здесь только синхронизируем подпись статуса
  apply('all', true);
})();
