// Emotion Iceberg Reflection: authored prompts, not a diagnostic assessment.
(function() {
  'use strict';

  const SURFACE_ORDER = ['calm', 'cheerful', 'indifferent', 'confident'];
  const DEEP_ORDER = ['angry', 'passionate', 'lonely', 'sad', 'tender', 'anxious', 'fearful', 'confused', 'calm'];
  const TYPE_BY_DEEP = {
    angry: 'volcano', passionate: 'volcano', lonely: 'aurora', sad: 'aurora',
    tender: 'coral', anxious: 'coral', fearful: 'abyss', confused: 'fog', calm: 'crystal'
  };
  const TOTAL_QUESTIONS = 10;
  const answers = { surface: [], deep: [] };
  const emittedEvents = new Set();
  let currentQuestion = 0;
  let currentStep = 'surface';
  let isTransitioning = false;
  let hasCompleted = false;
  let lastResult = null;

  window.EmotionReflectionContract = Object.freeze({
    totalQuestions: TOTAL_QUESTIONS,
    selectionsPerQuestion: 2,
    surfaceOrder: [...SURFACE_ORDER],
    deepOrder: [...DEEP_ORDER],
    typeByDeep: { ...TYPE_BY_DEEP }
  });

  const $ = id => document.getElementById(id);
  const t = (key, fallback) => window.i18n?.t ? window.i18n.t(key, fallback) : (fallback || key);

  function trackOnce(name) {
    if (emittedEvents.has(name)) return;
    emittedEvents.add(name);
    if (typeof gtag === 'function') gtag('event', name);
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    const screen = $(id);
    if (!screen) return;
    screen.classList.add('active', 'screen-enter');
    setTimeout(() => screen.classList.remove('screen-enter'), 500);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getOptions(index, layer) {
    return Array.from({ length: 4 }, (_, option) => ({
      text: t(`questions.q${index}.${layer}${option}.text`, `Option ${option + 1}`),
      emoji: t(`questions.q${index}.${layer}${option}.emoji`, ''),
      emotion: t(`questions.q${index}.${layer}${option}.emotion`, 'calm')
    }));
  }

  function startReflection() {
    currentQuestion = 0;
    currentStep = 'surface';
    answers.surface = [];
    answers.deep = [];
    isTransitioning = false;
    hasCompleted = false;
    lastResult = null;
    showScreen('question-screen');
    renderQuestion();
    trackOnce('emotion_reflection_start');
  }

  function renderQuestion() {
    const scenario = t(`questions.q${currentQuestion}.scenario`, `Scenario ${currentQuestion + 1}`);
    const progress = ((currentQuestion * 2 + (currentStep === 'deep' ? 1 : 0)) / (TOTAL_QUESTIONS * 2)) * 100;
    $('progress-bar').style.width = `${progress}%`;
    $('question-counter').textContent = `${currentQuestion + 1} / ${TOTAL_QUESTIONS}`;
    $('question-text').textContent = scenario;

    const stepIndicator = $('step-indicator');
    stepIndicator.className = `step-indicator ${currentStep}`;
    stepIndicator.querySelector('.step-label').textContent = currentStep === 'surface'
      ? t('question.surfaceStep', 'Outward response')
      : t('question.deepStep', 'Inner response');
    const layerLabel = $('layer-label');
    layerLabel.className = `layer-label ${currentStep}`;
    $('layer-text').textContent = currentStep === 'surface'
      ? t('question.surfaceQ', 'Which response would you most likely show?')
      : t('question.deepQ', 'Which feeling word would you choose for yourself?');

    const options = getOptions(currentQuestion, currentStep);
    const grid = $('options-grid');
    grid.innerHTML = '';
    options.forEach(option => {
      const button = document.createElement('button');
      button.className = 'option-btn';
      const emoji = document.createElement('span');
      emoji.className = 'option-emoji';
      emoji.textContent = option.emoji;
      const label = document.createElement('span');
      label.textContent = option.text;
      button.append(emoji, label);
      button.addEventListener('click', () => selectOption(option.emotion, button));
      grid.appendChild(button);
    });
    updateMiniIceberg();
  }

  function selectOption(emotion, button) {
    if (isTransitioning) return;
    isTransitioning = true;
    document.querySelectorAll('.option-btn').forEach(control => {
      control.disabled = true;
      control.classList.toggle('selected', control === button);
    });
    setTimeout(() => {
      if (currentStep === 'surface') {
        answers.surface.push(emotion);
        currentStep = 'deep';
        isTransitioning = false;
        renderQuestion();
        return;
      }
      answers.deep.push(emotion);
      if (currentQuestion === 4) trackOnce('emotion_reflection_halfway');
      currentQuestion += 1;
      currentStep = 'surface';
      isTransitioning = false;
      if (currentQuestion >= TOTAL_QUESTIONS) showResult();
      else renderQuestion();
    }, 200);
  }

  function updateMiniIceberg() {
    const addDots = (container, values, startY, color) => {
      container.innerHTML = '';
      values.forEach((value, index) => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', 60 + (index % 5) * 20);
        dot.setAttribute('cy', startY + Math.floor(index / 5) * 12);
        dot.setAttribute('r', '3');
        dot.setAttribute('fill', color);
        dot.setAttribute('opacity', '0.7');
        container.appendChild(dot);
      });
    };
    addDots($('surface-tags'), answers.surface, 30, '#7ED6F5');
    addDots($('deep-tags'), answers.deep, 75, '#2E86AB');
  }

  function rank(values, order) {
    return order
      .map(emotion => ({ emotion, count: values.filter(value => value === emotion).length }))
      .sort((left, right) => right.count - left.count || order.indexOf(left.emotion) - order.indexOf(right.emotion))
      .filter(item => item.count > 0)
      .slice(0, 3)
      .map(item => item.emotion);
  }

  function calculateResult() {
    const topSurface = rank(answers.surface, SURFACE_ORDER);
    const topDeep = rank(answers.deep, DEEP_ORDER);
    const primaryDeep = topDeep[0] || 'calm';
    return { type: TYPE_BY_DEEP[primaryDeep] || 'crystal', topSurface, topDeep };
  }

  function showResult() {
    lastResult = calculateResult();
    hasCompleted = true;
    showScreen('result-screen');
    renderResult(lastResult);
    trackOnce('emotion_reflection_complete');
  }

  function renderResult(result) {
    $('result-type-name').textContent = t(`results.${result.type}.name`, result.type);
    $('result-type-desc').textContent = t(`results.${result.type}.desc`, 'An authored reflection label.');
    const surface = t(`emotions.${result.topSurface[0]}`, result.topSurface[0] || '—');
    const deep = t(`emotions.${result.topDeep[0]}`, result.topDeep[0] || '—');
    $('result-narrative').textContent = t('result.narrative', 'Most selected outward word: {surface}. Most selected inner word: {deep}.')
      .replace('{surface}', surface).replace('{deep}', deep);
    placeResultTags(result);
  }

  function placeResultTags(result) {
    const surfacePositions = [{ x: 180, y: 80 }, { x: 155, y: 105 }, { x: 205, y: 105 }];
    const deepPositions = [{ x: 180, y: 210 }, { x: 130, y: 250 }, { x: 230, y: 250 }];
    const draw = (container, values, positions, className) => {
      container.innerHTML = '';
      values.forEach((emotion, index) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', positions[index].x);
        text.setAttribute('y', positions[index].y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', `emotion-tag ${className}`);
        text.setAttribute('font-size', className === 'surface' ? '11' : '13');
        text.textContent = t(`emotions.${emotion}`, emotion);
        container.appendChild(text);
      });
    };
    draw($('result-surface-tags'), result.topSurface, surfacePositions, 'surface');
    draw($('result-deep-tags'), result.topDeep, deepPositions, 'deep');
  }

  async function shareReflection() {
    const data = {
      title: t('app.title', 'Emotion Iceberg Reflection'),
      text: t('share.text', 'Try this ten-scenario emotion-word reflection.'),
      url: 'https://dopabrain.com/emotion-iceberg/'
    };
    const status = $('share-status');
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(`${data.text} ${data.url}`);
      if (status) status.textContent = t('share.success', 'Link copied.');
      trackOnce('emotion_share_success');
    } catch (error) {
      if (error?.name !== 'AbortError' && status) status.textContent = t('share.unavailable', 'Sharing is unavailable.');
    }
  }

  function sanitizeUrl() {
    const url = new URL(location.href);
    const lang = url.searchParams.get('lang');
    const clean = new URL(url.origin + url.pathname);
    if (lang && ['ko','en','zh','hi','ru','ja','es','pt','id','tr','de','fr'].includes(lang)) clean.searchParams.set('lang', lang);
    if (clean.href !== url.href) history.replaceState(null, '', clean.pathname + clean.search);
  }

  function syncLocalizedActions() {
    const lang = window.i18n?.currentLang || 'en';
    $('next-emotion-action')?.setAttribute('href', `/portal/tools/emotion-regulation-planner.html?lang=${lang}`);
    $('next-stress-check')?.setAttribute('href', `/stress-check/?lang=${lang}`);
  }

  window.onLanguageChange = function() {
    window.i18n?.applyTranslations();
    syncLocalizedActions();
    if ($('question-screen')?.classList.contains('active') && !isTransitioning) renderQuestion();
    if (lastResult) renderResult(lastResult);
  };

  function init() {
    $('start-btn')?.addEventListener('click', startReflection);
    $('share-reflection')?.addEventListener('click', shareReflection);
    $('next-emotion-action')?.addEventListener('click', () => trackOnce('emotion_planner_click'));
    $('next-stress-check')?.addEventListener('click', () => trackOnce('emotion_stress_click'));
    $('retry-btn')?.addEventListener('click', () => {
      if (!hasCompleted) return;
      trackOnce('emotion_reflection_retry');
      hasCompleted = false;
      showScreen('start-screen');
    });

    const started = Date.now();
    const waitForI18n = setInterval(() => {
      if (window.i18n?.initialized || Date.now() - started > 2000) {
        clearInterval(waitForI18n);
        sanitizeUrl();
        syncLocalizedActions();
        const loader = $('app-loader');
        if (loader) {
          loader.classList.add('hidden');
          setTimeout(() => { loader.style.display = 'none'; }, 400);
        }
        document.body.dataset.emotionAppReady = 'true';
      }
    }, 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
