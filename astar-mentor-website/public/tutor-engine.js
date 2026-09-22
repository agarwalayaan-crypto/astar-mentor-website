/* ============================================================
   TUTOR ENGINE (offline fallback)
   Used automatically when the real Claude backend is unreachable.
   Zero network calls — a self-contained knowledge base covering
   all 26 syllabus topics, with fuzzy matching, quizzing, and the
   ability to mutate shared dashboard state directly.
============================================================ */
(function (global) {
  'use strict';
  const M = window.MentorShared;

  const KNOWLEDGE = [
    { subject: 'biology', topic: 'Photosynthesis', leaf: 'Light-dependent reactions',
      explain: "Occur in the thylakoid membranes. Light excites electrons in chlorophyll (photoactivation); they pass along an electron transport chain, driving photophosphorylation (ATP synthesis) and photolysis of water (splitting H₂O into protons, electrons and O₂ — the oxygen you exhale). NADP+ is reduced to NADPH. ATP and NADPH pass to the light-independent stage. Exam trap: the O₂ by-product comes from photolysis here, not the Calvin cycle.",
      question: "What three things does the light-dependent stage pass on to the light-independent stage, and where does the oxygen by-product actually come from?",
      keywords: ['atp', 'nadph', 'photolysis', 'oxygen'] },
    { subject: 'biology', topic: 'Photosynthesis', leaf: 'Light-independent reactions',
      explain: "Takes place in the stroma (the Calvin cycle). CO₂ is fixed by combining with RuBP (5C), catalysed by rubisco, forming an unstable 6C compound that splits into two GP (3C) molecules. GP is reduced to triose phosphate (TP) using ATP and NADPH from the light-dependent stage. Some TP regenerates RuBP (using more ATP); the rest forms glucose. Exam trap: rubisco fixes CO₂ — it doesn't directly make glucose.",
      question: "Put these in order: GP, RuBP, triose phosphate, CO₂ fixation — and name the enzyme that fixes CO₂.",
      keywords: ['rubp', 'gp', 'triose phosphate', 'rubisco'] },
    { subject: 'biology', topic: 'Photosynthesis', leaf: 'Limiting factors',
      explain: "Blackman's Law of Limiting Factors: the rate of photosynthesis is restricted by whichever factor is in shortest supply, and increasing that factor raises the rate until another becomes limiting. The three key factors are light intensity, CO₂ concentration, and temperature. On a graph, a plateau shows a different factor has taken over.",
      question: "Name the three main limiting factors of photosynthesis, and explain what a plateau on a rate-vs-light-intensity graph tells you.",
      keywords: ['light intensity', 'carbon dioxide', 'temperature', 'plateau'] },
    { subject: 'biology', topic: 'Respiration', leaf: 'Glycolysis',
      explain: "Occurs in the cytoplasm, no oxygen needed. Glucose (6C) is phosphorylated (using 2 ATP), then split into two triose phosphate molecules, oxidised to pyruvate (3C each) — a NET gain of 2 ATP and 2 reduced NAD (NADH) per glucose. Exam trap: the net ATP yield is 2, not 4 — you must subtract the 2 ATP invested up front.",
      question: "Why is the net ATP yield from glycolysis only 2, when 4 ATP are actually produced?",
      keywords: ['net 2 atp', 'pyruvate', 'nadh', 'cytoplasm'] },
    { subject: 'biology', topic: 'Respiration', leaf: 'Link reaction',
      explain: "Occurs in the mitochondrial matrix. Pyruvate (3C) is decarboxylated (loses CO₂) and dehydrogenated (loses H, reducing NAD to NADH); the remaining 2C acetyl group combines with coenzyme A to form acetyl coenzyme A. No ATP is produced directly here.",
      question: "What two things happen to pyruvate in the link reaction, and what molecule does it become?",
      keywords: ['acetyl coenzyme a', 'decarboxylation', 'nadh'] },
    { subject: 'biology', topic: 'Respiration', leaf: 'Krebs cycle',
      explain: "Occurs in the mitochondrial matrix. Acetyl CoA (2C) combines with oxaloacetate (4C) to form citrate (6C). Citrate is progressively decarboxylated and dehydrogenated back to oxaloacetate, releasing 2 CO₂ and producing 1 ATP, 3 NADH and 1 FADH₂ per acetyl CoA.",
      question: "Per glucose molecule, how many CO₂, ATP, NADH and FADH₂ does the Krebs cycle produce?",
      keywords: ['oxaloacetate', 'citrate', 'nadh', 'fadh2'] },
    { subject: 'biology', topic: 'Respiration', leaf: 'Oxidative phosphorylation',
      explain: "Occurs across the inner mitochondrial membrane. NADH and FADH₂ donate electrons to the electron transport chain; energy released pumps protons into the intermembrane space (chemiosmosis). Protons diffuse back through ATP synthase, driving ATP synthesis. Oxygen is the final electron acceptor, forming water.",
      question: "What is chemiosmosis, and why is oxygen essential for this stage of respiration?",
      keywords: ['chemiosmosis', 'proton gradient', 'atp synthase', 'oxygen'] },
    { subject: 'biology', topic: 'Respiration', leaf: 'Anaerobic respiration',
      explain: "Occurs when oxygen is unavailable. In animals, pyruvate is reduced to lactate using NADH (regenerating NAD+). In yeast/plants, pyruvate becomes ethanal then ethanol. Exam trap: anaerobic respiration doesn't yield extra ATP — its purpose is regenerating NAD+.",
      question: "What is the actual PURPOSE of converting pyruvate to lactate or ethanol, if it doesn't produce more ATP?",
      keywords: ['regenerate', 'nad+', 'lactate', 'ethanol'] },
    { subject: 'maths', topic: 'Functions', leaf: 'Domain & Range',
      explain: "The domain is the set of all valid input (x) values; the range is the set of all possible output (y) values. Domain restrictions commonly come from division by zero, square roots (expression under the root ≥ 0), or logs (argument > 0).",
      question: "What are the three most common reasons a function's domain gets restricted?",
      keywords: ['denominator', 'square root', 'domain', 'range'] },
    { subject: 'maths', topic: 'Functions', leaf: 'Composite functions',
      explain: "fg(x) means 'do g first, then f': fg(x) = f(g(x)). Order matters — fg(x) generally ≠ gf(x). Substitute the entire g(x) expression into every x in f(x), working from the inside out.",
      question: "For fg(x), which function do you apply to x first — f or g? Explain why order matters.",
      keywords: ['f(g(x))', 'order', 'inside out', 'substitute'] },
    { subject: 'maths', topic: 'Functions', leaf: 'Inverse functions',
      explain: "f⁻¹(x) reverses what f(x) does, and only exists if f is one-to-one. To find it: write y = f(x), rearrange to make x the subject, then swap x and y. Graphically, f⁻¹(x) is the reflection of f(x) in the line y = x.",
      question: "What three steps do you follow to find f⁻¹(x) algebraically, and what does its graph look like relative to f(x)?",
      keywords: ['one-to-one', 'swap x and y', 'y = x', 'reflection'] },
    { subject: 'maths', topic: 'Graph Transformations', leaf: 'y = |f(x)|',
      explain: "Takes the graph of f(x) and reflects any part below the x-axis up above it. Parts already at or above the x-axis stay unchanged. This only affects the output (y) — the x-values (roots) stay exactly where they were.",
      question: "For y = |f(x)|, which parts of the original graph get reflected, and which stay the same?",
      keywords: ['reflect negative', 'above x-axis', 'sketch first'] },
    { subject: 'maths', topic: 'Graph Transformations', leaf: 'y = f(|x|)',
      explain: "Takes the graph of f(x) for x ≥ 0, deletes everything for x < 0, and replaces it with a mirror image of the x ≥ 0 part reflected in the y-axis — the result is always symmetrical about the y-axis.",
      question: "y = f(|x|) is always symmetrical about which axis, and why?",
      keywords: ['symmetrical', 'y-axis', 'replace x<0'] },
    { subject: 'maths', topic: 'Trigonometry', leaf: 'Reciprocal functions',
      explain: "sec(x) = 1/cos(x), cosec(x) = 1/sin(x), cot(x) = 1/tan(x). Their graphs have vertical asymptotes wherever the original function equals zero. Key identities: 1 + tan²x = sec²x and 1 + cot²x = cosec²x.",
      question: "Where do sec(x) and cosec(x) have vertical asymptotes, and why?",
      keywords: ['1/cos', '1/sin', 'asymptotes', 'sec squared'] },
    { subject: 'maths', topic: 'Trigonometry', leaf: 'Trigonometric identities',
      explain: "Core identities: sin²x + cos²x = 1, tan x = sin x / cos x. Double angle formulae: sin2x = 2sinxcosx; cos2x = cos²x−sin²x = 2cos²x−1 = 1−2sin²x.",
      question: "State the Pythagorean trig identity and one double angle formula for cos2x.",
      keywords: ['sin squared', 'cos squared', 'double angle'] },
    { subject: 'maths', topic: 'Trigonometry', leaf: 'Trigonometric transformations',
      explain: "y=sin(x)+a shifts vertically; y=sin(x+a) shifts horizontally; y=a·sin(x) stretches vertically (amplitude); y=sin(ax) stretches horizontally (period = 360°/a).",
      question: "Which part of y = a·sin(bx + c) controls the amplitude, and which part controls the period?",
      keywords: ['amplitude', 'period', 'phase shift'] },
    { subject: 'economics', topic: 'Business Growth', leaf: 'Business Growth',
      explain: "Firms grow organically (internal: reinvesting profit — slower, lower-risk) or inorganically (external: mergers and takeovers — faster, higher risk). Motives include economies of scale, market power, and risk diversification.",
      question: "What's the key difference between organic and inorganic growth, in terms of speed and risk?",
      keywords: ['organic', 'inorganic', 'economies of scale'] },
    { subject: 'economics', topic: 'Mergers', leaf: 'Mergers',
      explain: "Horizontal mergers (same industry) aim for economies of scale and market share. Vertical mergers (different supply chain stages) aim for supply chain control. Conglomerate mergers (unrelated industries) aim for risk diversification.",
      question: "Give an example of a horizontal merger and a vertical merger, and state the main motive behind each.",
      keywords: ['horizontal', 'vertical', 'conglomerate'] },
    { subject: 'economics', topic: 'Revenues', leaf: 'Revenues',
      explain: "Total Revenue (TR) = Price × Quantity. Average Revenue (AR) = TR/Q, equal to price. For a price taker, AR = MR = Price. For a price maker, AR slopes down and MR falls twice as steeply.",
      question: "Why does MR fall faster than AR for a firm that is a price maker (not a price taker)?",
      keywords: ['total revenue', 'ar = mr', 'price maker'] },
    { subject: 'economics', topic: 'Costs', leaf: 'Costs',
      explain: "Fixed costs (FC) don't vary with output; variable costs (VC) do. TC = FC + VC. Marginal cost (MC) eventually rises due to the law of diminishing marginal returns. The MC curve crosses AC at its minimum point.",
      question: "Why does marginal cost eventually rise as output increases, in the short run?",
      keywords: ['fixed cost', 'variable cost', 'diminishing returns'] },
    { subject: 'economics', topic: 'Profits', leaf: 'Profits',
      explain: "Profit = Total Revenue − Total Cost. Normal profit occurs where AR = AC (the minimum needed to stay in the industry). Supernormal profit is any profit above normal (AR > AC).",
      question: "What condition (in terms of AR and AC) defines 'normal profit', and why is it not really zero profit?",
      keywords: ['normal profit', 'supernormal', 'ar = ac'] },
    { subject: 'economics', topic: 'Market Structures', leaf: 'Perfect Competition',
      explain: "Many small firms, homogeneous products, no barriers to entry, firms are price takers (AR=MR=Price). Long run: free entry/exit competes profit down to normal only.",
      question: "Why can a perfectly competitive firm only earn normal profit in the long run?",
      keywords: ['price taker', 'normal profit', 'free entry'] },
    { subject: 'economics', topic: 'Market Structures', leaf: 'Monopolistic Competition',
      explain: "Many firms, low barriers, but differentiated products giving some price-setting power. Long run: free entry erodes supernormal profit to normal, but the firm produces where AR meets AC, leaving excess capacity.",
      question: "What stops a monopolistically competitive firm from being productively efficient in the long run?",
      keywords: ['product differentiation', 'excess capacity', 'normal profit'] },
    { subject: 'economics', topic: 'Market Structures', leaf: 'Oligopoly',
      explain: "A market dominated by a few large, interdependent firms. Each firm must consider rivals' reactions, often leading to price rigidity (kinked demand curve) and non-price competition. Firms may collude to raise joint profits.",
      question: "What does 'interdependence' mean in an oligopoly, and how does it lead to price rigidity?",
      keywords: ['interdependence', 'concentration ratio', 'collusion'] },
    { subject: 'economics', topic: 'Market Structures', leaf: 'Monopoly',
      explain: "A single dominant seller with high barriers to entry, sustaining supernormal profit by restricting output and charging above marginal cost (P > MC), causing allocative inefficiency and deadweight welfare loss.",
      question: "Why does a monopoly charging P > MC cause a deadweight welfare loss?",
      keywords: ['barriers to entry', 'p > mc', 'deadweight loss'] },
    { subject: 'economics', topic: 'Market Failure & Regulation', leaf: 'Market Failure & Regulation',
      explain: "Market failure occurs when the free market misallocates resources. Causes: externalities, public goods (free-rider problem), information gaps, and market power. Governments correct this via regulation, taxes, subsidies, and direct provision.",
      question: "Name the four main causes of market failure, and one government policy used to correct each.",
      keywords: ['externalities', 'public goods', 'information gaps', 'regulation'] },
  ];

  const STOPWORDS = new Set(['the','a','an','of','to','in','on','and','or','is','are','what','how','why','explain','tell','me','about','for','with','does','do','can','you']);
  function tokenize(text) { return String(text).toLowerCase().match(/[a-z0-9+|]+/g) || []; }

  function scoreEntry(entry, inputLower, inputTokens) {
    const leafLower = entry.leaf.toLowerCase();
    if (inputLower.includes(leafLower)) return 100;
    let score = 0;
    tokenize(entry.leaf).forEach(tok => { if (!STOPWORDS.has(tok) && tok.length >= 3 && inputTokens.includes(tok)) score += 5; });
    tokenize(entry.topic).forEach(tok => { if (!STOPWORDS.has(tok) && tok.length >= 3 && inputTokens.includes(tok)) score += 2; });
    if (inputLower.includes(entry.topic.toLowerCase())) score += 4;
    return score;
  }

  function findBestTopicMatch(text) {
    const inputLower = text.toLowerCase();
    const inputTokens = tokenize(text);
    let best = null, bestScore = 0;
    KNOWLEDGE.forEach(entry => { const s = scoreEntry(entry, inputLower, inputTokens); if (s > bestScore) { bestScore = s; best = entry; } });
    return bestScore > 0 ? best : null;
  }

  let pendingQuiz = null;

  function buildWelcomeMessage(state) {
    const name = state.onboarded ? '' : " Looks like you haven't run this week's Strategy Briefing yet — visit that page to set one up.";
    return `Hi — I'm your offline Mentor Assistant (Claude backend not connected right now). I can explain any of your 26 syllabus topics, quiz you, tell you what to study right now, or mark topics as revised for you. Try "explain the Krebs cycle" or "quiz me on economics".${name}`;
  }

  function retentionLine(state, entry) {
    const ls = state.syllabus[entry.subject][entry.topic][entry.leaf];
    const badge = M.getRetentionBadge(ls.lastRevised);
    return `Retention: ${badge.label} (last revised ${M.daysAgoLabel(ls.lastRevised)})${ls.highPriority ? ' · ★ High-Priority this week' : ''}`;
  }

  function markRevised(entry) { const state = M.loadState(); state.syllabus[entry.subject][entry.topic][entry.leaf].lastRevised = Date.now(); M.saveState(state); }
  function markDone(entry) { const state = M.loadState(); state.syllabus[entry.subject][entry.topic][entry.leaf].done = true; M.saveState(state); }

  function whatToStudyNow(state) {
    const block = M.getCurrentFreePeriodBlock();
    if (block) {
      const pending = state.homework.filter(t => !t.done);
      if (pending.length) return `You're currently in your ${block.day} ${block.period} free period — locked for school homework only. Start with: "${pending[0].text}".`;
      return `You're in your ${block.day} ${block.period} free period, and homework is fully cleared — great position to be in.`;
    }
    if (M.isWeekend()) {
      const decay = M.computeCriticalDecayLeaves(state);
      if (decay.length) return `It's the weekend — Weekend Sprint is active. With ${decay.length} topic(s) in Critical Decay, prioritise Deep Syllabus Synthesis on: ${decay.map(l => l.leafName).join(', ')}.`;
      return "It's the weekend — good time for Full Past Paper Practice or Deep Syllabus Synthesis.";
    }
    const subjects = Object.keys(M.SUBJECT_LABELS);
    let riskiest = subjects[0];
    subjects.forEach(s => { if (state.anxiety[s] > state.anxiety[riskiest]) riskiest = s; });
    const decay = M.computeCriticalDecayLeaves(state).filter(l => l.subject === riskiest);
    if (decay.length) return `Your highest-anxiety subject is ${M.SUBJECT_LABELS[riskiest]} (${state.anxiety[riskiest]}/10), with ${decay.length} topic(s) in Critical Decay: ${decay.map(l => l.leafName).join(', ')}.`;
    return `No free period right now. Your highest-anxiety subject is ${M.SUBJECT_LABELS[riskiest]} (${state.anxiety[riskiest]}/10) — a good target for tonight's Blurting or Weak Spot Blitz.`;
  }

  function tryHandleMutationCommand(inputLower) {
    const verbs = ['mark', 'i revised', "i've revised", 'i finished', "i've finished", 'i completed', "i've completed", 'done with'];
    if (!verbs.some(v => inputLower.includes(v))) return null;
    const entry = findBestTopicMatch(inputLower);
    if (!entry) return "I can mark a topic as revised or done, but I couldn't tell which topic you mean.";
    if (/\bdone\b|\bcomplete|\bfinish|\bmaster/i.test(inputLower)) { markDone(entry); return `✅ Marked "${entry.leaf}" as done in your Syllabus Checklist.`; }
    markRevised(entry);
    return `🔄 Marked "${entry.leaf}" as revised just now.`;
  }

  function tryHandleQuizCommand(inputLower) {
    if (!(inputLower.includes('quiz') || inputLower.includes('test me'))) return null;
    let pool = KNOWLEDGE;
    const subjectMatch = Object.keys(M.SUBJECT_LABELS).find(s => inputLower.includes(s) || inputLower.includes(M.SUBJECT_LABELS[s].toLowerCase()));
    if (subjectMatch) pool = pool.filter(e => e.subject === subjectMatch);
    const namedTopic = findBestTopicMatch(inputLower);
    const entry = namedTopic && pool.includes(namedTopic) ? namedTopic : pool[Math.floor(Math.random() * pool.length)];
    pendingQuiz = { entry };
    return `📝 Quiz time — ${M.SUBJECT_LABELS[entry.subject]} · ${entry.leaf}\n\n${entry.question}\n\n(Type your answer, or say "skip".)`;
  }

  function evaluateQuizAnswer(answerText) {
    const entry = pendingQuiz.entry;
    pendingQuiz = null;
    if (/^skip$/i.test(answerText.trim())) return `No worries — here's the explanation:\n\n${entry.explain}`;
    const answerLower = answerText.toLowerCase();
    const matched = entry.keywords.filter(k => answerLower.includes(k));
    const good = matched.length >= Math.ceil(entry.keywords.length / 2);
    let feedback = good ? `✅ Solid answer — you covered: ${matched.join(', ')}.` : `🤔 Partial — key terms to include: ${entry.keywords.join(', ')}.`;
    feedback += `\n\nFull explanation:\n${entry.explain}`;
    if (good) { markRevised(entry); feedback += `\n\n🔄 I've marked "${entry.leaf}" as revised for you.`; }
    return feedback;
  }

  function generateLocalReply(userText, state) {
    const inputLower = userText.toLowerCase().trim();
    if (pendingQuiz) return evaluateQuizAnswer(userText);
    if (!inputLower) return 'Go ahead and ask me something — try "help" to see what I can do.';
    if (/^(hi|hello|hey|yo)\b/.test(inputLower)) return buildWelcomeMessage(state);
    if (inputLower.includes('help') || inputLower.includes('what can you do')) {
      return "I can:\n• Explain any of your 26 syllabus topics\n• Quiz you\n• Tell you what to study right now\n• Mark topics revised or done\n• Show your Mentor Strategy, homework, or Critical Decay topics\n\n(Note: homework-setting and past-paper walkthroughs need the real Claude backend — see Connection Settings below the chat.)";
    }
    const mutationReply = tryHandleMutationCommand(inputLower);
    if (mutationReply) return mutationReply;
    const quizReply = tryHandleQuizCommand(inputLower);
    if (quizReply) return quizReply;
    if (inputLower.includes('strategy') || inputLower.includes('briefing') || inputLower.includes('mentor')) {
      return state.mentorStrategyText || "You haven't completed a Weekly Strategy Briefing yet.";
    }
    if (inputLower.includes('decay') || inputLower.includes('critical') || inputLower.includes('forgetting')) {
      const leaves = M.computeCriticalDecayLeaves(state);
      if (!leaves.length) return "Nothing has hit Critical Decay right now — nice work.";
      return `⚠️ ${leaves.length} topic(s) in Critical Decay: ${leaves.map(l => `${l.leafName} (${M.SUBJECT_LABELS[l.subject]})`).join(', ')}.`;
    }
    if (inputLower.includes('homework') || inputLower.includes("what's due")) {
      const pending = state.homework.filter(t => !t.done);
      return pending.length ? `Pending: ${pending.map(t => t.text).join(' · ')}` : "Your homework list is fully cleared. 🎉";
    }
    if (inputLower.includes('what should i study') || inputLower.includes('what next') || inputLower.includes('study now')) {
      return whatToStudyNow(state);
    }
    const entry = findBestTopicMatch(userText);
    if (entry) {
      return `${entry.topic} → ${entry.leaf}\n\n${entry.explain}\n\n${retentionLine(state, entry)}\n\nWant a quick self-test? Say "quiz me on ${entry.leaf.toLowerCase()}".`;
    }
    return "I didn't quite catch a topic there (and I'm running offline right now, so I only know these 26 topics). Try naming one directly, or ask \"what should I study now?\" / \"quiz me\" / \"help\".";
  }

  global.TutorEngine = { generateLocalReply, buildWelcomeMessage, KNOWLEDGE };
})(window);
