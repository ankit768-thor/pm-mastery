# PM Mastery — Free Product Management Course

A free, self-paced product management course that runs entirely in your browser — no signup, no install.

**▶️ Open the course: https://ankit768-thor.github.io/pm-mastery/**

## What's inside

**37 core days in seven sections, plus 17 Deep Dives modules:**

| Section | Days | Covers |
|---|---|---|
| Foundations | 1–7 | The PM role and mindset, Double Diamond / Design Thinking / Lean Startup, user research, personas and journey maps, problem definition and market sizing |
| Strategy | 8–14 | Vision vs strategy, OKRs, roadmapping, prioritization (RICE / MoSCoW / Kano), competitive analysis, North Star metrics |
| Execution | 15–21 | PRDs, user stories and acceptance criteria, Agile and Scrum, sprint planning, stakeholder management, A/B testing |
| Growth | 22–24 | AARRR pirate metrics, product-led growth, retention and cohort analysis |
| Career | 25–28 | PM interviews, portfolio building, certifications and career paths, transitioning from analyst/BA to PM |
| Advanced | 29–30 | Platform and AI product management, final exam |
| **Level Up** | **31–37** | **Hands-on tools (Jira, product analytics, SQL), API and technical fluency, design collaboration and Figma, pricing and monetization, AI product management deep-dive, a two-week real-world capstone, and an interview bootcamp** |

**Every day includes:**
- Learning objectives and key takeaways
- Curated reading articles from primary sources (Atlassian, Nielsen Norman Group, ProductPlan, Reforge, Y Combinator, Scrum.org, and others)
- A full-length video from a reputable channel
- A practical exercise that produces a real artifact
- A 10-question quiz with explanations

Your progress is saved in your own browser. Every lesson has its own link (for example `#day-13`), so you can bookmark or share it, and refreshing returns you to where you were.

## The Level Up section

Days 31–37 exist to close the gap between *knowing* product management and *being hirable* as a PM. They cover the things most courses skip: actually operating the tools, enough technical fluency to earn engineers' respect, pricing, shipping AI features responsibly, and — most importantly — **Day 36**, a guided two-week project where you interview real users, build a prototype, test it, and write it up as a portfolio case study.

## Deep Dives (new)

A separate section after the core course, for topics the 37 days don't cover in depth, plus case studies where you reason from data instead of memorising definitions. Start with Module 1: it maps the path and helps you pick what to study next.

| Module | Topic |
|---|---|
| Module 1 | PM Roles, the Product Lifecycle & Your Learning Path |
| Module 2 | Continuous Discovery: Jobs To Be Done, Opportunity Solution Trees & Assumption Mapping |
| Module 3 | Strategy Deep Dive: Business Models, Competitive Forces, Positioning & Moats |
| Module 4 | Advanced Prioritization: ICE, Opportunity Scoring, Cost of Delay & WSJF |
| Module 5 | Unit Economics & Business Metrics for PMs |
| Module 6 | Experimentation Deep Dive: Designing and Reading A/B Tests |
| Module 7 | Product Analytics & Root-Cause Analysis |
| Module 8 | Launch & Go-To-Market: Release Management, Launch Plans and Post-Launch Reviews |
| Module 9 | Technical PM: How Systems Fit Together |
| Module 10 | Building LLM Products: RAG, Agents, Model Choice and AI Product Metrics |
| Module 11 | Product Leadership & Product Operations |
| Module 12 | Case Study: Food Delivery Orders Are Declining |
| Module 13 | Case Study: Checkout Conversion Is Falling |
| Module 14 | Case Study: Prioritize Six Feature Requests |
| Module 15 | Case Study: Launch a New Product |
| Module 16 | Case Study: Fix a Retention Problem |
| Module 17 | The PM Toolkit: Templates & Calculators |

## PM Toolkit

[toolkit.html](https://ankit768-thor.github.io/pm-mastery/toolkit.html) has calculators (RICE, ICE, WSJF, A/B test sample size, unit economics) and copyable templates (PRD, problem statement, user story, interview script, journey map, opportunity solution tree, metrics tree, experiment brief, launch checklist, post-launch review).

## Running it locally

The app is a static site, but it uses JavaScript modules, so it needs to be served over HTTP rather than opened as a `file://` path:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Editing the content

All lessons, quizzes and sidebar sections live in `content/course.json`; the app loads it at startup, so content fixes never require touching the JavaScript. After editing, run the checks in `tests/` (see `tests/README.md`). If you change anything in `assets/`, run `python3 tools/rehash_assets.py` so browsers don't serve a stale cached copy.

## Notes

- Every article and video link in the course has been checked to confirm it loads and contains real content.
- All linked articles and videos are third-party resources, credited to their authors and linked to the original source. This repository contains the course structure and exercises only.
- This site uses Cloudflare Web Analytics, which counts page views without cookies and without collecting anything that identifies individual readers.
