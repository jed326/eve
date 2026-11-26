import { jsonSchema, type LanguageModel } from "ai";
import { convertArrayToReadableStream, MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";

import type { HarnessSession, StepResult } from "#harness/types.js";
import { createTestKernel } from "#internal/testing/kernel.js";

type StreamPart =
  Awaited<ReturnType<MockLanguageModelV4["doStream"]>>["stream"] extends ReadableStream<infer Part>
    ? Part
    : never;

const usage = {
  inputTokens: { cacheRead: undefined, cacheWrite: undefined, noCache: 1, total: 1 },
  outputTokens: { reasoning: undefined, text: 1, total: 1 },
};

const CARD_URL = "https://tako.com/card/abc";
const fetchId = "call_fetch";

const fetchStep: StreamPart[] = [
  {
    input: JSON.stringify({ quote_only: true, url: CARD_URL }),
    providerExecuted: true,
    toolCallId: fetchId,
    toolName: "web_fetch",
    type: "tool-call",
  },
  {
    result: {
      contents: [{ cost: 0.02, delivery: "quote", source_url: CARD_URL }],
      request_id: "contents-1",
    },
    toolCallId: fetchId,
    toolName: "web_fetch",
    type: "tool-result",
  },
  { finishReason: { raw: undefined, unified: "stop" }, type: "finish", usage },
];

const reply: StreamPart[] = [
  { id: "text", type: "text-start" },
  { delta: "It costs $0.02.", id: "text", type: "text-delta" },
  { id: "text", type: "text-end" },
  { finishReason: { raw: undefined, unified: "stop" }, type: "finish", usage },
];

describe("a Tako web_fetch result that AI Gateway runs", () => {
  it("reaches the next model call as eve's text, not Tako's raw result", async () => {
    const responses = [fetchStep, reply];
    const model = new MockLanguageModelV4({
      modelId: "openai/gpt-5.4",
      provider: "gateway",
      doStream: async () => ({ stream: convertArrayToReadableStream(responses.shift() ?? []) }),
    });
    const runStep = createTestKernel({
      agent: { model: { id: "openai/gpt-5.4" } },
      resolveModel: async (): Promise<LanguageModel> => model,
      tools: new Map([
        [
          "web_fetch",
          {
            behavior: { availability: [], handling: { kind: "provider-tool", provider: "tako" } },
            description: "Fetch.",
            inputSchema: jsonSchema({ type: "object" }),
            name: "web_fetch",
          },
        ],
      ]),
    });
    const session: HarnessSession = {
      compaction: {},
      continuationToken: "http:tako-web-fetch",
      history: [],
      sessionId: "tako-web-fetch",
    };

    let result: StepResult = await runStep(session, { message: "What does Alice's card cost?" });
    for (let steps = 0; typeof result.next === "function" && steps < 5; steps += 1) {
      result = await result.next(result.session);
    }

    const prompts = model.doStreamCalls.map(({ prompt }) => prompt);
    expect(model.doStreamCalls[0]!.tools).toEqual([
      expect.objectContaining({ id: "gateway.tako_contents", type: "provider" }),
    ]);
    expect(prompts).toHaveLength(2);
    const fetchResult = prompts[1]!
      .flatMap((message): { type: string; toolCallId?: string }[] =>
        Array.isArray(message.content) ? message.content : [],
      )
      .find((part) => part.type === "tool-result" && part.toolCallId === fetchId);
    expect(fetchResult).toMatchObject({
      output: {
        type: "text",
        value: `Quote for ${CARD_URL}: $0.02 to fetch. Nothing was fetched or charged.`,
      },
    });
  });
});
