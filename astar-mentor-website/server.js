/**
 * server.js
 *
 * Serves the static multi-page website in /public and exposes a
 * single API endpoint, POST /api/chat, that calls the real Claude
 * API server-side. The API key lives only in this process's
 * environment (ANTHROPIC_API_KEY). It never reaches the browser.
 *
 * Local dev:  copy .env.example to .env, fill in your key, then:
 *               npm install
 *               npm start
 * Render:     set ANTHROPIC_API_KEY in the service's Environment tab.
 *             See README.md for the full walkthrough.
 */

'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = 'claude-opus-5';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

app.use(express.json({ limit: '20mb' })); // generous limit to allow a couple of attached photos
app.use(express.static(path.join(__dirname, 'public')));

/* ============================================================
   EXACT EXAM BOARD SPECIFICATIONS (server-side source of truth)
   Mirrors public/mentor-shared.js, kept here explicitly so the
   system prompt's scope can never be altered by client input.
   Covers the complete two-year specification for all three boards.
============================================================ */
const SYLLABUS = {
  'AQA Biology (7402)': {
    'Biological molecules (Year 12)': ['Condensation and hydrolysis', 'Monosaccharides and disaccharides', 'Polysaccharides', 'Triglycerides and phospholipids', 'Amino acids and protein structure', 'Enzyme action and inhibition', 'DNA and RNA structure', 'DNA replication', 'ATP', 'Water and inorganic ions'],
    'Cells (Year 12)': ['Eukaryotic cell structure', 'Prokaryotic cells and viruses', 'Microscopy', 'Cell fractionation and ultracentrifugation', 'The cell cycle and mitosis', 'The plasma membrane', 'Diffusion', 'Osmosis', 'Active transport', 'Antigens and the immune response', 'Antibodies and vaccination', 'HIV and antiviral drugs'],
    'Organisms exchange substances with their environment (Year 12)': ['Surface area to volume ratio', 'Gas exchange in single-celled organisms and insects', 'Gas exchange in fish', 'Gas exchange in the human lungs', 'Digestion and absorption', 'The circulatory system', 'Haemoglobin', 'The cardiac cycle', 'Transpiration and the xylem', 'Translocation and the phloem'],
    'Genetic information, variation and relationships between organisms (Year 12)': ['DNA, genes and chromosomes', 'Transcription', 'Translation and the genetic code', 'Gene mutations', 'Meiosis and genetic variation', 'Natural selection and adaptation', 'Classification and taxonomy', 'Species diversity and biodiversity', "Simpson's Index of Diversity"],
    'Photosynthesis (Year 13)': ['Light-dependent reactions', 'Light-independent reactions', 'Limiting factors'],
    'Respiration (Year 13)': ['Glycolysis', 'Link reaction', 'Krebs cycle', 'Oxidative phosphorylation', 'Anaerobic respiration'],
    'Energy and ecosystems (Year 13)': ['Energy transfer between trophic levels', 'Net and gross primary production', 'The nitrogen cycle', 'The phosphorus cycle', 'Fertilisers'],
    'Organisms respond to changes in their environment (Year 13)': ['Receptors and survival', 'Control of heart rate', 'The nerve impulse', 'Synaptic transmission', 'Muscle structure and the sliding filament theory', 'Homeostasis principles', 'Control of blood glucose', 'Osmoregulation and the kidney', 'Plant responses and auxins', 'Hormonal control in animals'],
    'Genetics, populations, evolution and ecosystems (Year 13)': ['Monohybrid and dihybrid inheritance', 'Sex linkage and autosomal linkage', 'Epistasis', 'The chi-squared test', 'The Hardy-Weinberg principle', 'Types of selection', 'Speciation', 'Population size and competition', 'Predator-prey relationships', 'Ecological succession'],
    'The control of gene expression (Year 13)': ['Mutations and protein structure', 'Stem cells', 'Regulation of transcription and translation', 'Epigenetic control', 'Genome and proteome', 'Recombinant DNA technology', 'PCR', 'Gel electrophoresis', 'Oncogenes and tumour suppressor genes'],
  },
  'OCR A Mathematics (H240)': {
    'Proof (Year 12)': ['Proof by deduction', 'Proof by exhaustion', 'Disproof by counter-example'],
    'Algebra and functions (Year 12)': ['Indices and surds', 'Quadratic functions', 'Simultaneous equations', 'Inequalities', 'Polynomials', 'Domain and range', 'Composite functions', 'Inverse functions', 'y = |f(x)|', 'y = f(|x|)'],
    'Coordinate geometry (Year 12)': ['Equation of a straight line', 'Circles'],
    'Trigonometry, core (Year 12)': ['Sine and cosine rules', 'Graphs of sin, cos and tan', 'Trigonometric identities', 'Trigonometric transformations', 'Solving trig equations'],
    'Exponentials and logarithms (Year 12)': ['Exponential functions and graphs', 'Logarithms and their laws', 'Exponential models'],
    'Differentiation, core (Year 12)': ['Gradients and rates of change', 'Differentiating polynomials', 'Tangents and normals', 'Stationary points and second derivatives'],
    'Integration, core (Year 12)': ['Integrating polynomials', 'Definite integrals and areas under curves'],
    'Statistical sampling and data (Year 12)': ['Sampling techniques', 'Measures of location and spread', 'Representation of data', 'Correlation and regression'],
    'Probability and distributions, core (Year 12)': ['Basic probability and Venn diagrams', 'Tree diagrams', 'The binomial distribution'],
    'Mechanics: kinematics and forces (Year 12)': ['Quantities and units', 'Motion graphs and SUVAT', "Newton's laws of motion", 'Types of force and connected particles'],
    'Algebra, further (Year 13)': ['Partial fractions'],
    'The binomial theorem (Year 13)': ['Binomial expansion', 'Applications of the binomial theorem'],
    'Sequences and series (Year 13)': ['Arithmetic sequences and series', 'Geometric sequences and series', 'Sigma notation', 'Recurrence relations'],
    'Radians (Year 13)': ['Radian measure', 'Arc length and sector area', 'Small angle approximations'],
    'Trigonometry, further (Year 13)': ['Reciprocal functions', 'Inverse trigonometric functions', 'Further trigonometric identities'],
    'Differentiation, further (Year 13)': ['Differentiating trig, exponential and log functions', 'The chain rule', 'The product rule', 'The quotient rule', 'Implicit differentiation', 'Parametric differentiation'],
    'Integration, further (Year 13)': ['Integration by substitution', 'Integration by parts', 'Integration using partial fractions', 'Differential equations'],
    'Numerical methods (Year 13)': ['Locating roots', 'Iteration', 'The Newton-Raphson method', 'The trapezium rule'],
    'Vectors (Year 13)': ['2D and 3D vectors', 'Vector equations of a line'],
    'Statistical distributions and hypothesis testing (Year 13)': ['The normal distribution', 'Hypothesis testing with the binomial distribution', 'Hypothesis testing for correlation'],
    'Mechanics: further forces (Year 13)': ['Variable acceleration using calculus', 'Projectiles', 'Moments and equilibrium'],
  },
  'Edexcel A Economics A (9EC0)': {
    'Nature of economics (Year 12, Theme 1)': ['Positive and normative statements', 'Opportunity cost', 'Production possibility frontiers'],
    'How markets work (Year 12, Theme 1)': ['Rational decision making', 'Demand', 'Price elasticity of demand', 'Income elasticity of demand', 'Supply', 'Price elasticity of supply', 'Price determination', 'Consumer and producer surplus'],
    'Market failure (Year 12, Theme 1)': ['Types of market failure', 'Externalities', 'Public goods', 'Information gaps'],
    'Government intervention (Year 12, Theme 1)': ['Methods of government intervention', 'Government failure'],
    'Measures of economic performance (Year 12, Theme 2)': ['Economic growth', 'Inflation', 'Employment and unemployment', 'Balance of payments'],
    'Aggregate demand and supply (Year 12, Theme 2)': ['Components of aggregate demand', 'Short-run and long-run aggregate supply'],
    'National income and economic growth (Year 12, Theme 2)': ['The circular flow of income', 'Injections and withdrawals', 'Causes of economic growth', 'Output gaps and the economic cycle'],
    'Macroeconomic objectives and policy (Year 12, Theme 2)': ['Demand-side policies, fiscal', 'Demand-side policies, monetary', 'Supply-side policies'],
    'Business growth (Year 13, Theme 3)': ['Business growth'],
    'Mergers (Year 13, Theme 3)': ['Mergers'],
    'Business objectives (Year 13, Theme 3)': ['Profit maximisation and alternative objectives'],
    'Revenues (Year 13, Theme 3)': ['Revenues'],
    'Costs (Year 13, Theme 3)': ['Costs'],
    'Profits (Year 13, Theme 3)': ['Profits'],
    'Market structures (Year 13, Theme 3)': ['Perfect competition', 'Monopolistic competition', 'Oligopoly', 'Monopoly', 'Monopsony', 'Price discrimination'],
    'The labour market (Year 13, Theme 3)': ['Demand and supply of labour', 'Wage determination', 'National minimum and living wage', 'Zero-hour contracts'],
    'Government intervention in markets (Year 13, Theme 3)': ['Competition policy', 'Regulation and deregulation', 'Public ownership and privatisation'],
    'Market failure and regulation (Year 13, Theme 3)': ['Market failure and regulation'],
    'International economics (Year 13, Theme 4)': ['Globalisation', 'Trade and trading blocs', 'The World Trade Organisation', 'Exchange rates'],
    'Poverty, inequality and development (Year 13, Theme 4)': ['Absolute and relative poverty', 'Measures of inequality', 'Measuring development'],
    'Emerging economies (Year 13, Theme 4)': ['Factors influencing growth and development', 'Strategies for growth and development'],
    'The financial sector and the state (Year 13, Theme 4)': ['Role of financial markets', 'Central banks and regulation', 'Public expenditure and taxation', 'The impact of macroeconomic policy'],
  },
};

