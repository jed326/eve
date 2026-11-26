import { requestPublicUrl } from "#execution/web-fetch/request.js";
import { toolModelOutputContext } from "#harness/tool-model-output.js";
import { toErrorMessage } from "#shared/errors.js";
import { isObject } from "#shared/guards.js";
import {
  toolOutput,
  type ToolModelOutput,
  type ToolModelOutputContext,
} from "#tools/model-output.js";
import { offloadContent } from "#tools/offload-content.js";

const DOWNLOAD_MAX_BYTES = 10 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 30_000;

const offloadItemText = offloadContent<string>({
  fallback: "summary",
  toModelOutput: (text) => toolOutput.text(text),
});

type ItemBody =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "failed"; readonly reason: string };

export async function takoContentsModelOutput(input: {
  readonly output: unknown;
  readonly toolCallId: string;
  readonly toolName: string;
}): Promise<ToolModelOutput> {
  if (!isObject(input.output) || !Array.isArray(input.output.contents)) {
    return toolOutput.json(input.output);
  }
  const items = input.output.contents.filter(isObject);
  const sections: string[] = [];
  for (const [index, item] of items.entries()) {
    const callId = items.length === 1 ? input.toolCallId : `${input.toolCallId}-${index + 1}`;
    sections.push(await describeItem(item, toolModelOutputContext(input.toolName, callId)));
  }
  return toolOutput.text(
    sections.length > 0 ? sections.join("\n\n") : "Tako returned no content for this URL.",
  );
}

async function describeItem(
  item: Record<string, unknown>,
  ctx: ToolModelOutputContext,
): Promise<string> {
  const lines = [itemSummary(item)];
  if (typeof item.description === "string") lines.push(item.description);
  const columns = columnSummary(item.manifest);
  if (columns !== undefined) lines.push(columns);
  const body = await readItemBody(item);
  if (body?.kind === "failed") {
    lines.push(
      `eve could not download the content (${body.reason}). Call web_fetch again for a new link.`,
    );
  } else if (body !== undefined) {
    const output = await offloadItemText(body.text, ctx);
    lines.push(output.type === "text" ? output.value : JSON.stringify(output.value));
  }
  return lines.join("\n");
}

function itemSummary(item: Record<string, unknown>): string {
  const source = typeof item.source_url === "string" ? item.source_url : "the URL";
  const cost = typeof item.cost === "number" ? item.cost : undefined;
  if (item.delivery === "quote") {
    return `Quote for ${source}: $${cost ?? 0} to fetch. Nothing was fetched or charged.`;
  }
  const facts: string[] = [];
  if (typeof item.total_rows === "number") {
    facts.push(
      `${item.total_rows.toLocaleString("en-US")} rows${item.truncated === true ? ", truncated" : ""}`,
    );
  }
  if (typeof item.content_format === "string") facts.push(item.content_format);
  if (cost !== undefined) facts.push(`cost $${cost}`);
  return `Fetched ${source}${facts.length > 0 ? ` (${facts.join(", ")})` : ""}.`;
}

function columnSummary(manifest: unknown): string | undefined {
  if (!Array.isArray(manifest)) return undefined;
  const columns = manifest.filter(isObject).flatMap((column) => {
    if (typeof column.name !== "string") return [];
    const details = [column.dtype, column.unit].filter(
      (detail): detail is string => typeof detail === "string" && detail.length > 0,
    );
    const label = details.length > 0 ? `${column.name} (${details.join(", ")})` : column.name;
    return [typeof column.entity === "string" ? `${label}: ${column.entity}` : label];
  });
  return columns.length > 0 ? `Columns: ${columns.join("; ")}.` : undefined;
}

async function readItemBody(item: Record<string, unknown>): Promise<ItemBody | undefined> {
  if (item.delivery === "url" && typeof item.url === "string") {
    return await download(item.url);
  }
  return typeof item.data === "string" ? { kind: "text", text: item.data } : undefined;
}

async function download(url: string): Promise<ItemBody> {
  try {
    const response = await requestPublicUrl(url, {
      headers: {},
      maxResponseSize: DOWNLOAD_MAX_BYTES,
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (!response.ok) return { kind: "failed", reason: `HTTP ${response.status}` };
    return { kind: "text", text: await response.text() };
  } catch (error) {
    return { kind: "failed", reason: toErrorMessage(error) };
  }
}
