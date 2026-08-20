AI Intelligence V2 — Integrated Build

What changed
1. dashboard.js: added AI INTELLIGENCE CORE instructions to the existing system prompt.
2. dashboard.js: increased analytical output budget to 3000 tokens and reduced temperature to 0.2.
3. dashboard.js: added AI Intelligence Layer v2.0 with semantic incident retrieval, incident summarization, text-risk indicators, school/category signals and recurring-problem clusters.
4. dashboard.js: preserved ai_intelligence when DashboardContextBuilder rebuilds context.
5. No UI markup, CSS design, API contract, data source, AICore public API or existing dashboard tabs were intentionally changed.

Deployment
- Replace the current dashboard.js with the included dashboard.js.
- Keep index.html, dashboard.css, aicore-orb.css and aicore-orb.js as included.
- Keep the existing Code.gs/backend.

Runtime test helpers
- window.AIIntelligence.version
- window.AIIntelligence.analyzeIncidents('أكثر البلاغات المتكررة في التكييف')
- window.AIIntelligence.getLastContext()

Important
The incident intelligence is advisory analysis. Official priority remains authoritative; text-risk is never used to silently rewrite the official priority.