function buildSyllabusText() {
  const lines = [];
  Object.keys(SYLLABUS).forEach(board => {
    lines.push(`\n${board}:`);
    Object.keys(SYLLABUS[board]).forEach(topic => {
      const leaves = SYLLABUS[board][topic];
      const isFlat = leaves.length === 1;
      lines.push(isFlat ? `  - ${topic}` : `  - ${topic}: ${leaves.join(', ')}`);
    });
  });
  return lines.join('\n');
}

const STABLE_SYSTEM_PROMPT = `You are the AI Tutor inside The A* Mentor, a Year 13 student's personal study dashboard for three A-Level subjects. You are speaking directly with that student.

## Your role
Act as an expert Year 13 tutor for these three subjects, covering their complete two-year specification, and only these three subjects. Do not teach or reference content outside these specifications unless the student explicitly asks something unrelated, in which case answer briefly and steer back to their subjects.

## Complete exam board specifications in scope
${buildSyllabusText()}

Stay precisely within this scope. Use the exact terminology these specifications require, for example "affinity" not "likes", "hydrogen bonds between complementary bases" not "breaks the DNA", "higher water potential to lower water potential", exact economics terms like "allocative efficiency" and "supernormal profit". If asked about something adjacent but not on this list, say so plainly and redirect to what is actually on the list. When relevant, tell the student whether a topic is Year 12 or Year 13 content.

## How to teach
Explain concepts like an expert Year 13 tutor: clear, precise, exam-focused, never patronising. Assume the student is bright and revising seriously, not learning from scratch. Break concepts down step by step rather than giving a wall of text, using short paragraphs, numbered steps, or bullet points where it aids clarity. When asked to teach or revise a subtopic, go through the complete subtopic, all its component parts from the specification above, not just a fragment of it, unless the student asks for a narrower slice. Explain why, not just what: link structure to function, cause to effect, mechanism to exam mark.

Track trends. You will be given the student's current mastery, retention decay, and anxiety data before each message, in a STUDENT STATUS block. Use it. Proactively mention patterns you notice: a subject with repeated critical decay, consistently high anxiety in one subject, a topic they keep avoiding, or strong progress worth acknowledging. Connect the specific answer to what you know about their overall trajectory when relevant, rather than answering in isolation.

## Image attachments
The student can attach photos: a past paper question, a textbook diagram, their own handwritten working. Look closely at any attached image before responding. If handwriting or a diagram is unclear, say what you can and cannot make out rather than guessing silently.

## Past paper run-throughs
When asked to run through a past paper or a set of questions, go question by question. Present one question at a time, or acknowledge the one shown in an image. Give the student a real chance to attempt it themselves before revealing anything: ask for their attempt, or offer a hint if they are stuck, rather than immediately giving the answer. Once they attempt it, or ask for the answer, give full mark-scheme-style feedback: the command word being tested, the exact marking points in the specification's language, common ways marks are dropped, and the correct answer. Then move to the next question. Do not give every answer at once unless the student explicitly asks for that.

## Setting homework
When the student asks you to set homework, or when it is clearly the right move, for example after identifying a weak topic, end your reply with a fenced block listing the tasks, one per line, with nothing else inside the fence:

\`\`\`homework
Task one, phrased as a concrete action
Task two
\`\`\`

Write explanation before or after the fence if useful, but the fence itself must contain only the homework lines. The app parses this exact format to offer the student a button that adds these tasks to their real homework list. Only include this fence when you are actually setting homework, not for ordinary explanations.

## Tone and formatting
Direct, warm, and encouraging without being saccharine. British spelling and terminology. No filler such as "it's important to note that". Keep replies focused: thorough on the substance, not padded. Do not use em dashes anywhere in your response; use a full stop, comma, or colon instead.`;

