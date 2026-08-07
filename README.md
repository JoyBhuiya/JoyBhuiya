# Life in the UK Test — practice questions and mock exams

A study app for the **Life in the UK Test**, the computer-based test required for
UK settlement and naturalisation. Practice by chapter, sit full timed mock
exams, and track a readiness score that only says you're ready once you've
proved it.

**→ [joybhuiya.github.io/JoyBhuiya](https://joybhuiya.github.io/JoyBhuiya/)**

> **One-time setup:** GitHub Pages needs switching on before the first deploy
> can finish — go to **Settings → Pages → Source** and choose **GitHub Actions**,
> then re-run the workflow. The build, tests and content checks all pass without
> it; only the publish step is blocked, because the workflow token isn't allowed
> to create the Pages site itself.

## What it does

- **Practice by chapter** — pick a chapter, a length, and whether to focus on
  your weak spots or on questions you haven't seen. Every answer is explained.
- **Timed mock exams** — 24 questions, 45 minutes, 18 to pass. Same shape as the
  real paper, with flagging and a review pass before you submit.
- **Results that tell you what to do next** — per-chapter breakdown, your two
  weakest sections named outright, and a question-by-question review.
- **A readiness score** that weighs recent mock scores, how much of the bank
  you've covered, and lifetime accuracy — capped until you've actually sat two
  full mocks, because a confident number off the back of easy practice would be
  worse than no number at all.
- **Works offline.** Installable as a PWA; the whole question bank is cached.
- **Nothing leaves your browser.** Progress lives in `localStorage` — no
  account, no server, no tracking. Export a JSON backup from Settings.

## About the questions

The Home Office does not publish the real test questions, and other sites'
question banks are copyrighted. Every question here was **written from scratch**
using the factual content of the official handbook, *Life in the United Kingdom:
A Guide for New Residents* (3rd edition) — facts aren't copyrightable, the prose
around them is.

This is an independent study tool. It is not affiliated with, endorsed by, or
connected to the Home Office or UK Visas and Immigration, and it is no
substitute for reading the handbook.

## Running it

```bash
npm install
npm run dev              # http://localhost:5173/JoyBhuiya/
npm test                 # unit + integration tests
npm run lint             # typecheck
npm run validate:questions   # content gate — ids, answers, duplicates, coverage
npm run build && npm run preview
```

## Notes for anyone changing this

**The base path matters.** The repo is `JoyBhuiya/JoyBhuiya`, not
`JoyBhuiya.github.io`, so GitHub Pages serves it as a *project* site under
`/JoyBhuiya/`. That prefix appears in `vite.config.ts` (`base`), the PWA
`scope` and `start_url`, and the service worker's navigate fallback — they all
have to agree. Routing is hash-based for the same reason: there's no server-side
rewrite on Pages, and the usual `404.html` trick doesn't survive a sub-path.

**Adding questions.** Shards live in `src/data/questions/ch*.ts` and are built
with the helpers in `helpers.ts`. Run `npm run validate:questions` before
committing — it rejects duplicate ids, near-duplicate stems, answers that don't
match an option, and explanations too short to teach anything.

## Licence

MIT.
