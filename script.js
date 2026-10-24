/* ============ NOIR Coffee — script.js ============ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ---------- 1. ФОТОГРАФИИ ----------
     Сейчас вместо фото — красивые заглушки (градиенты).
     Чтобы подставить настоящее фото: положите файл в папку images
     рядом с index.html и впишите путь, например: hero: 'images/hero.jpg'.
     Пустая строка '' = остаётся заглушка. */
  var PHOTOS = {
    hero: 'images/hero.jpg', interior: 'images/interior.jpg',
    espresso: 'images/espresso.jpg', cappuccino: 'images/cappuccino.jpg', latte: 'images/latte.jpg',
    flatwhite: 'images/flatwhite.jpg', raf: 'images/raf.jpg', matcha: 'images/matcha.jpg',
    g1: 'images/g1.jpg', g2: 'images/g2.jpg', g3: 'images/g3.jpg', g4: 'images/g4.jpg', g5: 'images/g5.jpg', g6: 'images/g6.jpg'
  };

  /* Как вставляется фото: внутрь блока добавляется <img>.
     Если файла нет (или имя написано неверно), <img> убирается
     и остаётся красивая заглушка — сайт не ломается. */
  function applyPhoto(el, key) {
    var old = el.querySelector('img');
    if (old) old.remove();
    el.classList.remove('has-image');
    var url = PHOTOS[key];
    if (!url) return;
    var img = new Image();
    img.alt = '';                       // описание уже есть у родителя (aria-label)
    img.decoding = 'async';
    img.loading = key === 'hero' ? 'eager' : 'lazy';
    if (key === 'hero') img.fetchPriority = 'high';
    img.onload = function () { el.classList.add('has-image'); };
    img.onerror = function () { img.remove(); };
    img.src = url;
    el.appendChild(img);
  }
  document.querySelectorAll('.photo[data-photo]').forEach(function (el) {
    applyPhoto(el, el.getAttribute('data-photo'));
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 2. Шапка и мобильное меню ---------- */
  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var toTop = document.getElementById('to-top');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 760) setMenu(false); });

  /* ---------- 3. Прокрутка: шапка, кнопка «наверх» ---------- */
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    var show = y > 600;
    toTop.hidden = false;
    toTop.classList.toggle('is-visible', show);
    toTop.tabIndex = show ? 0 : -1;
    toTop.setAttribute('aria-hidden', String(!show));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* Подсветка текущего раздела в меню */
  var links = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('is-current'); });
          links[en.target.id].classList.add('is-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* ---------- 4. Появление при прокрутке ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 90 + 'ms';
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 5. Фильтр меню ---------- */
  var filterBtns = document.querySelectorAll('.filter');
  var cards = document.querySelectorAll('#menu-grid .card');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      cards.forEach(function (card) {
        var match = f === 'all' || card.getAttribute('data-category') === f;
        card.classList.toggle('is-hidden', !match);
        card.classList.remove('is-entering');
        if (match && !reduceMotion) {
          void card.offsetWidth; // перезапуск анимации
          card.classList.add('is-entering');
        }
      });
    });
  });

  /* ---------- 6. Галерея и лайтбокс ---------- */
  var lightbox = document.getElementById('lightbox');
  var lbPhoto = document.getElementById('lb-photo');
  var lbCaption = document.getElementById('lb-caption');
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery__btn'));
  var current = 0;
  var lastFocus = null;

  function showItem(i) {
    current = (i + items.length) % items.length;
    var b = items[current];
    var key = b.getAttribute('data-photo-key');
    var caption = b.getAttribute('data-caption');
    lbPhoto.setAttribute('data-photo', key);
    lbPhoto.setAttribute('aria-label', caption);
    applyPhoto(lbPhoto, key);
    lbCaption.textContent = caption + ' (' + (current + 1) + ' / ' + items.length + ')';
  }
  function openLightbox(i) {
    lastFocus = document.activeElement;
    showItem(i);
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else lightbox.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (typeof lightbox.close === 'function') lightbox.close();
    else lightbox.removeAttribute('open');
  }
  items.forEach(function (b, i) { b.addEventListener('click', function () { openLightbox(i); }); });
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', function () { showItem(current - 1); });
  document.getElementById('lb-next').addEventListener('click', function () { showItem(current + 1); });
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
  lightbox.addEventListener('close', function () {
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  });
  lightbox.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') showItem(current - 1);
    if (e.key === 'ArrowRight') showItem(current + 1);
  });

  /* ---------- 7. Кнопка «Построить маршрут» ----------
     Адрес вымышленный. Перед запуском настоящего сайта замените ROUTE_QUERY
     на реальный адрес кофейни. */
  var ROUTE_QUERY = 'Примерск, ул. Демонстрационная, 12';
  document.getElementById('route-btn').addEventListener('click', function () {
    var url = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(ROUTE_QUERY);
    window.open(url, '_blank', 'noopener');
  });
})();
