/* ==========================================================================
   РУТ МИИТ — 130 лет. Скрипты лендинга.
   Без внешних зависимостей: тема, меню, тень шапки, анимации, счётчики.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  /* ============================ ТЁМНАЯ ТЕМА ============================== */
  var STORAGE_KEY = 'rut-miit-theme';
  var themeSwitch = document.getElementById('themeSwitch');
  var themeColor = document.getElementById('themeColor');

  function savedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveTheme(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* приватный режим */ }
  }

  function applyTheme(theme, persist) {
    var isDark = theme === 'dark';
    root.setAttribute('data-theme', theme);

    if (themeSwitch) {
      themeSwitch.setAttribute('aria-checked', String(isDark));
      themeSwitch.setAttribute('aria-label', isDark ? 'Светлая тема' : 'Тёмная тема');
      themeSwitch.setAttribute('title', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
    }
    if (themeColor) themeColor.setAttribute('content', isDark ? '#070f1a' : '#0056bd');
    if (persist) saveTheme(theme);
  }

  // тема уже выставлена инлайн-скриптом в <head> — синхронизируем состояние переключателя
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

  if (themeSwitch) {
    themeSwitch.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
    });
  }

  // если пользователь ещё не выбирал тему вручную — следуем за настройкой системы
  function onSystemChange(e) {
    if (!savedTheme()) applyTheme(e.matches ? 'dark' : 'light', false);
  }
  if (prefersDark.addEventListener) prefersDark.addEventListener('change', onSystemChange);
  else if (prefersDark.addListener) prefersDark.addListener(onSystemChange);

  /* ============================ МОБИЛЬНОЕ МЕНЮ =========================== */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  var backdrop = document.getElementById('navBackdrop');

  var backdropTimer = null;

  function setNav(open) {
    if (!nav || !burger) return;

    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('is-locked', open);

    if (backdrop) {
      clearTimeout(backdropTimer);
      if (open) {
        backdrop.hidden = false;
        // кадр задержки, чтобы сработал transition прозрачности
        requestAnimationFrame(function () { backdrop.classList.add('is-visible'); });
      } else {
        backdrop.classList.remove('is-visible');
        // прячем подложку только после затухания
        backdropTimer = setTimeout(function () { backdrop.hidden = true; }, 320);
      }
    }
  }

  function closeNav(returnFocus) {
    if (!nav || !nav.classList.contains('is-open')) return;
    setNav(false);
    if (returnFocus && burger) burger.focus();
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      setNav(!nav.classList.contains('is-open'));
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav(false);
    });

    if (backdrop) backdrop.addEventListener('click', function () { closeNav(true); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav(true);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080) closeNav(false);
    });
  }

  /* ========================= ТЕНЬ ШАПКИ ПРИ СКРОЛЛЕ ====================== */
  var header = document.getElementById('header');
  function onScroll() {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ====================== ПОЯВЛЕНИЕ БЛОКОВ ПРИ СКРОЛЛЕ ==================
     Анимация проигрывается заново при каждом входе блока в кадр: как только
     блок полностью ушёл за пределы экрана, состояние сбрасывается.          */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    // вход в кадр: появляемся, когда блок зашёл в экран примерно на 10 %
    var showObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.transitionDelay = Math.min(i * 70, 280) + 'ms'; // лёгкая каскадность
        el.classList.add('is-visible');
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

    // выход из кадра: сбрасываем только когда блок целиком скрылся,
    // чтобы не было «мигания» у края экрана
    var hideObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) return;
        entry.target.classList.remove('is-visible');
        entry.target.style.transitionDelay = '';
      });
    }, { threshold: 0 });

    revealEls.forEach(function (el) {
      showObserver.observe(el);
      hideObserver.observe(el);
    });
  }

  /* ============================ СЧЁТЧИКИ ЦИФР =========================== */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';

    if (reduceMotion) { el.textContent = target + suffix; return; }

    var duration = 1400;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var statNums = Array.prototype.slice.call(document.querySelectorAll('.stats__num'));
  var statsBlock = document.getElementById('stats');

  if (statsBlock && statNums.length && 'IntersectionObserver' in window) {
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        statNums.forEach(animateCount);
        statsObserver.disconnect();
      });
    }, { threshold: 0.35 });
    statsObserver.observe(statsBlock);
  } else {
    statNums.forEach(function (el) {
      el.textContent = (el.getAttribute('data-count') || '') + (el.getAttribute('data-suffix') || '');
    });
  }

  /* =================== ПОДСВЕТКА АКТИВНОГО ПУНКТА МЕНЮ ================== */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav a[href^="#"]:not(.nav__cta)')
  );
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { activeObserver.observe(s); });
  }
})();
