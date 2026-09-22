/* ============================================================
   MENTOR SHARED MODULE
   Complete two-year A-level specifications for AQA Biology (7402),
   OCR A Mathematics (H240) and Edexcel A Economics A (9EC0), plus
   the shared state model, spaced-repetition memory fields, and
   helpers used by every page of The A* Mentor website.
   Loading this file twice on one page is safe (idempotent).
============================================================ */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'a_star_mentor_state_v2';
  const LEGACY_STORAGE_KEY = 'a_star_mentor_state_v1';

  const TIMETABLE = [
    { key: 'monday',    day: 'Monday',    period: 'P4-5', time: '11:30 to 12:50', start: '11:30', end: '12:50', minutes: 80 },
    { key: 'tuesday',   day: 'Tuesday',   period: 'P1-2', time: '09:10 to 10:30', start: '09:10', end: '10:30', minutes: 80 },
    { key: 'wednesday', day: 'Wednesday', period: 'P3',   time: '10:50 to 11:30', start: '10:50', end: '11:30', minutes: 40 },
    { key: 'thursday',  day: 'Thursday',  period: 'P1-2', time: '09:10 to 10:30', start: '09:10', end: '10:30', minutes: 80 },
    { key: 'friday',    day: 'Friday',    period: 'P3-5', time: '10:50 to 12:50', start: '10:50', end: '12:50', minutes: 120 },
  ];
  const TOTAL_FREE_MINUTES = TIMETABLE.reduce((sum, b) => sum + b.minutes, 0); // 400

  /* ============================================================
     FULL SPECIFICATIONS
  ============================================================ */
  const SYLLABUS = {
    biology: {
      label: 'AQA Biology (7402)',
      accent: 'bio',
      topics: [
        { name: 'Biological molecules', year: 12, leaves: ['Condensation and hydrolysis', 'Monosaccharides and disaccharides', 'Polysaccharides', 'Triglycerides and phospholipids', 'Amino acids and protein structure', 'Enzyme action and inhibition', 'DNA and RNA structure', 'DNA replication', 'ATP', 'Water and inorganic ions'] },
        { name: 'Cells', year: 12, leaves: ['Eukaryotic cell structure', 'Prokaryotic cells and viruses', 'Microscopy', 'Cell fractionation and ultracentrifugation', 'The cell cycle and mitosis', 'The plasma membrane', 'Diffusion', 'Osmosis', 'Active transport', 'Antigens and the immune response', 'Antibodies and vaccination', 'HIV and antiviral drugs'] },
        { name: 'Organisms exchange substances with their environment', year: 12, leaves: ['Surface area to volume ratio', 'Gas exchange in single-celled organisms and insects', 'Gas exchange in fish', 'Gas exchange in the human lungs', 'Digestion and absorption', 'The circulatory system', 'Haemoglobin', 'The cardiac cycle', 'Transpiration and the xylem', 'Translocation and the phloem'] },
        { name: 'Genetic information, variation and relationships between organisms', year: 12, leaves: ['DNA, genes and chromosomes', 'Transcription', 'Translation and the genetic code', 'Gene mutations', 'Meiosis and genetic variation', 'Natural selection and adaptation', 'Classification and taxonomy', 'Species diversity and biodiversity', "Simpson's Index of Diversity"] },
        { name: 'Photosynthesis', year: 13, leaves: ['Light-dependent reactions', 'Light-independent reactions', 'Limiting factors'] },
        { name: 'Respiration', year: 13, leaves: ['Glycolysis', 'Link reaction', 'Krebs cycle', 'Oxidative phosphorylation', 'Anaerobic respiration'] },
        { name: 'Energy and ecosystems', year: 13, leaves: ['Energy transfer between trophic levels', 'Net and gross primary production', 'The nitrogen cycle', 'The phosphorus cycle', 'Fertilisers'] },
        { name: 'Organisms respond to changes in their environment', year: 13, leaves: ['Receptors and survival', 'Control of heart rate', 'The nerve impulse', 'Synaptic transmission', 'Muscle structure and the sliding filament theory', 'Homeostasis principles', 'Control of blood glucose', 'Osmoregulation and the kidney', 'Plant responses and auxins', 'Hormonal control in animals'] },
        { name: 'Genetics, populations, evolution and ecosystems', year: 13, leaves: ['Monohybrid and dihybrid inheritance', 'Sex linkage and autosomal linkage', 'Epistasis', 'The chi-squared test', 'The Hardy-Weinberg principle', 'Types of selection', 'Speciation', 'Population size and competition', 'Predator-prey relationships', 'Ecological succession'] },
        { name: 'The control of gene expression', year: 13, leaves: ['Mutations and protein structure', 'Stem cells', 'Regulation of transcription and translation', 'Epigenetic control', 'Genome and proteome', 'Recombinant DNA technology', 'PCR', 'Gel electrophoresis', 'Oncogenes and tumour suppressor genes'] },
      ],
    },
    maths: {
      label: 'OCR A Mathematics (H240)',
      accent: 'maths',
      topics: [
        { name: 'Proof', year: 12, leaves: ['Proof by deduction', 'Proof by exhaustion', 'Disproof by counter-example'] },
        { name: 'Algebra and functions', year: 12, leaves: ['Indices and surds', 'Quadratic functions', 'Simultaneous equations', 'Inequalities', 'Polynomials', 'Domain & Range', 'Composite functions', 'Inverse functions', 'y = |f(x)|', 'y = f(|x|)'] },
        { name: 'Coordinate geometry', year: 12, leaves: ['Equation of a straight line', 'Circles'] },
        { name: 'Trigonometry (core)', year: 12, leaves: ['Sine and cosine rules', 'Graphs of sin, cos and tan', 'Trigonometric identities', 'Trigonometric transformations', 'Solving trig equations'] },
        { name: 'Exponentials and logarithms', year: 12, leaves: ['Exponential functions and graphs', 'Logarithms and their laws', 'Exponential models'] },
        { name: 'Differentiation (core)', year: 12, leaves: ['Gradients and rates of change', 'Differentiating polynomials', 'Tangents and normals', 'Stationary points and second derivatives'] },
        { name: 'Integration (core)', year: 12, leaves: ['Integrating polynomials', 'Definite integrals and areas under curves'] },
        { name: 'Statistical sampling and data', year: 12, leaves: ['Sampling techniques', 'Measures of location and spread', 'Representation of data', 'Correlation and regression'] },
        { name: 'Probability and distributions (core)', year: 12, leaves: ['Basic probability and Venn diagrams', 'Tree diagrams', 'The binomial distribution'] },
        { name: 'Mechanics: kinematics and forces', year: 12, leaves: ['Quantities and units', 'Motion graphs and SUVAT', "Newton's laws of motion", 'Types of force and connected particles'] },
        { name: 'Algebra (further)', year: 13, leaves: ['Partial fractions'] },
        { name: 'The binomial theorem', year: 13, leaves: ['Binomial expansion', 'Applications of the binomial theorem'] },
        { name: 'Sequences and series', year: 13, leaves: ['Arithmetic sequences and series', 'Geometric sequences and series', 'Sigma notation', 'Recurrence relations'] },
        { name: 'Radians', year: 13, leaves: ['Radian measure', 'Arc length and sector area', 'Small angle approximations'] },
        { name: 'Trigonometry (further)', year: 13, leaves: ['Reciprocal functions', 'Inverse trigonometric functions', 'Further trigonometric identities'] },
        { name: 'Differentiation (further)', year: 13, leaves: ['Differentiating trig, exponential and log functions', 'The chain rule', 'The product rule', 'The quotient rule', 'Implicit differentiation', 'Parametric differentiation'] },
        { name: 'Integration (further)', year: 13, leaves: ['Integration by substitution', 'Integration by parts', 'Integration using partial fractions', 'Differential equations'] },
        { name: 'Numerical methods', year: 13, leaves: ['Locating roots', 'Iteration', 'The Newton-Raphson method', 'The trapezium rule'] },
        { name: 'Vectors', year: 13, leaves: ['2D and 3D vectors', 'Vector equations of a line'] },
        { name: 'Statistical distributions and hypothesis testing', year: 13, leaves: ['The normal distribution', 'Hypothesis testing with the binomial distribution', 'Hypothesis testing for correlation'] },
        { name: 'Mechanics: further forces', year: 13, leaves: ['Variable acceleration using calculus', 'Projectiles', 'Moments and equilibrium'] },
      ],
    },
    economics: {
      label: 'Edexcel A Economics A (9EC0)',
      accent: 'econ',
      topics: [
        { name: 'Nature of economics', year: 12, leaves: ['Positive and normative statements', 'Opportunity cost', 'Production possibility frontiers'] },
        { name: 'How markets work', year: 12, leaves: ['Rational decision making', 'Demand', 'Price elasticity of demand', 'Income elasticity of demand', 'Supply', 'Price elasticity of supply', 'Price determination', 'Consumer and producer surplus'] },
        { name: 'Market failure', year: 12, leaves: ['Types of market failure', 'Externalities', 'Public goods', 'Information gaps'] },
        { name: 'Government intervention (Theme 1)', year: 12, leaves: ['Methods of government intervention', 'Government failure'] },
        { name: 'Measures of economic performance', year: 12, leaves: ['Economic growth', 'Inflation', 'Employment and unemployment', 'Balance of payments'] },
        { name: 'Aggregate demand and supply', year: 12, leaves: ['Components of aggregate demand', 'Short-run and long-run aggregate supply'] },
        { name: 'National income and economic growth', year: 12, leaves: ['The circular flow of income', 'Injections and withdrawals', 'Causes of economic growth', 'Output gaps and the economic cycle'] },
        { name: 'Macroeconomic objectives and policy', year: 12, leaves: ['Demand-side policies: fiscal', 'Demand-side policies: monetary', 'Supply-side policies'] },
        { name: 'Business Growth', year: 13, leaves: ['Business Growth'] },
        { name: 'Mergers', year: 13, leaves: ['Mergers'] },
        { name: 'Business objectives', year: 13, leaves: ['Profit maximisation and alternative objectives'] },
        { name: 'Revenues', year: 13, leaves: ['Revenues'] },
        { name: 'Costs', year: 13, leaves: ['Costs'] },
        { name: 'Profits', year: 13, leaves: ['Profits'] },
        { name: 'Market Structures', year: 13, leaves: ['Perfect Competition', 'Monopolistic Competition', 'Oligopoly', 'Monopoly', 'Monopsony', 'Price discrimination'] },
        { name: 'The labour market', year: 13, leaves: ['Demand and supply of labour', 'Wage determination', 'National minimum and living wage', 'Zero-hour contracts'] },
        { name: 'Government intervention (Theme 3)', year: 13, leaves: ['Competition policy', 'Regulation and deregulation', 'Public ownership and privatisation'] },
        { name: 'Market Failure & Regulation', year: 13, leaves: ['Market Failure & Regulation'] },
        { name: 'International economics', year: 13, leaves: ['Globalisation', 'Trade and trading blocs', 'The World Trade Organisation', 'Exchange rates'] },
        { name: 'Poverty, inequality and development', year: 13, leaves: ['Absolute and relative poverty', 'Measures of inequality', 'Measuring development'] },
        { name: 'Emerging economies', year: 13, leaves: ['Factors influencing growth and development', 'Strategies for growth and development'] },
        { name: 'The financial sector and the state', year: 13, leaves: ['Role of financial markets', 'Central banks and regulation', 'Public expenditure and taxation', 'The impact of macroeconomic policy'] },
      ],
    },
  };

  const SUBJECT_LABELS = { biology: 'Biology', maths: 'Maths', economics: 'Economics' };

  function flattenSyllabus() {
    const out = [];
    Object.keys(SYLLABUS).forEach(subject => {
      SYLLABUS[subject].topics.forEach(topic => {
        topic.leaves.forEach(leaf => out.push({ subject, topicName: topic.name, leafName: leaf, year: topic.year }));
      });
    });
    return out;
  }
  const ALL_LEAVES = flattenSyllabus();
  const TOTAL_LEAVES = ALL_LEAVES.length;

  /* ============================================================
     STATE MODEL (includes lightweight spaced-repetition memory)
  ============================================================ */
  function defaultLeafState() {
    return { done: false, lastRevised: null, highPriority: false, srsInterval: 1, srsDue: null, srsReviews: 0 };
  }

  function makeDefaultSyllabusState() {
    const s = {};
    Object.keys(SYLLABUS).forEach(subject => {
      s[subject] = {};
      SYLLABUS[subject].topics.forEach(topic => {
        s[subject][topic.name] = {};
        topic.leaves.forEach(leaf => { s[subject][topic.name][leaf] = defaultLeafState(); });
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
          if (savedLeaf) fresh[subject][topic][leaf] = Object.assign({}, fresh[subject][topic][leaf], savedLeaf);
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
      priorityRanking: [],
      homework: [],
      syllabus: makeDefaultSyllabusState(),
      confidence: { biology: 5, maths: 5, economics: 5 },
      anxiety: { biology: 5, maths: 5, economics: 5 },
      freePeriodUsage: { monday: false, tuesday: false, wednesday: false, thursday: false, friday: false },
      afterSchool: {
        blurtingLastDone: null, blurtingCount: 0, blurtingHistory: [],
        weakSpotLastDone: null, weakSpotCount: 0, weakSpotHistory: [],
      },
      weekendSprint: { pastPaperDone: false, synthesisDone: false },
    };
  }

  function loadState() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) raw = legacy;
      }
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
      merged.priorityRanking = Array.isArray(parsed.priorityRanking) ? parsed.priorityRanking : [];
      return merged;
    } catch (e) {
      console.error('Failed to load saved state, resetting.', e);
      return makeDefaultState();
    }
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.error('Failed to save state to localStorage.', e); }
  }

  function uid() { return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9); }

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
  function formatDateShort(date) { return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function todayDateString() { return new Date().toDateString(); }
  function isWeekend() { const d = new Date().getDay(); return d === 0 || d === 6; }

  function getRetentionBadge(lastRevised) {
    if (!lastRevised) return { label: 'Not revised', cls: 'badge-neutral' };
    const days = (Date.now() - lastRevised) / 86400000;
    if (days < 3) return { label: 'Fresh', cls: 'badge-ok' };
    if (days < 7) return { label: 'Review due', cls: 'badge-warn' };
    return { label: 'Critical decay', cls: 'badge-danger' };
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
  function computeNeverRevisedLeaves(state) {
    return ALL_LEAVES.filter(l => !state.syllabus[l.subject][l.topicName][l.leafName].lastRevised);
  }
  function computeOverallMasteryPct(state) {
    const doneCount = ALL_LEAVES.filter(l => state.syllabus[l.subject][l.topicName][l.leafName].done).length;
    return TOTAL_LEAVES ? Math.round((doneCount / TOTAL_LEAVES) * 100) : 0;
  }
  function computeSubjectStats(state, subject) {
    const leaves = ALL_LEAVES.filter(l => l.subject === subject);
    const done = leaves.filter(l => state.syllabus[l.subject][l.topicName][l.leafName].done).length;
    const decay = leaves.filter(l => {
      const ls = state.syllabus[l.subject][l.topicName][l.leafName];
      return ls.lastRevised && (Date.now() - ls.lastRevised) / 86400000 >= 7;
    }).length;
    return { total: leaves.length, done, decay };
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

  /* ---------- Spaced-repetition scheduling (lightweight, SM-2 inspired) ---------- */
  const SRS_INTERVALS = { again: 1, hard: 2, good: null, easy: null }; // good/easy computed from prior interval
  function scheduleReview(leafState, rating) {
    let next;
    if (rating === 'again') next = 1;
    else if (rating === 'hard') next = Math.max(2, Math.round(leafState.srsInterval * 1.3));
    else if (rating === 'good') next = Math.max(3, Math.round(leafState.srsInterval * 2.2));
    else next = Math.max(5, Math.round(leafState.srsInterval * 3.2)); // easy
    leafState.srsInterval = next;
    leafState.srsDue = Date.now() + next * 86400000;
    leafState.srsReviews = (leafState.srsReviews || 0) + 1;
    if (rating === 'good' || rating === 'easy') leafState.lastRevised = Date.now();
    return leafState;
  }
  function isDueForReview(leafState) {
    if (!leafState.srsDue) return true;
    return Date.now() >= leafState.srsDue;
  }

  global.MentorShared = {
    STORAGE_KEY,
    TIMETABLE,
    TOTAL_FREE_MINUTES,
    SYLLABUS,
    SUBJECT_LABELS,
    ALL_LEAVES,
    TOTAL_LEAVES,
    defaultLeafState,
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
    computeNeverRevisedLeaves,
    computeOverallMasteryPct,
    computeSubjectStats,
    getCurrentFreePeriodBlock,
    scheduleReview,
    isDueForReview,
  };
})(window);
