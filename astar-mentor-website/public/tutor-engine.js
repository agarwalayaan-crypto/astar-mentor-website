/* ============================================================
   TUTOR ENGINE (offline fallback)
   Used automatically when the real Claude backend is unreachable.
   Zero network calls. Actions (marking revised, checking status,
   quizzing) work against the full 221-point specification. Rich,
   hand-written explanations exist for a curated high-yield subset;
   everything else gets an honest generic self-assessment instead
   of a fabricated answer.
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
    { subject: 'biology', topic: 'Cells', leaf: 'Osmosis',
      explain: "Osmosis is the net movement of water molecules from a region of higher water potential to a region of lower water potential, across a partially permeable membrane. Pure water has the highest possible water potential, zero. Solutes lower water potential, so a solution with more dissolved solute has a more negative water potential. Water moves down this gradient without ATP, since it is passive. Exam trap: always describe direction using water potential, never solute concentration alone.",
      question: "State osmosis in terms of water potential, and explain why pure water has the highest possible water potential.",
      keywords: ['water potential', 'partially permeable', 'passive', 'higher to lower'] },
    { subject: 'biology', topic: 'Organisms exchange substances with their environment', leaf: 'The cardiac cycle',
      explain: "The sequence of events in one heartbeat: diastole, when the heart relaxes and fills; atrial systole, when the atria contract to push the final blood into the ventricles; and ventricular systole, when the ventricles contract, forcing the atrioventricular valves shut and the semilunar valves open. A valve opens the instant pressure behind it exceeds pressure in front of it, that single rule explains every valve event in the cycle.",
      question: "What single rule determines exactly when a heart valve opens or closes during the cardiac cycle?",
      keywords: ['pressure difference', 'atrioventricular valve', 'semilunar valve', 'systole'] },
    { subject: 'biology', topic: 'Genetic information, variation and relationships between organisms', leaf: 'Meiosis and genetic variation',
      explain: "Meiosis produces four genetically different haploid daughter cells from one diploid parent cell. Variation arises through crossing over in prophase I, where homologous chromosomes exchange DNA sections at chiasmata, and independent assortment, where homologous pairs line up randomly at the equator in metaphase I. Fertilisation then adds further variation by combining gametes from two genetically different parents.",
      question: "Name the two events within meiosis itself that generate genetic variation, and state which phase each occurs in.",
      keywords: ['crossing over', 'independent assortment', 'prophase i', 'metaphase i'] },
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
    { subject: 'maths', topic: 'Exponentials and logarithms', leaf: 'Logarithms and their laws',
      explain: "A logarithm answers: what power do I raise this base to, to get this number. If a^x = y then log base a of y = x. The three key laws: log(a) + log(b) = log(ab), log(a) minus log(b) = log(a/b), and n log(a) = log(a^n). These let you solve equations where the unknown is in the exponent by taking logs of both sides.",
      question: "State the three laws of logarithms used to combine or split log expressions.",
      keywords: ['log(ab)', 'log(a/b)', 'n log(a)', 'power'] },
    { subject: 'maths', topic: 'Sequences and series', leaf: 'Geometric sequences and series',
      explain: "A geometric sequence has a constant ratio r between consecutive terms, with nth term a times r to the power (n-1). The sum of the first n terms is a(1-r^n)/(1-r). If minus one is less than r is less than one, the series converges to a sum to infinity of a/(1-r). Always check whether a question wants a term, a partial sum, or the sum to infinity, they use different formulae.",
      question: "State the condition on r needed for a geometric series to have a sum to infinity, and the formula for that sum.",
      keywords: ['common ratio', 'sum to infinity', 'converges', 'a/(1-r)'] },
    { subject: 'maths', topic: 'Numerical methods', leaf: 'The Newton-Raphson method',
      explain: "An iterative method for finding an approximate root of f(x) = 0. From an estimate x_n, the next estimate is x_(n+1) = x_n minus f(x_n)/f'(x_n), following the tangent line down to the x-axis. It can fail near a stationary point, since f'(x_n) is close to zero there and the correction term becomes huge, sending the next estimate far from the root.",
      question: "State the Newton-Raphson iteration formula, and explain why it can fail near a stationary point.",
      keywords: ['tangent', 'stationary point', 'iterative', 'f prime'] },
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
    { subject: 'economics', topic: 'Measures of economic performance', leaf: 'Inflation',
      explain: "Inflation is a sustained rise in the general price level, measured mainly by the Consumer Prices Index. Demand-pull inflation happens when aggregate demand rises faster than aggregate supply. Cost-push inflation happens when production costs rise, for example wages or raw materials, and firms pass this on as higher prices.",
      question: "Distinguish between demand-pull and cost-push inflation.",
      keywords: ['consumer prices index', 'demand-pull', 'cost-push'] },
    { subject: 'economics', topic: 'Government intervention (Theme 3)', leaf: 'Regulation and deregulation',
      explain: "Regulation is government-imposed rules restricting firm behaviour, for example price caps or quality standards, used to correct market failure or restrain monopoly power. Deregulation removes such rules to increase competition and cut compliance costs, but risks allowing market failure or exploitation of consumers to re-emerge.",
      question: "Give one benefit and one risk of deregulating a previously regulated market.",
      keywords: ['price cap', 'market power', 'compliance costs'] },
    { subject: 'economics', topic: 'International economics', leaf: 'Exchange rates',
      explain: "An exchange rate is the price of one currency in terms of another. Under a floating system, it is set by demand for and supply of the currency in foreign exchange markets. A currency depreciates when its value falls, making exports cheaper abroad and imports more expensive at home, which can improve the trade balance and stoke inflation.",
      question: "Explain the likely effect of a depreciation of the pound on UK exports and imports.",
      keywords: ['depreciation', 'exports cheaper', 'imports more expensive'] },
  ];

  const SUBJECT_ALIASES = {
    biology: ['biology', 'bio'],
    maths: ['maths', 'math', 'mathematics'],
    economics: ['economics', 'econ'],
  };
  function matchSubjectAlias(inputLower) {
    return Object.keys(SUBJECT_ALIASES).find(s => SUBJECT_ALIASES[s].some(alias => inputLower.includes(alias)));
  }

  const STOPWORDS = new Set(['the','a','an','of','to','in','on','and','or','is','are','what','how','why','explain','tell','me','about','for','with','does','do','can','you','that']);
  function tokenize(text) { return String(text).toLowerCase().match(/[a-z0-9+|]+/g) || []; }

  function scoreEntry(leafName, topicName, inputLower, inputTokens) {
    const leafLower = leafName.toLowerCase();
    if (inputLower.includes(leafLower)) return 100;
    let score = 0;
    tokenize(leafName).forEach(tok => { if (!STOPWORDS.has(tok) && tok.length >= 3 && inputTokens.includes(tok)) score += 5; });
    tokenize(topicName).forEach(tok => { if (!STOPWORDS.has(tok) && tok.length >= 3 && inputTokens.includes(tok)) score += 2; });
    if (inputLower.includes(topicName.toLowerCase())) score += 4;
    return score;
  }

  // Matches against the small curated set with hand-written explanations.
  function findBestKnowledgeMatch(text) {
    const inputLower = text.toLowerCase();
    const inputTokens = tokenize(text);
    let best = null, bestScore = 0;
    KNOWLEDGE.forEach(entry => { const s = scoreEntry(entry.leaf, entry.topic, inputLower, inputTokens); if (s > bestScore) { bestScore = s; best = entry; } });
    return bestScore > 0 ? best : null;
  }

  // Matches against the complete 221-point specification. Used for actions
  // (mark revised, mark done, status checks, generic quizzing) so those
  // commands work on any topic, not just the curated subset.
  function findBestSpecMatch(text) {
    const inputLower = text.toLowerCase();
    const inputTokens = tokenize(text);
    let best = null, bestScore = 0;
    M.ALL_LEAVES.forEach(l => { const s = scoreEntry(l.leafName, l.topicName, inputLower, inputTokens); if (s > bestScore) { bestScore = s; best = l; } });
    return bestScore > 0 ? best : null;
  }

  function findKnowledgeForSpecLeaf(l) {
    return KNOWLEDGE.find(e => e.subject === l.subject && e.topic === l.topicName && e.leaf === l.leafName) || null;
  }

  let pendingQuiz = null; // { mode: 'curated' | 'generic', entry }
  let lastDiscussed = null; // last KNOWLEDGE entry explained, for follow-up questions

  function buildWelcomeMessage(state) {
    const note = state.onboarded ? '' : " You haven't run this week's Strategy Briefing yet. Visit that page to set one up.";
    return `Hi. I'm your offline Mentor Assistant. The Claude backend isn't connected right now. I can explain a curated set of high-yield topics in depth, quiz you on any of the 221 specification points (self-assessed if it's outside my curated set), check the status of any topic, mark things revised or done, and tell you what to study right now. Try "explain the Krebs cycle", "quiz me on exchange rates", or "status of moments".${note}`;
  }

  function retentionLine(state, subject, topic, leaf) {
    const ls = state.syllabus[subject][topic][leaf];
    const badge = M.getRetentionBadge(ls.lastRevised);
    return `Retention: ${badge.label.toLowerCase()}, last revised ${M.daysAgoLabel(ls.lastRevised)}.${ls.highPriority ? ' Flagged high priority this week.' : ''}`;
  }

  function markRevised(l) { const state = M.loadState(); const ls = state.syllabus[l.subject][l.topicName][l.leafName]; ls.lastRevised = Date.now(); M.scheduleReview(ls, 'good'); M.saveState(state); }
  function markDone(l) { const state = M.loadState(); state.syllabus[l.subject][l.topicName][l.leafName].done = true; M.saveState(state); }

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
      return "It's the weekend. Good time for timed past paper practice or deep syllabus synthesis.";
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
    const l = findBestSpecMatch(inputLower);
    if (!l) return "I can mark a topic as revised or done, but I couldn't tell which topic you mean. Try naming it directly.";
    if (/\bdone\b|\bcomplete|\bfinish|\bmaster/i.test(inputLower)) { markDone(l); return `Marked "${l.leafName}" as done in your syllabus checklist.`; }
    markRevised(l);
    return `Marked "${l.leafName}" as revised just now. Its retention badge and flashcard schedule are both updated.`;
  }

  function tryHandleStatusCommand(inputLower, state) {
    if (!(inputLower.includes('status') || inputLower.includes('how am i doing') || inputLower.includes('retention on') || inputLower.includes('how is my'))) return null;
    const l = findBestSpecMatch(inputLower);
    if (!l) return "Tell me which topic you want the status of, and I'll check it against your real progress data.";
    const ls = state.syllabus[l.subject][l.topicName][l.leafName];
    const badge = M.getRetentionBadge(ls.lastRevised);
    return `${l.leafName} (${M.SUBJECT_LABELS[l.subject]}, Year ${l.year}): ${badge.label.toLowerCase()}, last revised ${M.daysAgoLabel(ls.lastRevised)}. Marked as mastered: ${ls.done ? 'yes' : 'no'}.${ls.highPriority ? ' Flagged high priority this week.' : ''} Reviewed ${ls.srsReviews || 0} time${(ls.srsReviews || 0) === 1 ? '' : 's'} in Flashcards.`;
  }

  function tryHandleQuizCommand(inputLower) {
    if (!(inputLower.includes('quiz') || inputLower.includes('test me'))) return null;
    const subjectAlias = matchSubjectAlias(inputLower);

    if (inputLower.includes('that') && lastDiscussed) {
      pendingQuiz = { mode: 'curated', entry: lastDiscussed };
      return `Quiz time. ${M.SUBJECT_LABELS[lastDiscussed.subject]}, ${lastDiscussed.leaf}.\n\n${lastDiscussed.question}\n\nType your answer, or say "skip".`;
    }

    const namedCurated = findBestKnowledgeMatch(inputLower);
    if (namedCurated && (!subjectAlias || namedCurated.subject === subjectAlias)) {
      pendingQuiz = { mode: 'curated', entry: namedCurated };
      return `Quiz time. ${M.SUBJECT_LABELS[namedCurated.subject]}, ${namedCurated.leaf}.\n\n${namedCurated.question}\n\nType your answer, or say "skip".`;
    }

    const namedSpec = findBestSpecMatch(inputLower);
    if (namedSpec) {
      pendingQuiz = { mode: 'generic', entry: namedSpec };
      return `Quiz time. ${M.SUBJECT_LABELS[namedSpec.subject]}, ${namedSpec.leafName}.\n\nThis one isn't in my curated set, so explain it from memory in your own words: what it is, why it matters, and one exam-style detail.\n\nWhen you're done, tell me how it went: "got it", "shaky", or "no idea".`;
    }

    let pool = KNOWLEDGE;
    if (subjectAlias) pool = pool.filter(e => e.subject === subjectAlias);
    if (!pool.length) pool = KNOWLEDGE;
    const entry = pool[Math.floor(Math.random() * pool.length)];
    pendingQuiz = { mode: 'curated', entry };
    return `Quiz time. ${M.SUBJECT_LABELS[entry.subject]}, ${entry.leaf}.\n\n${entry.question}\n\nType your answer, or say "skip".`;
  }

  function evaluateQuizAnswer(answerText) {
    const { mode, entry } = pendingQuiz;
    pendingQuiz = null;

    if (mode === 'generic') {
      const state = M.loadState();
      const ls = state.syllabus[entry.subject][entry.topicName][entry.leafName];
      const lower = answerText.toLowerCase();
      let rating = 'good';
      if (/no idea|none|blank|skip/.test(lower)) rating = 'again';
      else if (/shaky|sort of|kind of|not sure/.test(lower)) rating = 'hard';
      M.scheduleReview(ls, rating);
      M.saveState(state);
      const badge = M.getRetentionBadge(ls.lastRevised);
      return `Logged. "${entry.leafName}" is now ${badge.label.toLowerCase()} in your retention tracker, and its next Flashcards review is scheduled. I don't have a written model answer for this one offline. For a full check, ask the real Claude backend or review it on the Flashcards page.`;
    }

    if (/^skip$/i.test(answerText.trim())) return `No worries. Here's the explanation:\n\n${entry.explain}`;
    const answerLower = answerText.toLowerCase();
    const matched = entry.keywords.filter(k => answerLower.includes(k));
    const good = matched.length >= Math.ceil(entry.keywords.length / 2);
    let feedback = good ? `Solid answer. You covered: ${matched.join(', ')}.` : `Partial. Key terms to include: ${entry.keywords.join(', ')}.`;
    feedback += `\n\nFull explanation:\n${entry.explain}`;
    if (good) {
      const state = M.loadState();
      const ls = state.syllabus[entry.subject][entry.topic][entry.leaf];
      ls.lastRevised = Date.now();
      M.scheduleReview(ls, 'good');
      M.saveState(state);
      feedback += `\n\nSince that was solid, I've marked "${entry.leaf}" as revised for you.`;
    }
    lastDiscussed = entry;
    return feedback;
  }

  function tryHandleFollowUp(inputLower) {
    if (!lastDiscussed) return null;
    if (/^(explain more|go over that|repeat that|again|say that again|more detail|elaborate)/.test(inputLower)) {
      return `${lastDiscussed.topic}. ${lastDiscussed.leaf}\n\n${lastDiscussed.explain}`;
    }
    if (/give me an example|worked example|show me an example/.test(inputLower)) {
      return `I don't have a separate worked example prewritten for this one offline. Try applying it to a past exam question on "${lastDiscussed.leaf}", or ask the real AI tutor when it's connected for a worked example.\n\nThe core explanation again, to work from:\n${lastDiscussed.explain}`;
    }
    return null;
  }

  function generateLocalReply(userText, state) {
    const inputLower = userText.toLowerCase().trim();
    if (pendingQuiz) return evaluateQuizAnswer(userText);
    if (!inputLower) return 'Go ahead and ask me something. Try "help" to see what I can do.';
    if (/^(hi|hello|hey|yo)\b/.test(inputLower)) return buildWelcomeMessage(state);
    if (inputLower.includes('help') || inputLower.includes('what can you do')) {
      return "I can explain a curated set of high-yield topics in depth, quiz you on any of the 221 specification points (self-assessed if a topic is outside my curated set), check the live status of any topic, mark topics revised or done, and show your Mentor Strategy, homework, or critical decay topics. Full-depth explanations across the whole specification, homework-setting, and past-paper walkthroughs need the real Claude backend.";
    }

    const followUp = tryHandleFollowUp(inputLower);
    if (followUp) return followUp;

    const mutationReply = tryHandleMutationCommand(inputLower);
    if (mutationReply) return mutationReply;

    const statusReply = tryHandleStatusCommand(inputLower, state);
    if (statusReply) return statusReply;

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

    const entry = findBestKnowledgeMatch(userText);
    if (entry) {
      lastDiscussed = entry;
      return `${entry.topic}. ${entry.leaf}\n\n${entry.explain}\n\n${retentionLine(state, entry.subject, entry.topic, entry.leaf)}\n\nWant a quick self-test? Say "quiz me on that". Or ask "status of ${entry.leaf.toLowerCase()}" any time to check this again later.`;
    }

    const specEntry = findBestSpecMatch(userText);
    if (specEntry) {
      return `"${specEntry.leafName}" (${M.SUBJECT_LABELS[specEntry.subject]}, Year ${specEntry.year}) is on the specification, but I don't have a written explanation for it in my offline set. I can still mark it revised or done, quiz you on it (self-assessed), or tell you its retention status. For a full explanation, connect the real Claude backend.`;
    }

    return "I didn't recognise that topic. Try naming one directly, or ask \"what should I study now?\", \"quiz me\", \"status of [topic]\", or \"help\".";
  }

  global.TutorEngine = { generateLocalReply, buildWelcomeMessage, KNOWLEDGE };
})(window);
