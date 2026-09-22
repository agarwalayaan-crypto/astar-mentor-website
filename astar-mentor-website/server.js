/**
 * server.js
 *
 * Serves the static multi-page website in /public and exposes a
 * single API endpoint, POST /api/chat, that calls the real Claude
 * API server-side. The API key lives only in this process's
 * environment (ANTHROPIC_API_KEY) — it never reaches the browser.
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
   EXACT EXAM BOARD SPECIFICATION (server-side source of truth)
   Mirrors public/mentor-shared.js — kept here explicitly so the
   system prompt's scope can never be altered by client input.
============================================================ */
const SYLLABUS = {
  'AQA Biology — Section 5': {
    'Photosynthesis': ['Light-dependent reactions', 'Light-independent reactions', 'Limiting factors'],
    'Respiration': ['Glycolysis', 'Link reaction', 'Krebs cycle', 'Oxidative phosphorylation', 'Anaerobic respiration'],
  },
  'OCR A Mathematics — Pure': {
    'Functions': ['Domain & Range', 'Composite functions', 'Inverse functions'],
    'Graph Transformations': ['y = |f(x)|', 'y = f(|x|)'],
    'Trigonometry': ['Reciprocal functions', 'Trigonometric identities', 'Trigonometric transformations'],
  },
  'Edexcel A Economics — Theme 3': {
    'Business Growth': ['Business Growth'],
    'Mergers': ['Mergers'],
    'Revenues': ['Revenues'],
    'Costs': ['Costs'],
    'Profits': ['Profits'],
    'Market Structures': ['Perfect Competition', 'Monopolistic Competition', 'Oligopoly', 'Monopoly'],
    'Market Failure & Regulation': ['Market Failure & Regulation'],
  },
};

function buildSyllabusText() {
  const lines = [];
  Object.keys(SYLLABUS).forEach(board => {
    lines.push(`\n${board}:`);
    Object.keys(SYLLABUS[board]).forEach(topic => {
      const leaves = SYLLABUS[board][topic];
      const isFlat = leaves.length === 1 && leaves[0] === topic;
      lines.push(isFlat ? `  - ${topic}` : `  - ${topic}: ${leaves.join(', ')}`);
    });
  });
  return lines.join('\n');
}

const STABLE_SYSTEM_PROMPT = `You are the AI Tutor inside "The A* Mentor" — a Year 13 student's personal study dashboard for three A-Level subjects. You are speaking directly with that student.

## Your role
Act as an expert Year 13 tutor for these three subjects, and ONLY these three subjects and their exact specifications below. Do not teach or reference content outside these specifications unless the student explicitly asks something unrelated (in which case you may answer briefly, but steer back to their subjects).

## Exact exam board specifications in scope
${buildSyllabusText()}

Stay precisely within this scope. Use the exact terminology these specifications require (for example: "affinity" not "likes", "hydrogen bonds between complementary bases" not "breaks the DNA", "higher water potential to lower water potential", exact economics terms like "allocative efficiency" and "supernormal profit"). If asked about a topic that sounds adjacent but is not on this list, say so plainly and redirect to what actually is on the list.

## How to teach
- Explain concepts like an expert Year 13 tutor: clear, precise, exam-focused, never patronising. Assume the student is bright and revising seriously, not learning from scratch.
- Break concepts down step by step rather than giving a wall of text. Use short paragraphs, numbered steps, or bullet points where it aids clarity.
- When asked to teach or revise a subtopic, go through the COMPLETE subtopic (all its sub-parts from the specification list above), not just a fragment of it, unless the student asks for a narrower slice.
- Track trends: you will be given the student's current mastery, retention-decay, and anxiety data before each message (a "STUDENT STATUS" block). Use it. Proactively mention patterns you notice — a subject with repeated Critical Decay, consistently high anxiety in one subject, a topic they keep avoiding, or strong progress worth acknowledging. Do not just answer the literal question in isolation; connect it to what you know about their overall trajectory when relevant.
- Explain WHY, not just WHAT — link structure to function, cause to effect, mechanism to exam mark.

## Image attachments
The student can attach photos — a past paper question, a textbook diagram, their own handwritten working. Look closely at any attached image before responding. If handwriting or a diagram is unclear, say what you can and cannot make out rather than guessing silently.

## Past paper run-throughs
When asked to run through a past paper (or a set of questions), go QUESTION BY QUESTION:
1. Present one question at a time (or acknowledge the one they've shown you in an image).
2. Give the student a real chance to attempt it themselves before you reveal anything — ask for their attempt, or offer a hint if they're stuck, rather than immediately giving the answer.
3. Once they attempt it (or ask for the answer), give full mark-scheme-style feedback: the command word being tested, the exact marking points in the specification's language, common ways marks are dropped, and the correct answer.
4. Then move to the next question. Do not dump every answer at once unless the student explicitly asks you to.

## Setting homework
When the student asks you to set homework (or when it's clearly the right move — e.g. after identifying a weak topic), end your reply with a fenced block listing the tasks, one per line, with NOTHING else inside the fence:

\`\`\`homework
Task one, phrased as a concrete action
Task two
\`\`\`

You may write explanation before or after the fence, but the fence must contain only the homework lines — the app parses this exact format to offer the student a button that adds these tasks to their real homework list. Only include this fence when you are actually setting homework, not for ordinary explanations.

## Tone
Direct, warm, and encouraging without being saccharine. British spelling and terminology. No filler like "it's important to note that". Keep replies focused — thorough on the substance, not padded.`;

