// Emotion Iceberg Test - Main Application
(function() {
  'use strict';

  // Emotion categories used for scoring
  const EMOTIONS = {
    calm: 'calm',
    cheerful: 'cheerful',
    indifferent: 'indifferent',
    confident: 'confident',
    angry: 'angry',
    anxious: 'anxious',
    lonely: 'lonely',
    sad: 'sad',
    passionate: 'passionate',
    tender: 'tender',
    confused: 'confused',
    fearful: 'fearful'
  };

  // Surface emotions (shown above water)
  const SURFACE_EMOTIONS = ['calm', 'cheerful', 'indifferent', 'confident'];
  // Deep emotions (hidden below water)
  const DEEP_EMOTIONS = ['angry', 'anxious', 'lonely', 'sad', 'passionate', 'tender', 'confused', 'fearful'];

  // Result types
  const RESULT_TYPES = {
    volcano: {
      surfaceDominant: ['calm', 'indifferent'],
      deepDominant: ['angry', 'passionate'],
      gapRange: [6, 10]
    },
    aurora: {
      surfaceDominant: ['cheerful', 'confident'],
      deepDominant: ['lonely', 'sad'],
      gapRange: [5, 10]
    },
    coral: {
      surfaceDominant: ['confident', 'indifferent'],
      deepDominant: ['tender', 'anxious'],
      gapRange: [4, 10]
    },
    abyss: {
      surfaceDominant: ['indifferent', 'calm'],
      deepDominant: ['sad', 'fearful', 'lonely'],
      gapRange: [5, 10]
    },
    crystal: {
      surfaceDominant: [],
      deepDominant: [],
      gapRange: [0, 3]
    },
    fog: {
      surfaceDominant: [],
      deepDominant: ['confused', 'anxious'],
      gapRange: [0, 10]
    }
  };

  // State
  let currentQuestion = 0;
  let currentStep = 'surface'; // 'surface' or 'deep'
  const answers = { surface: [], deep: [] };
  const TOTAL_QUESTIONS = 10;

  // Wait for i18n
  function t(key, fallback) {
    return window.i18n && window.i18n.t ? window.i18n.t(key, fallback) : (fallback || key);
  }

  // Get questions from i18n
  function getQuestions() {
    const questions = [];
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      questions.push({
        scenario: t(`questions.q${i}.scenario`, `Scenario ${i + 1}`),
        surfaceOptions: getOptions(i, 'surface'),
        deepOptions: getOptions(i, 'deep')
      });
    }
    return questions;
  }

  function getOptions(qIndex, layer) {
    const options = [];
    for (let j = 0; j < 4; j++) {
      options.push({
        text: t(`questions.q${qIndex}.${layer}${j}.text`, `Option ${j + 1}`),
        emoji: t(`questions.q${qIndex}.${layer}${j}.emoji`, ''),
        emotion: t(`questions.q${qIndex}.${layer}${j}.emotion`, 'calm')
      });
    }
    return options;
  }

  // DOM elements
  const $ = id => document.getElementById(id);

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = $(id);
    screen.classList.add('active');
    screen.classList.add('screen-enter');
    setTimeout(() => screen.classList.remove('screen-enter'), 500);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Start
  function startTest() {
    currentQuestion = 0;
    currentStep = 'surface';
    answers.surface = [];
    answers.deep = [];
    showScreen('question-screen');
    renderQuestion();
  }

  // Render question
  function renderQuestion() {
    const questions = getQuestions();
    const q = questions[currentQuestion];

    // Update progress
    const progress = ((currentQuestion * 2 + (currentStep === 'deep' ? 1 : 0)) / (TOTAL_QUESTIONS * 2)) * 100;
    $('progress-bar').style.width = progress + '%';
    $('question-counter').textContent = `${currentQuestion + 1} / ${TOTAL_QUESTIONS}`;

    // Mid-quiz encouragement at question 5
    const encourageEl = $('mid-quiz-encouragement');
    if (encourageEl) {
      if (currentQuestion === 4 && currentStep === 'deep') {
        encourageEl.style.display = 'block';
      } else if (currentQuestion > 5) {
        encourageEl.style.display = 'none';
      }
    }

    // Update step indicator
    const stepIndicator = $('step-indicator');
    const stepLabel = stepIndicator.querySelector('.step-label');
    if (currentStep === 'surface') {
      stepIndicator.className = 'step-indicator surface';
      stepLabel.textContent = t('question.surfaceStep', 'Surface Reaction');
    } else {
      stepIndicator.className = 'step-indicator deep';
      stepLabel.textContent = t('question.deepStep', 'Hidden Feeling');
    }

    // Update question text
    $('question-text').textContent = q.scenario;

    // Update layer label
    const layerLabel = $('layer-label');
    const layerText = $('layer-text');
    if (currentStep === 'surface') {
      layerLabel.className = 'layer-label surface';
      layerText.textContent = t('question.surfaceQ', 'How do you react on the outside?');
    } else {
      layerLabel.className = 'layer-label deep';
      layerText.textContent = t('question.deepQ', 'What do you actually feel inside?');
    }

    // Render options
    const options = currentStep === 'surface' ? q.surfaceOptions : q.deepOptions;
    const grid = $('options-grid');
    grid.innerHTML = '';
    options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `<span class="option-emoji">${opt.emoji}</span><span>${opt.text}</span>`;
      btn.addEventListener('click', () => selectOption(opt.emotion, i));
      grid.appendChild(btn);
    });

    // Update mini iceberg
    updateMiniIceberg();
  }

  function selectOption(emotion, index) {
    // Visual feedback
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(b => b.classList.remove('selected'));
    btns[index].classList.add('selected');

    setTimeout(() => {
      if (currentStep === 'surface') {
        answers.surface.push(emotion);
        currentStep = 'deep';
        // Celebration flash when switching to deep questions
        const card = document.querySelector('.question-card');
        if (card) {
          card.classList.add('celebration-flash');
          setTimeout(() => card.classList.remove('celebration-flash'), 500);
        }
        renderQuestion();
      } else {
        answers.deep.push(emotion);
        currentStep = 'surface';
        currentQuestion++;
        if (currentQuestion >= TOTAL_QUESTIONS) {
          showResult();
        } else {
          renderQuestion();
        }
      }
    }, 200);
  }

  // Mini iceberg tag positions
  function updateMiniIceberg() {
    const surfaceTags = $('surface-tags');
    const deepTags = $('deep-tags');
    surfaceTags.innerHTML = '';
    deepTags.innerHTML = '';

    // Show answered surface emotions as tiny dots above water
    answers.surface.forEach((em, i) => {
      const x = 70 + (i % 5) * 15;
      const y = 30 + Math.floor(i / 5) * 10;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', '#7ED6F5');
      circle.setAttribute('opacity', '0.7');
      surfaceTags.appendChild(circle);
    });

    // Show answered deep emotions as dots below water
    answers.deep.forEach((em, i) => {
      const x = 60 + (i % 5) * 18;
      const y = 75 + Math.floor(i / 5) * 15;
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', '#2E86AB');
      circle.setAttribute('opacity', '0.7');
      deepTags.appendChild(circle);
    });
  }

  // Calculate result
  function calculateResult() {
    // Count surface and deep emotion frequencies
    const surfaceCounts = {};
    const deepCounts = {};
    answers.surface.forEach(e => { surfaceCounts[e] = (surfaceCounts[e] || 0) + 1; });
    answers.deep.forEach(e => { deepCounts[e] = (deepCounts[e] || 0) + 1; });

    // Top surface and deep emotions
    const topSurface = Object.entries(surfaceCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
    const topDeep = Object.entries(deepCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);

    // Calculate gap score (how different surface vs deep are)
    let gapScore = 0;
    for (let i = 0; i < answers.surface.length; i++) {
      const s = answers.surface[i];
      const d = answers.deep[i];
      // Same category = 0, same family = 0.5, different = 1
      if (s === d) {
        gapScore += 0;
      } else if (
        (SURFACE_EMOTIONS.includes(s) && SURFACE_EMOTIONS.includes(d)) ||
        (DEEP_EMOTIONS.includes(s) && DEEP_EMOTIONS.includes(d))
      ) {
        gapScore += 0.5;
      } else {
        gapScore += 1;
      }
    }

    // Determine result type
    let resultType = 'crystal';

    if (gapScore <= 3) {
      resultType = 'crystal';
    } else if (topDeep.includes('confused') && topDeep.includes('anxious')) {
      resultType = 'fog';
    } else if (topSurface.some(e => ['calm', 'indifferent'].includes(e)) && topDeep.some(e => ['angry', 'passionate'].includes(e))) {
      resultType = 'volcano';
    } else if (topSurface.some(e => ['cheerful', 'confident'].includes(e)) && topDeep.some(e => ['lonely', 'sad'].includes(e))) {
      resultType = 'aurora';
    } else if (topSurface.some(e => ['confident', 'indifferent'].includes(e)) && topDeep.some(e => ['tender', 'anxious'].includes(e))) {
      resultType = 'coral';
    } else if (topSurface.some(e => ['indifferent', 'calm'].includes(e)) && topDeep.some(e => ['sad', 'fearful', 'lonely'].includes(e))) {
      resultType = 'abyss';
    } else if (gapScore > 5) {
      // High gap but no specific match — assign based on dominant deep emotion
      if (topDeep.includes('angry') || topDeep.includes('passionate')) resultType = 'volcano';
      else if (topDeep.includes('lonely') || topDeep.includes('sad')) resultType = 'aurora';
      else if (topDeep.includes('tender') || topDeep.includes('anxious')) resultType = 'coral';
      else resultType = 'abyss';
    } else {
      resultType = 'fog';
    }

    return {
      type: resultType,
      topSurface,
      topDeep,
      gapScore,
      gapPercent: Math.min(Math.round((gapScore / TOTAL_QUESTIONS) * 100), 100),
      surfaceCounts,
      deepCounts
    };
  }

  // Show result
  function showResult() {
    const result = calculateResult();

    showScreen('result-screen');

    // Set type name and description
    $('result-type-name').textContent = t(`results.${result.type}.name`, result.type);
    $('result-type-desc').textContent = t(`results.${result.type}.desc`, '');

    // Analysis text
    $('result-analysis').textContent = t(`results.${result.type}.analysis`, '');

    // Result narrative: "You show [surface] but feel [deep] inside"
    const narrativeEl = $('result-narrative');
    if (narrativeEl && result.topSurface.length > 0 && result.topDeep.length > 0) {
      const surfaceEmotion = t(`emotions.${result.topSurface[0]}`, result.topSurface[0]);
      const deepEmotion = t(`emotions.${result.topDeep[0]}`, result.topDeep[0]);
      const narrativeTemplate = t('result.narrative', 'You show {surface} but feel {deep} inside');
      narrativeEl.innerHTML = narrativeTemplate
        .replace('{surface}', '<span class="surface-word">' + surfaceEmotion + '</span>')
        .replace('{deep}', '<span class="deep-word">' + deepEmotion + '</span>');
    }

    // Gap score with count-up animation
    const gapScoreEl = $('gap-score');
    const targetPercent = result.gapPercent;
    let currentCount = 0;
    const countDuration = 1200;
    const countSteps = 30;
    const countInterval = countDuration / countSteps;
    const countIncrement = targetPercent / countSteps;
    gapScoreEl.classList.add('counting');
    const countTimer = setInterval(() => {
      currentCount += countIncrement;
      if (currentCount >= targetPercent) {
        currentCount = targetPercent;
        clearInterval(countTimer);
        gapScoreEl.classList.remove('counting');
      }
      gapScoreEl.textContent = Math.round(currentCount) + '%';
    }, countInterval);

    setTimeout(() => {
      $('gap-bar').style.width = result.gapPercent + '%';
    }, 300);
    $('gap-desc').textContent = t(`results.${result.type}.gapDesc`, '');

    // Percentile social proof
    const percentiles = { volcano: 12, aurora: 18, coral: 22, abyss: 8, crystal: 25, fog: 15 };
    const pct = percentiles[result.type] || 15;
    const percEl = document.getElementById('percentile-stat');
    if (percEl) {
      percEl.innerHTML = `<strong>${pct}%</strong> ${t('result.percentileText', 'of participants share your type')}`;
    }

    // Place emotion tags on result iceberg
    placeResultTags(result);

    // Share setup
    setupShare(result);

    // GA4 event
    if (typeof gtag === 'function') {
      gtag('event', 'test_complete', {
        event_category: 'emotion_iceberg',
        event_label: result.type,
        value: result.gapPercent
      });
    }
  }

  function placeResultTags(result) {
    const surfaceG = $('result-surface-tags');
    const deepG = $('result-deep-tags');
    surfaceG.innerHTML = '';
    deepG.innerHTML = '';

    // Surface tags (above water, inside the tip)
    const surfacePositions = [
      { x: 180, y: 80 }, { x: 155, y: 100 }, { x: 205, y: 100 },
      { x: 180, y: 110 }, { x: 165, y: 90 }
    ];
    result.topSurface.forEach((emotion, i) => {
      if (i >= surfacePositions.length) return;
      const pos = surfacePositions[i];
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('class', 'emotion-tag surface');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '600');
      text.textContent = t(`emotions.${emotion}`, emotion);
      surfaceG.appendChild(text);
    });

    // Deep tags (below water, spread across the mass)
    const deepPositions = [
      { x: 180, y: 200 }, { x: 130, y: 230 }, { x: 230, y: 230 },
      { x: 160, y: 270 }, { x: 200, y: 270 }, { x: 180, y: 310 },
      { x: 140, y: 300 }, { x: 220, y: 300 }
    ];
    result.topDeep.forEach((emotion, i) => {
      if (i >= deepPositions.length) return;
      const pos = deepPositions[i];
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('class', 'emotion-tag deep');
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', '700');
      text.textContent = t(`emotions.${emotion}`, emotion);
      deepG.appendChild(text);
    });
  }

  function setupShare(result) {
    const typeName = t(`results.${result.type}.name`, result.type);
    const shareText = t('share.text', 'My emotion iceberg type is') + ': ' + typeName + '! ' + t('share.cta', 'Find out yours!');
    const shareUrl = 'https://dopabrain.com/emotion-iceberg/';

    $('share-kakao').onclick = () => {
      if (window.Kakao && Kakao.isInitialized()) {
        Kakao.Link.sendDefault({
          objectType: 'feed',
          content: { title: typeName, description: shareText, imageUrl: shareUrl + 'og-image.png', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }
        });
      } else {
        window.open('https://story.kakao.com/share?url=' + encodeURIComponent(shareUrl), '_blank');
      }
    };

    $('share-twitter').onclick = () => {
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText) + '&url=' + encodeURIComponent(shareUrl), '_blank');
    };

    $('share-facebook').onclick = () => {
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl), '_blank');
    };

    $('share-copy').onclick = () => {
      navigator.clipboard.writeText(shareUrl).then(() => {
        const copySpan = $('share-copy').querySelector('span:last-child');
        if (copySpan) {
          copySpan.textContent = t('share.copied', 'Copied!');
          setTimeout(() => { copySpan.textContent = t('share.copyLink', 'Copy Link'); }, 2000);
        }
      }).catch(() => {});
    };
  }

  // Language change handler
  window.onLanguageChange = function() {
    // Re-apply i18n translations from the loaded locale
    if (window.i18n) window.i18n.applyTranslations();
  };

  // Init
  function init() {
    // Hide loader — wait for i18n or max 2s
    function hideLoader() {
      const loader = $('app-loader');
      if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 400);
      }
    }
    const startTime = Date.now();
    const waitForI18n = setInterval(() => {
      if ((window.i18n && window.i18n.initialized) || Date.now() - startTime > 2000) {
        clearInterval(waitForI18n);
        hideLoader();
      }
    }, 50);

    // Start button
    $('start-btn').addEventListener('click', startTest);

    // Retry button
    $('retry-btn').addEventListener('click', () => {
      showScreen('start-screen');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
