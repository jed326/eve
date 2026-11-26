---
"eve": minor
---

`gatewayWebFetch({ provider: "tako" })` from `eve/tools/web_fetch` replaces the provided `web_fetch` with Tako Contents through AI Gateway, which returns a Tako card's data as CSV or a page's text, and saves a large result to a sandbox file instead of the model's context.

Only Gateway models get this `web_fetch`, and AI Gateway runs it with its usual credentials, so no Tako API key is needed. eve asks Tako for a download link, downloads it, and saves a result over 20,000 bytes under `/tmp/.eve/tool-results/` the way `offloadContent` does. The model gets the card's description and columns, the file's path, and its first lines.
