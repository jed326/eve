---
"eve": minor
---

Add Tako as a selectable AI Gateway provider for the built-in `web_search` tool. Export `webSearch({ provider: "tako" })` from `agent/tools/web_search.ts` to search the live web and Tako's curated knowledge graph in one call; results can include structured data cards alongside web results. Content inlining is pinned off so tool results stay bounded and flat-rate; retrieval settings such as effort, counts, domains, and dates stay model-controlled. Exa remains the default.
