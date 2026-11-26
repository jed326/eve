import { frameworkTool } from "./framework-tool.js";

/** Fetch providers that AI Gateway runs for any Gateway model. */
export const WEB_FETCH_PROVIDERS = ["tako"] as const;

/** A fetch provider an agent can select, one of {@link WEB_FETCH_PROVIDERS}. */
export type WebFetchProvider = (typeof WEB_FETCH_PROVIDERS)[number];

/** The Gateway fetch an agent selected. */
export interface WebFetchSelection {
  readonly provider: WebFetchProvider;
}

const GATEWAY_WEB_FETCH_KIND = "eve:gateway-web-fetch";

/** Configuration accepted by {@link gatewayWebFetch}: the AI Gateway fetch provider to use. */
export interface GatewayWebFetchInput {
  /** A fetch provider that AI Gateway runs for any Gateway model. */
  readonly provider: WebFetchProvider;
}

/** Provider-managed `web_fetch` configuration returned by {@link gatewayWebFetch}. */
export interface GatewayWebFetchDefinition {
  readonly kind: typeof GATEWAY_WEB_FETCH_KIND;
  readonly provider: WebFetchProvider;
}

/**
 * Replaces the provided `web_fetch` tool with a fetch that AI Gateway runs.
 *
 * Export it from `agent/tools/web_fetch.ts`. Only Gateway models get the tool. With `"tako"`, a
 * Tako card URL returns the card's data as CSV and any other URL returns the page's text. eve
 * saves a result over 20,000 bytes to a file in the session's sandbox and gives the model its
 * path, a description of its shape, and its first lines.
 *
 * @example
 * ```ts
 * // agent/tools/web_fetch.ts
 * import { gatewayWebFetch } from "eve/tools/web_fetch";
 *
 * export default gatewayWebFetch({ provider: "tako" });
 * ```
 */
export function gatewayWebFetch(input: GatewayWebFetchInput): GatewayWebFetchDefinition {
  return frameworkTool({ kind: GATEWAY_WEB_FETCH_KIND, provider: input.provider });
}

export const GATEWAY_WEB_FETCH_TOOL_DESCRIPTION =
  "Fetch a URL. A Tako card URL returns the card's data; any other URL returns the page's text.";

export function isGatewayWebFetchDefinition(value: unknown): value is GatewayWebFetchDefinition {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { kind?: unknown }).kind === GATEWAY_WEB_FETCH_KIND
  );
}