function buildStudentStatusText(context) {
  if (!context || typeof context !== 'object') {
    return 'STUDENT STATUS: No dashboard data available yet. The student may not have completed their Weekly Briefing.';
  }
  const lines = ['STUDENT STATUS (live, from their dashboard):'];
  lines.push(`- Weekly Briefing completed: ${context.onboarded ? 'yes' : 'no'}`);
  if (context.mentorStrategyText) lines.push(`- Current Mentor Strategy: ${context.mentorStrategyText}`);
  if (context.anxiety) lines.push(`- Anxiety ratings (1-10): Biology ${context.anxiety.biology}, Maths ${context.anxiety.maths}, Economics ${context.anxiety.economics}`);
  if (context.confidence) lines.push(`- Confidence ratings (1-10): Biology ${context.confidence.biology}, Maths ${context.confidence.maths}, Economics ${context.confidence.economics}`);
  if (typeof context.overallMasteryPct === 'number') lines.push(`- Overall syllabus mastery: ${context.overallMasteryPct}%`);
  if (Array.isArray(context.highPriorityTopics) && context.highPriorityTopics.length) {
    lines.push(`- High priority topics this week: ${context.highPriorityTopics.join('; ')}`);
  }
  if (Array.isArray(context.criticalDecayTopics) && context.criticalDecayTopics.length) {
    lines.push(`- Topics in critical decay, 7+ days unrevised, flag these proactively: ${context.criticalDecayTopics.join('; ')}`);
  }
  if (Array.isArray(context.pendingHomework) && context.pendingHomework.length) {
    lines.push(`- Pending homework: ${context.pendingHomework.join('; ')}`);
  }
  return lines.join('\n');
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, model: MODEL, hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.post('/api/chat', async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set on this server. See README.md to configure it on Render.' });
      return;
    }

    const { message, images, history, context } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Missing message field.' });
      return;
    }

    const priorMessages = Array.isArray(history)
      ? history
          .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
          .map(m => ({ role: m.role, content: m.text }))
      : [];

    const currentContent = [];
    if (Array.isArray(images)) {
      images.slice(0, 5).forEach(img => {
        if (img && typeof img.data === 'string' && typeof img.mediaType === 'string') {
          currentContent.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } });
        }
      });
    }
    currentContent.push({ type: 'text', text: message });

    const messages = [...priorMessages, { role: 'user', content: currentContent }];

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system: [
        { type: 'text', text: STABLE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: buildStudentStatusText(context) },
      ],
      messages,
    });

    if (response.stop_reason === 'refusal') {
      res.json({ reply: "I'm not able to help with that specific request, but I'm glad to keep going on your Biology, Maths, or Economics revision. What would you like to look at?" });
      return;
    }

    const textBlock = response.content.find(block => block.type === 'text');
    res.json({ reply: textBlock ? textBlock.text : 'No text content was returned.' });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      res.status(500).json({ error: "The server's ANTHROPIC_API_KEY was rejected. Double-check it in Render's Environment settings." });
    } else if (error instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: 'Rate limited by the Claude API. Please wait a moment and try again.' });
    } else if (error instanceof Anthropic.BadRequestError) {
      res.status(400).json({ error: 'Bad request to Claude API: ' + error.message });
    } else if (error instanceof Anthropic.APIError) {
      res.status(502).json({ error: `Claude API error (${error.status}): ${error.message}` });
    } else {
      console.error('Unexpected /api/chat error:', error);
      res.status(500).json({ error: 'Unexpected server error. Check the server logs.' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`The A* Mentor website is running on port ${PORT}`);
  console.log(process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC_API_KEY detected. AI Tutor is live.' : 'WARNING: ANTHROPIC_API_KEY is not set. The AI Tutor will fall back to its offline engine on the client until this is configured.');
});
