(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll lock: plain overflow:hidden on body doesn't reliably stop background
     scroll/rubber-banding on iOS Safari, so pin body in place instead and restore
     the scroll position on unlock. Counted so nested locks (e.g. nav + modal) don't
     unlock each other early. */
  var scrollLockCount = 0;
  var savedScrollY = 0;
  function lockScroll() {
    if (scrollLockCount === 0) {
      savedScrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + savedScrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
    }
    scrollLockCount++;
  }
  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, savedScrollY);
    }
  }

  /* Header scroll shadow */
  var header = document.getElementById('header');
  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }
  if (header) {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Float actions: hidden while the hero (with its own call/WhatsApp CTAs) is in view */
  var floatActions = document.querySelector('.float-actions');
  var heroEl = document.querySelector('.hero');
  function onScrollFloatActions() {
    var pastHero = heroEl.getBoundingClientRect().bottom <= 0;
    floatActions.classList.toggle('is-hidden', !pastHero);
  }
  if (floatActions && heroEl) {
    window.addEventListener('scroll', onScrollFloatActions, { passive: true });
    onScrollFloatActions();
  }

  /* Mobile nav */
  var nav = document.getElementById('primary-nav');
  var navToggle = document.getElementById('nav-toggle');
  var navClose = document.getElementById('nav-close');

  var navIsOpen = false;
  function openNav() {
    nav.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    lockScroll();
    navIsOpen = true;
  }
  function closeNav() {
    if (!navIsOpen) { return; }
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    unlockScroll();
    navIsOpen = false;
  }
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var isOpen = nav.classList.contains('is-open');
      if (isOpen) { closeNav(); } else { openNav(); }
    });
  }
  if (navClose) { navClose.addEventListener('click', closeNav); }
  document.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { closeNav(); }
  });

  /* Scrollspy */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute('href').replace('#', '');
      return document.getElementById(id);
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) { return; }
          var id = entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach(function (section) { spy.observe(section); });
  }

  /* Scroll reveal */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && !reduceMotion && revealEls.length) {
    var reveal = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { reveal.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Gallery lightbox */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxClose = document.getElementById('lightbox-close');
  var lightboxPrev = document.getElementById('lightbox-prev');
  var lightboxNext = document.getElementById('lightbox-next');
  var currentIndex = 0;
  var lastFocused = null;

  function openLightbox(index) {
    currentIndex = index;
    var img = galleryItems[index].querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    lockScroll();
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    unlockScroll();
    if (lastFocused) { lastFocused.focus(); }
  }
  function showRelative(offset) {
    currentIndex = (currentIndex + offset + galleryItems.length) % galleryItems.length;
    var img = galleryItems[currentIndex].querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
  }

  galleryItems.forEach(function (item, index) {
    item.addEventListener('click', function () { openLightbox(index); });
  });
  if (lightboxClose) { lightboxClose.addEventListener('click', closeLightbox); }
  if (lightboxPrev) { lightboxPrev.addEventListener('click', function () { showRelative(-1); }); }
  if (lightboxNext) { lightboxNext.addEventListener('click', function () { showRelative(1); }); }
  if (lightbox) {
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) { closeLightbox(); }
    });
  }
  document.addEventListener('keydown', function (event) {
    if (lightbox.hidden) { return; }
    if (event.key === 'Escape') { closeLightbox(); }
    if (event.key === 'ArrowLeft') { showRelative(-1); }
    if (event.key === 'ArrowRight') { showRelative(1); }
  });

  /* Booking modal */
  var bookingOpenBtn = document.getElementById('booking-open');
  var bookingModal = document.getElementById('booking-modal');
  var bookingClose = document.getElementById('booking-modal-close');
  var bookingIframe = document.getElementById('booking-iframe');
  var bookingLastFocused = null;

  function openBookingModal() {
    if (!bookingIframe.src && bookingIframe.dataset.src) {
      bookingIframe.src = bookingIframe.dataset.src;
    }
    bookingLastFocused = document.activeElement;
    bookingModal.hidden = false;
    lockScroll();
    bookingClose.focus();
  }
  function closeBookingModal() {
    bookingModal.hidden = true;
    unlockScroll();
    if (bookingLastFocused) { bookingLastFocused.focus(); }
  }

  if (bookingOpenBtn) { bookingOpenBtn.addEventListener('click', openBookingModal); }
  if (bookingClose) { bookingClose.addEventListener('click', closeBookingModal); }
  if (bookingModal) {
    bookingModal.addEventListener('click', function (event) {
      if (event.target === bookingModal) { closeBookingModal(); }
    });
  }
  document.addEventListener('keydown', function (event) {
    if (bookingModal && !bookingModal.hidden && event.key === 'Escape') { closeBookingModal(); }
  });

  /* Footer year */
  var yearEl = document.getElementById('footer-year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }
})();
