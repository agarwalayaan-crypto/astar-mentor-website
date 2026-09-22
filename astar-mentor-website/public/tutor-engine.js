/* ============================================================
   TUTOR ENGINE (offline fallback)
   Used automatically when the real Claude backend is unreachable.
   Zero network calls. A self-contained knowledge base covering a
   curated set of high-yield topics, with fuzzy matching, quizzing,
   and the ability to mutate shared dashboard state directly.
============================================================ */
(function (global) {
  'use strict';
  const M = window.MentorShared;

  const KNOWLEDGE = [
    { subject: 'biology', topic: 'Photosynthesis', leaf: 'Light-dependent reactions',
      explain: "Occur in the thylakoid membranes. Light excites electrons in chlorophyll (photoactivation); they pass along an electron transport chain, driving photophosphorylation (ATP synthesis) and photolysis of water, splitting H2O into protons, electrons and O2, the oxygen you exhale. NADP+ is reduced to NADPH. ATP and NADPH pass to the light-independent stage. Exam trap: the O2 by-product comes from photolysis here, not the Calvin cycle.",
      question: "What three things does the light-dependent stage pass on to the light-independent stage, and where does the oxygen by-product actually come from?",
      keywords: ['atp', 'nadph', 'photolysis', 'oxygen'] },
    { subject: 'biology', topic: 'Photosynthesis', leaf: 'Light-independent reactions',
      explain: "Takes place in the stroma (the Calvin cycle). CO2 is fixed by combining with RuBP (5C), catalysed by rubisco, forming an unstable 6C compound that splits into two GP (3C) molecules. GP is reduced to triose phosphate (TP) using ATP and NADPH from the light-dependent stage. Some TP regenerates RuBP, using more ATP; the rest forms glucose. Exam trap: rubisco fixes CO2, it doesn't directly make glucose.",
      question: "Put these in order: GP, RuBP, triose phosphate, CO2 fixation, and name the enzyme that fixes CO2.",
      keywords: ['rubp', 'gp', 'triose phosphate', 'rubisco'] },
    { subject: 'biology', topic: 'Photosynthesis', leaf: 'Limiting factors',
      explain: "Blackman's Law of Limiting Factors: the rate of photosynthesis is restricted by whichever factor is in shortest supply, and increasing that factor raises the rate until another becomes limiting. The three key factors are light intensity, CO2 concentration, and temperature. On a graph, a plateau shows a different factor has taken over.",
      question: "Name the three main limiting factors of photosynthesis, and explain what a plateau on a rate-vs-light-intensity graph tells you.",
      keywords: ['light intensity', 'carbon dioxide', 'temperature', 'plateau'] },
    { subject: 'biology', topic: 'Respiration', leaf: 'Glycolysis',
      explain: "Occurs in the cytoplasm, no oxygen needed. Glucose (6C) is phosphorylated, using 2 ATP, then split into two triose phosphate molecules, oxidised to pyruvate (3C each): a net gain of 2 ATP and 2 reduced NAD (NADH) per glucose. Exam trap: the net ATP yield is 2, not 4. You must subtract the 2 ATP invested up front.",
      question: "Why is the net ATP yield from glycolysis only 2, when 4 ATP are actually produced?",
      keywords: ['net 2 atp', 'pyruvate', 'nadh', 'cytoplasm'] },
    { subject: 'biology', topic: 'Respiration', leaf: 'Link reaction',
      explain: "Occurs in the mitochondrial matrix. Pyruvate (3C) is decarboxylated, loses CO2, and dehydrogenated, loses H and reduces NAD to NADH; the remaining 2C acetyl group combines with coenzyme A to form acetyl coenzyme A. No ATP is produced directly here.",
      question: "What two things happen to pyruvate in the link reaction, and what molecule does it become?",
      keywords: ['acetyl coenzyme a', 'decarboxylation', 'nadh'] },
    { subject: 'biology', topic: 'Respiration', leaf: 'Krebs cycle',
      explain: "Occurs in the mitochondrial matrix. Acetyl CoA (2C) combines with oxaloacetate (4C) to form citrate (6C). Citrate is progressively decarboxylated and dehydrogenated back to oxaloacetate, releasing 2 CO2 and producing 1 ATP, 3 NADH and 1 FADH2 per acetyl CoA.",
      question: "Per glucose molecule, how many CO2, ATP, NADH and FADH2 does the Krebs cycle produce?",
      keywords: ['oxaloacetate', 'citrate', 'nadh', 'fadh2'] },
    { subject: 'biology', topic: 'Organisms respond to changes in their environment', leaf: 'Control of blood glucose',
      explain: "Blood glucose is controlled by negative feedback. A rise in glucose is detected by pancreatic beta cells, which secrete insulin, increasing glucose uptake into cells and its conversion to glycogen. A fall in glucose is detected by alpha cells, which secrete glucagon, triggering glycogenolysis and gluconeogenesis in the liver.",
      question: "Which pancreatic cells respond to high blood glucose, and what hormone do they release?",
      keywords: ['insulin', 'glucagon', 'beta cells', 'glycogen'] },
    { subject: 'biology', topic: 'Genetics, populations, evolution and ecosystems', leaf: 'The Hardy-Weinberg principle',
      explain: "Predicts allele frequencies remain constant between generations if five conditions hold: no mutation, no migration, no selection, random mating, and a large population. p + q = 1 for allele frequencies, and p2 + 2pq + q2 = 1 for genotype frequencies, where p2 is homozygous dominant, 2pq heterozygous, and q2 homozygous recessive.",
      question: "State the Hardy-Weinberg genotype frequency equation and what each term represents.",
      keywords: ['p squared', 'q squared', '2pq', 'allele frequency'] },
    { subject: 'maths', topic: 'Algebra and functions', leaf: 'Domain & Range',
      explain: "The domain is the set of all valid input (x) values; the range is the set of all possible output (y) values. Domain restrictions commonly come from division by zero, square roots (expression under the root at least zero), or logs (argument greater than zero).",
      question: "What are the three most common reasons a function's domain gets restricted?",
      keywords: ['denominator', 'square root', 'domain', 'range'] },
    { subject: 'maths', topic: 'Algebra and functions', leaf: 'Composite functions',
      explain: "fg(x) means do g first, then f: fg(x) = f(g(x)). Order matters, fg(x) generally does not equal gf(x). Substitute the entire g(x) expression into every x in f(x), working from the inside out.",
      question: "For fg(x), which function do you apply to x first, f or g? Explain why order matters.",
      keywords: ['f(g(x))', 'order', 'inside out', 'substitute'] },
    { subject: 'maths', topic: 'Algebra and functions', leaf: 'Inverse functions',
      explain: "f-inverse of x reverses what f(x) does, and only exists if f is one-to-one. To find it: write y = f(x), rearrange to make x the subject, then swap x and y. Graphically, the inverse is the reflection of f(x) in the line y = x.",
      question: "What three steps do you follow to find an inverse function algebraically, and what does its graph look like relative to f(x)?",
      keywords: ['one-to-one', 'swap x and y', 'y = x', 'reflection'] },
    { subject: 'maths', topic: 'Trigonometry (further)', leaf: 'Reciprocal functions',
      explain: "sec(x) = 1/cos(x), cosec(x) = 1/sin(x), cot(x) = 1/tan(x). Their graphs have vertical asymptotes wherever the original function equals zero. Key identities: 1 + tan-squared(x) = sec-squared(x) and 1 + cot-squared(x) = cosec-squared(x).",
      question: "Where do sec(x) and cosec(x) have vertical asymptotes, and why?",
      keywords: ['1/cos', '1/sin', 'asymptotes', 'sec squared'] },
    { subject: 'maths', topic: 'Differentiation (further)', leaf: 'The chain rule',
      explain: "Used to differentiate a composite function: if y = f(g(x)), then dy/dx = f'(g(x)) times g'(x). In practice, differentiate the outer function leaving the inner untouched, then multiply by the derivative of the inner function.",
      question: "State the chain rule and give one example of when you would use it.",
      keywords: ['composite function', 'outer', 'inner', 'multiply'] },
    { subject: 'maths', topic: 'Mechanics: kinematics and forces', leaf: "Newton's laws of motion",
      explain: "First law: an object stays at rest or constant velocity unless acted on by a resultant force. Second law: F = ma, resultant force equals mass times acceleration. Third law: every action has an equal and opposite reaction.",
      question: "State Newton's second law and identify the three quantities involved.",
      keywords: ['f = ma', 'resultant force', 'mass', 'acceleration'] },
    { subject: 'economics', topic: 'Business Growth', leaf: 'Business Growth',
      explain: "Firms grow organically, reinvesting profit internally, which is slower and lower-risk, or inorganically through mergers and takeovers, which is faster but carries more risk. Motives include economies of scale, market power, and risk diversification.",
      question: "What's the key difference between organic and inorganic growth, in terms of speed and risk?",
      keywords: ['organic', 'inorganic', 'economies of scale'] },
    { subject: 'economics', topic: 'Market Structures', leaf: 'Oligopoly',
      explain: "A market dominated by a few large, interdependent firms. Each firm must consider rivals' reactions, often leading to price rigidity (the kinked demand curve) and non-price competition. Firms may collude to raise joint profits.",
      question: "What does interdependence mean in an oligopoly, and how does it lead to price rigidity?",
      keywords: ['interdependence', 'concentration ratio', 'collusion'] },
    { subject: 'economics', topic: 'Market Structures', leaf: 'Monopoly',
      explain: "A single dominant seller with high barriers to entry, sustaining supernormal profit by restricting output and charging above marginal cost, causing allocative inefficiency and deadweight welfare loss.",
      question: "Why does a monopoly charging above marginal cost cause a deadweight welfare loss?",
      keywords: ['barriers to entry', 'marginal cost', 'deadweight loss'] },
    { subject: 'economics', topic: 'How markets work', leaf: 'Price elasticity of demand',
      explain: "Measures how responsive quantity demanded is to a change in price. PED = percentage change in quantity demanded divided by percentage change in price. If the magnitude is greater than 1, demand is elastic; less than 1, inelastic. Determined by substitutes, necessity, proportion of income, and time.",
      question: "What formula defines price elasticity of demand, and what does a value greater than 1 mean?",
      keywords: ['percentage change', 'elastic', 'inelastic', 'substitutes'] },
    { subject: 'economics', topic: 'Market Failure & Regulation', leaf: 'Market Failure & Regulation',
      explain: "Market failure occurs when the free market misallocates resources. Causes: externalities, public goods (the free-rider problem), information gaps, and market power. Governments correct this via regulation, taxes, subsidies, and direct provision.",
      question: "Name four main causes of market failure, and one government policy used to correct each.",
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
    const note = state.onboarded ? '' : " You haven't run this week's Strategy Briefing yet. Visit that page to set one up.";
    return `Hi. I'm your offline Mentor Assistant. The Claude backend isn't connected right now, so I'm working from a curated set of high-yield topics rather than the full specification. I can explain topics, quiz you, tell you what to study, or mark topics as revised. Try "explain the Krebs cycle" or "quiz me on economics".${note}`;
  }

  function retentionLine(state, entry) {
    const ls = state.syllabus[entry.subject][entry.topic][entry.leaf];
    const badge = M.getRetentionBadge(ls.lastRevised);
    return `Retention: ${badge.label.toLowerCase()}, last revised ${M.daysAgoLabel(ls.lastRevised)}.${ls.highPriority ? ' Flagged high priority this week.' : ''}`;
  }

  function markRevised(entry) { const state = M.loadState(); const ls = state.syllabus[entry.subject][entry.topic][entry.leaf]; ls.lastRevised = Date.now(); M.scheduleReview(ls, 'good'); M.saveState(state); }
  function markDone(entry) { const state = M.loadState(); state.syllabus[entry.subject][entry.topic][entry.leaf].done = true; M.saveState(state); }

  function whatToStudyNow(state) {
    const block = M.getCurrentFreePeriodBlock();
    if (block) {
      const pending = state.homework.filter(t => !t.done);
      if (pending.length) return `You're currently in your ${block.day} ${block.period} free period, locked for school homework only. Start with "${pending[0].text}".`;
      return `You're in your ${block.day} ${block.period} free period, and homework is fully cleared. Good position to be in.`;
    }
    if (M.isWeekend()) {
      const decay = M.computeCriticalDecayLeaves(state);
      if (decay.length) return `It's the weekend, so the Weekend Sprint is active. With ${decay.length} topic(s) in critical decay, prioritise Deep Syllabus Synthesis on: ${decay.slice(0, 5).map(l => l.leafName).join(', ')}.`;
      return "It's the weekend. Good time for Full Past Paper Practice or Deep Syllabus Synthesis.";
    }
    const subjects = Object.keys(M.SUBJECT_LABELS);
    let riskiest = subjects[0];
    subjects.forEach(s => { if (state.anxiety[s] > state.anxiety[riskiest]) riskiest = s; });
    const decay = M.computeCriticalDecayLeaves(state).filter(l => l.subject === riskiest);
    if (decay.length) return `Your highest-anxiety subject is ${M.SUBJECT_LABELS[riskiest]} at ${state.anxiety[riskiest]} out of 10, with ${decay.length} topic(s) in critical decay: ${decay.slice(0, 5).map(l => l.leafName).join(', ')}.`;
    return `No free period right now. Your highest-anxiety subject is ${M.SUBJECT_LABELS[riskiest]} at ${state.anxiety[riskiest]} out of 10, a good target for tonight's Blurting or Weak Spot Blitz.`;
  }

  function tryHandleMutationCommand(inputLower) {
    const verbs = ['mark', 'i revised', "i've revised", 'i finished', "i've finished", 'i completed', "i've completed", 'done with'];
    if (!verbs.some(v => inputLower.includes(v))) return null;
    const entry = findBestTopicMatch(inputLower);
    if (!entry) return "I can mark a topic as revised or done, but I couldn't tell which topic you mean.";
    if (/\bdone\b|\bcomplete|\bfinish|\bmaster/i.test(inputLower)) { markDone(entry); return `Marked "${entry.leaf}" as done in your syllabus checklist.`; }
    markRevised(entry);
    return `Marked "${entry.leaf}" as revised just now.`;
  }

  function tryHandleQuizCommand(inputLower) {
    if (!(inputLower.includes('quiz') || inputLower.includes('test me'))) return null;
    let pool = KNOWLEDGE;
    const subjectMatch = Object.keys(M.SUBJECT_LABELS).find(s => inputLower.includes(s) || inputLower.includes(M.SUBJECT_LABELS[s].toLowerCase()));
    if (subjectMatch) pool = pool.filter(e => e.subject === subjectMatch);
    const namedTopic = findBestTopicMatch(inputLower);
    const entry = namedTopic && pool.includes(namedTopic) ? namedTopic : pool[Math.floor(Math.random() * pool.length)];
    pendingQuiz = { entry };
    return `Quiz time. ${M.SUBJECT_LABELS[entry.subject]}, ${entry.leaf}.\n\n${entry.question}\n\nType your answer, or say "skip".`;
  }

  function evaluateQuizAnswer(answerText) {
    const entry = pendingQuiz.entry;
    pendingQuiz = null;
    if (/^skip$/i.test(answerText.trim())) return `No worries. Here's the explanation:\n\n${entry.explain}`;
    const answerLower = answerText.toLowerCase();
    const matched = entry.keywords.filter(k => answerLower.includes(k));
    const good = matched.length >= Math.ceil(entry.keywords.length / 2);
    let feedback = good ? `Solid answer. You covered: ${matched.join(', ')}.` : `Partial. Key terms to include: ${entry.keywords.join(', ')}.`;
    feedback += `\n\nFull explanation:\n${entry.explain}`;
    if (good) { markRevised(entry); feedback += `\n\nSince that was solid, I've marked "${entry.leaf}" as revised for you.`; }
    return feedback;
  }

  function generateLocalReply(userText, state) {
    const inputLower = userText.toLowerCase().trim();
    if (pendingQuiz) return evaluateQuizAnswer(userText);
    if (!inputLower) return 'Go ahead and ask me something. Try "help" to see what I can do.';
    if (/^(hi|hello|hey|yo)\b/.test(inputLower)) return buildWelcomeMessage(state);
    if (inputLower.includes('help') || inputLower.includes('what can you do')) {
      return "I can explain a curated set of high-yield topics, quiz you, tell you what to study right now, mark topics revised or done, and show your Mentor Strategy, homework, or critical decay topics. Homework-setting and past-paper walkthroughs across the full specification need the real Claude backend. Check Connection Details below the chat.";
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
      if (!leaves.length) return "Nothing has hit critical decay right now. Nice work.";
      return `${leaves.length} topic(s) in critical decay: ${leaves.slice(0, 8).map(l => `${l.leafName} (${M.SUBJECT_LABELS[l.subject]})`).join(', ')}.`;
    }
    if (inputLower.includes('homework') || inputLower.includes("what's due")) {
      const pending = state.homework.filter(t => !t.done);
      return pending.length ? `Pending: ${pending.map(t => t.text).join(', ')}` : "Your homework list is fully cleared.";
    }
    if (inputLower.includes('what should i study') || inputLower.includes('what next') || inputLower.includes('study now')) {
      return whatToStudyNow(state);
    }
    const entry = findBestTopicMatch(userText);
    if (entry) {
      return `${entry.topic}. ${entry.leaf}\n\n${entry.explain}\n\n${retentionLine(state, entry)}\n\nWant a quick self-test? Say "quiz me on ${entry.leaf.toLowerCase()}".`;
    }
    return "That topic isn't in my curated offline set. Try naming one of the core topics directly, or ask \"what should I study now?\", \"quiz me\", or \"help\". For the full specification, reconnect the Claude backend.";
  }

  global.TutorEngine = { generateLocalReply, buildWelcomeMessage, KNOWLEDGE };
})(window);