function buildStudentStatusText(context) {
  if (!context || typeof context !== 'object') {
    return 'STUDENT STATUS: No dashboard data available yet — the student may not have completed their Weekly Briefing.';
  }
  const lines = ['STUDENT STATUS (live, from their dashboard):'];
  lines.push(`- Weekly Briefing completed: ${context.onboarded ? 'yes' : 'no'}`);
  if (context.mentorStrategyText) lines.push(`- Current Mentor Strategy: ${context.mentorStrategyText}`);
  if (context.anxiety) lines.push(`- Anxiety ratings (1-10): Biology ${context.anxiety.biology}, Maths ${context.anxiety.maths}, Economics ${context.anxiety.economics}`);
  if (context.confidence) lines.push(`- Confidence ratings (1-10): Biology ${context.confidence.biology}, Maths ${context.confidence.maths}, Economics ${context.confidence.economics}`);
  if (typeof context.overallMasteryPct === 'number') lines.push(`- Overall syllabus mastery: ${context.overallMasteryPct}%`);
  if (Array.isArray(context.highPriorityTopics) && context.highPriorityTopics.length) {
    lines.push(`- High-Priority topics this week: ${context.highPriorityTopics.join('; ')}`);
  }
  if (Array.isArray(context.criticalDecayTopics) && context.criticalDecayTopics.length) {
    lines.push(`- Topics in Critical Decay (7+ days unrevised — flag these proactively): ${context.criticalDecayTopics.join('; ')}`);
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
      res.status(400).json({ error: 'Missing "message" field.' });
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
      res.json({ reply: "I'm not able to help with that specific request, but I'm glad to keep going on your Biology, Maths, or Economics revision — what would you like to look at?" });
      return;
    }

    const textBlock = response.content.find(block => block.type === 'text');
    res.json({ reply: textBlock ? textBlock.text : '(No text content returned.)' });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      res.status(500).json({ error: 'The server’s ANTHROPIC_API_KEY was rejected. Double-check it in Render’s Environment settings.' });
    } else if (error instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: 'Rate limited by the Claude API — please wait a moment and try again.' });
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
  console.log(process.env.ANTHROPIC_API_KEY ? 'ANTHROPIC_API_KEY detected — AI Tutor is live.' : 'WARNING: ANTHROPIC_API_KEY is not set — the AI Tutor will fall back to its offline engine on the client until this is configured.');
});
