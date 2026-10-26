import { webSearch } from "#public/tools/web-search.js";

export const browserbaseSearch = webSearch({ provider: "browserbase" });
export const nativeSearch = webSearch({ provider: "native", fallback: "parallel" });
