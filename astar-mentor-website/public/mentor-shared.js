/* ============================================================
   MENTOR SHARED MODULE
   Shared syllabus data, timetable, state model, and helpers used
   by every page of The A* Mentor website.
   Loading this file twice on one page is safe (idempotent).
============================================================ */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'a_star_mentor_state_v1';

  const TIMETABLE = [
    { key: 'monday',    day: 'Monday',    period: 'P4-5', time: '11:30 – 12:50', start: '11:30', end: '12:50', minutes: 80 },
    { key: 'tuesday',   day: 'Tuesday',   period: 'P1-2', time: '09:10 – 10:30', start: '09:10', end: '10:30', minutes: 80 },
    { key: 'wednesday', day: 'Wednesday', period: 'P3',   time: '10:50 – 11:30', start: '10:50', end: '11:30', minutes: 40 },
    { key: 'thursday',  day: 'Thursday',  period: 'P1-2', time: '09:10 – 10:30', start: '09:10', end: '10:30', minutes: 80 },
    { key: 'friday',    day: 'Friday',    period: 'P3-5', time: '10:50 – 12:50', start: '10:50', end: '12:50', minutes: 120 },
  ];
  const TOTAL_FREE_MINUTES = TIMETABLE.reduce((sum, b) => sum + b.minutes, 0); // 400

  const SYLLABUS = {
    biology: {
      label: 'AQA Biology — Section 5',
      accent: 'bio',
      topics: [
        { name: 'Photosynthesis', leaves: ['Light-dependent reactions', 'Light-independent reactions', 'Limiting factors'] },
        { name: 'Respiration', leaves: ['Glycolysis', 'Link reaction', 'Krebs cycle', 'Oxidative phosphorylation', 'Anaerobic respiration'] },
      ],
    },
    maths: {
      label: 'OCR A Maths — Pure',
      accent: 'maths',
      topics: [
        { name: 'Functions', leaves: ['Domain & Range', 'Composite functions', 'Inverse functions'] },
        { name: 'Graph Transformations', leaves: ['y = |f(x)|', 'y = f(|x|)'] },
        { name: 'Trigonometry', leaves: ['Reciprocal functions', 'Trigonometric identities', 'Trigonometric transformations'] },
      ],
    },
    economics: {
      label: 'Edexcel A Economics — Theme 3',
      accent: 'econ',
      topics: [
        { name: 'Business Growth', leaves: ['Business Growth'] },
        { name: 'Mergers', leaves: ['Mergers'] },
        { name: 'Revenues', leaves: ['Revenues'] },
        { name: 'Costs', leaves: ['Costs'] },
        { name: 'Profits', leaves: ['Profits'] },
        { name: 'Market Structures', leaves: ['Perfect Competition', 'Monopolistic Competition', 'Oligopoly', 'Monopoly'] },
        { name: 'Market Failure & Regulation', leaves: ['Market Failure & Regulation'] },
      ],
    },
  };

  const SUBJECT_LABELS = { biology: 'Biology', maths: 'Maths', economics: 'Economics' };

  function flattenSyllabus() {
    const out = [];
    Object.keys(SYLLABUS).forEach(subject => {
      SYLLABUS[subject].topics.forEach(topic => {
        topic.leaves.forEach(leaf => out.push({ subject, topicName: topic.name, leafName: leaf }));
      });
    });
    return out;
  }
  const ALL_LEAVES = flattenSyllabus();
  const TOTAL_LEAVES = ALL_LEAVES.length;

  function makeDefaultSyllabusState() {
    const s = {};
    Object.keys(SYLLABUS).forEach(subject => {
      s[subject] = {};
      SYLLABUS[subject].topics.forEach(topic => {
        s[subject][topic.name] = {};
        topic.leaves.forEach(leaf => {
          s[subject][topic.name][leaf] = { done: false, lastRevised: null, highPriority: false };
        });
      });
    });
    return s;
  }

  function mergeSyllabusState(saved) {
    const fresh = makeDefaultSyllabusState();
    if (!saved) return fresh;
    Object.keys(fresh).forEach(subject => {
      Object.keys(fresh[subject]).forEach(topic => {
        Object.keys(fresh[subject][topic]).forEach(leaf => {
          const savedLeaf = saved[subject] && saved[subject][topic] && saved[subject][topic][leaf];
          if (savedLeaf) {
            fresh[subject][topic][leaf] = Object.assign({}, fresh[subject][topic][leaf], savedLeaf);
          }
        });
      });
    });
    return fresh;
  }

  function makeDefaultState() {
    return {
      weekStartDate: null,
      onboarded: false,
      mentorStrategyText: '',
      homework: [],
      syllabus: makeDefaultSyllabusState(),
      confidence: { biology: 5, maths: 5, economics: 5 },
      anxiety: { biology: 5, maths: 5, economics: 5 },
      freePeriodUsage: { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
      afterSchool: { blurtingLastDone: null, blurtingCount: 0, weakSpotLastDone: null, weakSpotCount: 0 },
      weekendSprint: { pastPaperDone: false, synthesisDone: false },
      pomodorosCompleted: 0,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return makeDefaultState();
      const parsed = JSON.parse(raw);
      const defaults = makeDefaultState();
      const merged = Object.assign({}, defaults, parsed);
      merged.syllabus = mergeSyllabusState(parsed.syllabus);
      merged.confidence = Object.assign({}, defaults.confidence, parsed.confidence || {});
      merged.anxiety = Object.assign({}, defaults.anxiety, parsed.anxiety || {});
      merged.freePeriodUsage = Object.assign({}, defaults.freePeriodUsage, parsed.freePeriodUsage || {});
      merged.afterSchool = Object.assign({}, defaults.afterSchool, parsed.afterSchool || {});
      merged.weekendSprint = Object.assign({}, defaults.weekendSprint, parsed.weekendSprint || {});
      merged.homework = Array.isArray(parsed.homework) ? parsed.homework : [];
      return merged;
    } catch (e) {
      console.error('Failed to load saved state, resetting.', e);
      return makeDefaultState();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage.', e);
    }
  }

  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function getWeekSaturday(d) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = (day + 1) % 7;
    date.setDate(date.getDate() - diff);
    return date;
  }

  function formatDateShort(date) {
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function todayDateString() {
    return new Date().toDateString();
  }

  function isWeekend() {
    const d = new Date().getDay();
    return d === 0 || d === 6;
  }

  function getRetentionBadge(lastRevised) {
    if (!lastRevised) return { label: 'Not Revised', cls: 'badge-neutral' };
    const days = (Date.now() - lastRevised) / 86400000;
    if (days < 3) return { label: 'Fresh', cls: 'badge-ok' };
    if (days < 7) return { label: 'Review Due', cls: 'badge-warn' };
    return { label: 'Critical Decay', cls: 'badge-danger' };
  }

  function daysAgoLabel(lastRevised) {
    if (!lastRevised) return 'never';
    const days = Math.floor((Date.now() - lastRevised) / 86400000);
    if (days <= 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  function computeHighPriorityCount(state) {
    return ALL_LEAVES.filter(l => state.syllabus[l.subject][l.topicName][l.leafName].highPriority).length;
  }

  function computeCriticalDecayLeaves(state) {
    return ALL_LEAVES.filter(l => {
      const leaf = state.syllabus[l.subject][l.topicName][l.leafName];
      if (!leaf.lastRevised) return false;
      return (Date.now() - leaf.lastRevised) / 86400000 >= 7;
    });
  }

  function computeOverallMasteryPct(state) {
    const doneCount = ALL_LEAVES.filter(l => state.syllabus[l.subject][l.topicName][l.leafName].done).length;
    return TOTAL_LEAVES ? Math.round((doneCount / TOTAL_LEAVES) * 100) : 0;
  }

  function getCurrentFreePeriodBlock() {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = dayNames[now.getDay()];
    const block = TIMETABLE.find(b => b.key === todayKey);
    if (!block) return null;
    const [sh, sm] = block.start.split(':').map(Number);
    const [eh, em] = block.end.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (nowMinutes >= startMinutes && nowMinutes <= endMinutes) return block;
    return null;
  }

  global.MentorShared = {
    STORAGE_KEY,
    TIMETABLE,
    TOTAL_FREE_MINUTES,
    SYLLABUS,
    SUBJECT_LABELS,
    ALL_LEAVES,
    TOTAL_LEAVES,
    makeDefaultSyllabusState,
    mergeSyllabusState,
    makeDefaultState,
    loadState,
    saveState,
    uid,
    escapeHtml,
    getWeekSaturday,
    formatDateShort,
    todayDateString,
    isWeekend,
    getRetentionBadge,
    daysAgoLabel,
    computeHighPriorityCount,
    computeCriticalDecayLeaves,
    computeOverallMasteryPct,
    getCurrentFreePeriodBlock,
  };
})(window);
