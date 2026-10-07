/* ==========================================================================
   «Рельсы Победы» — интерактив: меню, прогресс-«рельс», появление блоков
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Мобильное меню ---------- */
  var burger = doc.getElementById('burger');
  var nav = doc.getElementById('nav');

  function closeMenu() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    doc.body.classList.remove('is-locked');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      doc.body.classList.toggle('is-locked', open);
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 880) closeMenu();
    });
  }

  /* ---------- 2. Тень шапки и кнопка «наверх» ---------- */
  var header = doc.getElementById('header');
  var toTop = doc.getElementById('toTop');
  var progressBar = doc.getElementById('progressBar');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || doc.documentElement.scrollTop;
    var h = doc.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle('is-stuck', y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
    if (progressBar) progressBar.style.width = (h > 0 ? Math.min(y / h, 1) * 100 : 0) + '%';

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 3. Появление блоков при прокрутке ----------
     Блоки появляются заново каждый раз, когда снова попадают в экран:
     ушли из вида — снова прячутся, вернулись — снова проявляются. */
  var revealItems = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));

  // лёгкая каскадная задержка внутри одной группы элементов
  function staggerDelay(el) {
    if (!el.parentElement) return 0;
    var siblings = Array.prototype.slice.call(el.parentElement.children).filter(function (n) {
      return n.classList && n.classList.contains('reveal');
    });
    var idx = siblings.indexOf(el);
    return idx > 0 ? Math.min(idx, 6) * 70 : 0;
  }

  function showReveal(el) {
    el.style.transition = '';                        // возвращаем анимацию
    el.style.transitionDelay = staggerDelay(el) + 'ms';
    void el.offsetWidth;                             // сбрасываем стили, чтобы переход сработал
    el.classList.add('is-in');
  }

  function hideReveal(el) {
    el.style.transition = 'none';                    // прячем мгновенно, пока блок за экраном
    el.classList.remove('is-in');
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    // При отключённой анимации ничего не скрываем — контент просто виден
    revealItems.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) showReveal(entry.target);
        else hideReveal(entry.target);
      });
    }, { threshold: 0.05 });

    revealItems.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. Подсветка активного раздела в навигации ---------- */
  var sections = Array.prototype.slice.call(doc.querySelectorAll('main section[id]'));
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav__list a[href^="#"]'));

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
    });
  }

  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 5. Актуальный год в подвале ---------- */
  var yearEl = doc.getElementById('year');
  if (yearEl) {
    var now = new Date().getFullYear();
    yearEl.textContent = now > 2020 ? String(now) : '2025';
  }

  /* ---------- 6. Плавный переход по внутренним ссылкам (с учётом шапки) ---------- */
  doc.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;

    var id = link.getAttribute('href');
    if (!id || id === '#') return;

    var target = doc.querySelector(id);
    if (!target) return;

    e.preventDefault();
    var headerH = header ? header.offsetHeight : 0;
    var top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;

    window.scrollTo({ top: Math.max(top, 0), behavior: reduceMotion ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* ---------- 7. Тема оформления: светлая / тёмная ---------- */
  var root = doc.documentElement;
  var themeToggle = doc.getElementById('themeToggle');
  var themeColor = doc.getElementById('themeColor');
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function storedTheme() {
    try { return localStorage.getItem('rp-theme'); } catch (e) { return null; }
  }

  function storeTheme(value) {
    try {
      if (value) localStorage.setItem('rp-theme', value);
      else localStorage.removeItem('rp-theme');
    } catch (e) { /* приватный режим — просто не запоминаем */ }
  }

  function resolveTheme(pref) {
    if (pref === 'light' || pref === 'dark') return pref;
    return (darkQuery && darkQuery.matches) ? 'dark' : 'light';
  }

  function applyTheme(pref) {
    var theme = resolveTheme(pref);
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-theme-source', pref ? 'manual' : 'auto');

    if (themeColor) themeColor.setAttribute('content', theme === 'dark' ? '#131013' : '#87011A');

    if (themeToggle) {
      var nextName = theme === 'dark' ? 'светлую' : 'тёмную';
      themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      themeToggle.setAttribute('aria-label', 'Включить ' + nextName + ' тему');
      themeToggle.setAttribute('title', 'Включить ' + nextName + ' тему');
    }
  }

  applyTheme(storedTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      storeTheme(next);
      applyTheme(next);
    });
  }

  // Если пользователь не выбирал тему вручную — следим за темой системы
  if (darkQuery) {
    var onSystemThemeChange = function () { if (!storedTheme()) applyTheme(null); };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSystemThemeChange);
    else if (darkQuery.addListener) darkQuery.addListener(onSystemThemeChange);
  }

  /* ---------- 8. Старт страницы с самого верха ----------
     Браузер при перезагрузке восстанавливает прежнюю позицию прокрутки
     (и переходит к якорю из адресной строки), из-за чего страница
     открывалась не сверху. Здесь это поведение отключается. */

  function jumpToTop() {
    var htmlStyle = doc.documentElement.style;
    var prev = htmlStyle.scrollBehavior;
    htmlStyle.scrollBehavior = 'auto';   // без плавной прокрутки
    if (window.scrollTo) window.scrollTo(0, 0);
    htmlStyle.scrollBehavior = prev || '';
  }

  function isPageReload() {
    try {
      var entries = window.performance && window.performance.getEntriesByType
        ? window.performance.getEntriesByType('navigation') : null;
      if (entries && entries.length && entries[0].type) return entries[0].type === 'reload';
      // запасной вариант для старых браузеров
      if (window.performance && window.performance.navigation) {
        return window.performance.navigation.type === 1;
      }
    } catch (e) { /* не критично */ }
    return false;
  }

  function startAtTop() {
    // Явную ссылку с якорем уважаем, а при перезагрузке или обычном
    // открытии всегда показываем начало страницы.
    if (isPageReload() || !window.location.hash) jumpToTop();
  }

  startAtTop();
  // повторно — когда подгрузятся шрифты и картинки и вёрстка «устоится»
  window.addEventListener('load', startAtTop);

  /* ---------- 9. Флаг успешной инициализации ---------- */
  window.__RP_READY = true;
})();
