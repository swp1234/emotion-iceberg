// i18n module with try-catch safety wrapper
(function() {
  'use strict';
  try {
    const SUPPORTED_LANGS = ['ko','en','zh','hi','ru','ja','es','pt','id','tr','de','fr'];
    const DEFAULT_LANG = 'ko';

    const i18n = {
      translations: {},
      currentLang: DEFAULT_LANG,
      initialized: false,

      async init() {
        try {
          const browserLang = (navigator.language || '').slice(0, 2).toLowerCase();
          const saved = localStorage.getItem('preferred-lang');
          this.currentLang = saved && SUPPORTED_LANGS.includes(saved) ? saved
            : SUPPORTED_LANGS.includes(browserLang) ? browserLang
            : DEFAULT_LANG;
          await this.loadTranslations(this.currentLang);
          this.applyTranslations();
          this.initialized = true;
          document.documentElement.lang = this.currentLang;
          this.renderLangSelector();
        } catch (e) {
          console.warn('i18n init failed, using defaults:', e);
          this.initialized = true;
        }
      },

      async loadTranslations(lang) {
        try {
          const res = await fetch(`js/locales/${lang}.json`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          this.translations = await res.json();
        } catch (e) {
          if (lang !== DEFAULT_LANG) {
            await this.loadTranslations(DEFAULT_LANG);
          }
        }
      },

      t(key, fallback) {
        const keys = key.split('.');
        let val = this.translations;
        for (const k of keys) {
          if (val && typeof val === 'object' && k in val) val = val[k];
          else return fallback || key;
        }
        return typeof val === 'string' ? val : (fallback || key);
      },

      applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
          const key = el.getAttribute('data-i18n');
          const text = this.t(key);
          if (text !== key) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
              el.placeholder = text;
            } else if (el.hasAttribute('content')) {
              el.setAttribute('content', text);
            } else {
              el.textContent = text;
            }
          }
        });
      },

      async switchLang(lang) {
        if (!SUPPORTED_LANGS.includes(lang)) return;
        this.currentLang = lang;
        localStorage.setItem('preferred-lang', lang);
        await this.loadTranslations(lang);
        this.applyTranslations();
        document.documentElement.lang = lang;
        if (typeof window.onLanguageChange === 'function') {
          window.onLanguageChange(lang);
        }
      },

      renderLangSelector() {
        const container = document.getElementById('lang-selector');
        if (!container) return;
        const labels = {ko:'KO',en:'EN',zh:'ZH',hi:'HI',ru:'RU',ja:'JA',es:'ES',pt:'PT',id:'ID',tr:'TR',de:'DE',fr:'FR'};
        container.innerHTML = '';
        const select = document.createElement('select');
        select.className = 'lang-select';
        select.setAttribute('aria-label', 'Language');
        SUPPORTED_LANGS.forEach(lang => {
          const opt = document.createElement('option');
          opt.value = lang;
          opt.textContent = labels[lang] || lang.toUpperCase();
          if (lang === this.currentLang) opt.selected = true;
          select.appendChild(opt);
        });
        select.addEventListener('change', (e) => this.switchLang(e.target.value));
        container.appendChild(select);
      }
    };

    window.i18n = i18n;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => i18n.init());
    } else {
      i18n.init();
    }
  } catch (e) {
    console.error('i18n IIFE error:', e);
  }
})();
