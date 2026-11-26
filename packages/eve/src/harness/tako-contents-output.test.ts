import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContextContainer, contextStorage } from "#context/container.js";
import { SandboxKey } from "#context/keys.js";
import { mockSandbox } from "#internal/testing/mocks/mock-sandbox.js";
import type { SandboxAccess } from "#sandbox/state.js";

const { requestPublicUrl } = vi.hoisted(() => ({ requestPublicUrl: vi.fn() }));
vi.mock("#execution/web-fetch/request.js", () => ({ requestPublicUrl }));

const { takoContentsModelOutput } = await import("#harness/tako-contents-output.js");

const CARD_URL = "https://tako.com/card/abc";
const DOWNLOAD_URL = "https://downloads.tako.com/export.csv?signature=1";

function inContext<T>(access: SandboxAccess | undefined, run: () => Promise<T>): Promise<T> {
  const context = new ContextContainer();
  if (access !== undefined) context.setVirtualContext(SandboxKey, access);
  return contextStorage.run(context, run);
}

function cardExport(overrides: Record<string, unknown> = {}) {
  return {
    request_id: "contents-1",
    contents: [
      {
        source_url: CARD_URL,
        delivery: "url",
        url: DOWNLOAD_URL,
        content_format: "csv",
        total_rows: 2_000,
        truncated: false,
        cost: 0.05,
        description: "US monthly unemployment rate since 1990.",
        manifest: [
          { name: "date", dtype: "date" },
          { name: "rate", dtype: "number", unit: "%", entity: "United States" },
        ],
        ...overrides,
      },
    ],
  };
}

function csvRows(count: number): string {
  const rows = Array.from({ length: count }, (_, index) => `1990-01-${index},${index / 10}`);
  return ["date,rate", ...rows].join("\n");
}

describe("takoContentsModelOutput", () => {
  beforeEach(() => {
    requestPublicUrl.mockReset();
  });

  it("saves a large export to the sandbox and gives the model its path and first lines", async () => {
    const csv = csvRows(2_000);
    requestPublicUrl.mockResolvedValue(new Response(csv));
    const { access, files } = mockSandbox();

    const result = await inContext(access, () =>
      takoContentsModelOutput({
        output: cardExport(),
        toolCallId: "call_1",
        toolName: "web_fetch",
      }),
    );

    const path = "/tmp/.eve/tool-results/web_fetch-call_1.txt";
    expect(files.get(path)).toBe(csv);
    expect(result.type).toBe("text");
    const lines = (result as { value: string }).value.split("\n");
    expect(lines.slice(0, 4)).toEqual([
      `Fetched ${CARD_URL} (2,000 rows, csv, cost $0.05).`,
      "US monthly unemployment rate since 1990.",
      "Columns: date (date); rate (number, %): United States.",
      `Output of web_fetch (${Buffer.byteLength(csv).toLocaleString("en-US")} bytes) was saved to ${path}.`,
    ]);
    expect(lines).toContain("date,rate");
    expect(lines).not.toContain("1990-01-1999,199.9");
    expect(requestPublicUrl).toHaveBeenCalledWith(DOWNLOAD_URL, expect.anything());
  });

  it("gives the model a small export inline without writing a file", async () => {
    requestPublicUrl.mockResolvedValue(new Response(csvRows(2)));
    const { access, files } = mockSandbox();

    const result = await inContext(access, () =>
      takoContentsModelOutput({
        output: cardExport({ total_rows: 2, description: null, manifest: null }),
        toolCallId: "call_2",
        toolName: "web_fetch",
      }),
    );

    expect(files.size).toBe(0);
    expect(result).toEqual({
      type: "text",
      value: [`Fetched ${CARD_URL} (2 rows, csv, cost $0.05).`, csvRows(2)].join("\n"),
    });
  });

  it("tells the model to fetch again when the download fails", async () => {
    requestPublicUrl.mockResolvedValue(new Response("expired", { status: 403 }));

    const result = await inContext(undefined, () =>
      takoContentsModelOutput({
        output: cardExport({ description: null, manifest: null }),
        toolCallId: "call_3",
        toolName: "web_fetch",
      }),
    );

    expect(result).toEqual({
      type: "text",
      value: [
        `Fetched ${CARD_URL} (2,000 rows, csv, cost $0.05).`,
        "eve could not download the content (HTTP 403). Call web_fetch again for a new link.",
      ].join("\n"),
    });
  });

  it("describes only the shape of a large export when there is no sandbox", async () => {
    requestPublicUrl.mockResolvedValue(new Response(csvRows(2_000)));

    const result = await inContext(undefined, () =>
      takoContentsModelOutput({
        output: cardExport({ description: null, manifest: null }),
        toolCallId: "call_4",
        toolName: "web_fetch",
      }),
    );

    const value = (result as { value: string }).value;
    expect(value).toContain("exceeded the inline limit and could not be saved to the sandbox");
    expect(value.length).toBeLessThan(6_000);
  });

  it("passes inline web text through without downloading", async () => {
    const result = await inContext(undefined, () =>
      takoContentsModelOutput({
        output: {
          request_id: "contents-5",
          contents: [
            {
              source_url: "https://example.com/article",
              delivery: "inline",
              content_format: "text",
              data: "Example article text.",
            },
          ],
        },
        toolCallId: "call_5",
        toolName: "web_fetch",
      }),
    );

    expect(requestPublicUrl).not.toHaveBeenCalled();
    expect(result).toEqual({
      type: "text",
      value: "Fetched https://example.com/article (text).\nExample article text.",
    });
  });
});
