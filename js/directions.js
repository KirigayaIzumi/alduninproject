/* ==========================================================================
   РУТ МИИТ — 130 лет. Страница направлений:
   фильтр по уровню подготовки + поиск по названию и коду.
   Работает поверх js/main.js (тема, меню, анимации появления).
   ========================================================================== */
(function () {
  'use strict';

  var filtersBox = document.getElementById('progFilters');
  if (!filtersBox) return;

  var chips = Array.prototype.slice.call(filtersBox.querySelectorAll('.chip'));
  var items = Array.prototype.slice.call(document.querySelectorAll('.prog-item'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.prog-group'));
  var status = document.getElementById('progStatus');
  var empty = document.getElementById('progEmpty');
  var search = document.getElementById('progSearch');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var level = 'all';
  var query = '';

  function plural(n) {
    var tail = n % 100;
    if (tail >= 11 && tail <= 14) return 'программ';
    switch (n % 10) {
      case 1: return 'программа';
      case 2:
      case 3:
      case 4: return 'программы';
      default: return 'программ';
    }
  }

  // Поисковый индекс: набор слов из кода, уровня, названия, описания и тега.
  // Ищем по началу слова — так «СПО» не находится внутри слова «транспорта»,
  // а «логист» и «23.05» находят «логистика» и «23.05.03».
  items.forEach(function (item) {
    var text = [
      '.prog-item__code strong',
      '.prog-item__code span',
      'h3',
      '.prog-item__desc',
      '.prog-item__tag'
    ].map(function (selector) {
      var el = item.querySelector(selector);
      return el ? el.textContent : '';
    }).join(' ');

    // точки в кодах (23.05.03) сохраняем, а запятые и кавычки убираем
    item.searchWords = text
      .toLowerCase()
      .replace(/[,;:()«»"'—–]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  });

  function matchesQuery(item, tokens) {
    if (!tokens.length) return true;

    return tokens.every(function (token) {
      // для длинных слов сравниваем ещё и основу без последней буквы —
      // так «безопасность» находит «безопасности», а «СПО» и «23.05» не шумят
      var stem = token.length >= 6 && /^[а-яёa-z]+$/.test(token) ? token.slice(0, -1) : token;

      return item.searchWords.some(function (word) {
        return word.indexOf(token) === 0 || (stem !== token && word.indexOf(stem) === 0);
      });
    });
  }

  function apply(isInit) {
    var shown = 0;
    var tokens = query ? query.split(/\s+/) : [];

    items.forEach(function (item) {
      var levelMatch = level === 'all' || item.getAttribute('data-level') === level;
      var match = levelMatch && matchesQuery(item, tokens);

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

    // прячем институты, в которых не осталось ни одной программы
    groups.forEach(function (group) {
      group.hidden = !group.querySelector('.prog-item:not([hidden])');
    });

    if (empty) empty.hidden = shown !== 0;

    if (status && !isInit) {
      var total = items.length;
      if (shown === total) status.textContent = 'Показаны все ' + total + ' ' + plural(total);
      else status.textContent = 'Показано ' + shown + ' из ' + total + ' ' + plural(total);
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

    level = chip.getAttribute('data-level');
    apply(false);
  });

  if (search) {
    search.addEventListener('input', function () {
      query = search.value.trim().toLowerCase().replace(/\s+/g, ' ');
      apply(false);
    });

    // Esc очищает поле поиска
    search.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !search.value) return;
      search.value = '';
      query = '';
      apply(false);
    });
  }

  // начальное состояние: разметка уже показывает все программы,
  // здесь только собираем поисковый индекс
  apply(true);
})();
