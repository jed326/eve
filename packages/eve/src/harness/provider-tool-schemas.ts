import type { JsonObject } from "#shared/json.js";

export const WEB_SEARCH_TOOL_NAME = "web_search";

/**
 * Output schema for OpenAI's provider-managed `webSearch` tool.
 */
export const WEB_SEARCH_OPENAI_OUTPUT_SCHEMA: JsonObject = {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {
    action: {
      oneOf: [
        {
          additionalProperties: false,
          properties: {
            queries: {
              items: { type: "string" },
              type: "array",
            },
            query: { type: "string" },
            type: {
              const: "search",
              type: "string",
            },
          },
          required: ["type"],
          type: "object",
        },
        {
          additionalProperties: false,
          properties: {
            type: {
              const: "openPage",
              type: "string",
            },
            url: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
          },
          required: ["type"],
          type: "object",
        },
        {
          additionalProperties: false,
          properties: {
            pattern: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
            type: {
              const: "findInPage",
              type: "string",
            },
            url: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
          },
          required: ["type"],
          type: "object",
        },
      ],
    },
    sources: {
      items: {
        oneOf: [
          {
            additionalProperties: false,
            properties: {
              type: {
                const: "url",
                type: "string",
              },
              url: { type: "string" },
            },
            required: ["type", "url"],
            type: "object",
          },
          {
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              type: {
                const: "api",
                type: "string",
              },
            },
            required: ["type", "name"],
            type: "object",
          },
        ],
      },
      type: "array",
    },
  },
  type: "object",
};

/**
 * Output schema for Anthropic's stable provider-managed `webSearch_20250305` tool.
 */
export const WEB_SEARCH_ANTHROPIC_OUTPUT_SCHEMA: JsonObject = {
  $schema: "http://json-schema.org/draft-07/schema#",
  items: {
    additionalProperties: false,
    properties: {
      encryptedContent: { type: "string" },
      pageAge: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      title: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      type: {
        const: "web_search_result",
        type: "string",
      },
      url: { type: "string" },
    },
    required: ["url", "title", "pageAge", "encryptedContent", "type"],
    type: "object",
  },
  type: "array",
};

/**
 * Output schema for Google's provider-managed `googleSearch` grounding tool.
 */
export const WEB_SEARCH_GOOGLE_OUTPUT_SCHEMA: JsonObject = {
  $schema: "http://json-schema.org/draft-07/schema#",
  additionalProperties: false,
  properties: {},
  type: "object",
};

/**
 * Output schema for AI Gateway's provider-managed `exaSearch` tool.
 */
export const WEB_SEARCH_EXA_OUTPUT_SCHEMA: JsonObject = {
  $schema: "http://json-schema.org/draft-07/schema#",
  anyOf: [
    {
      properties: {
        costDollars: {
          additionalProperties: false,
          properties: {
            search: {
              additionalProperties: { type: "number" },
              type: "object",
            },
            total: { type: "number" },
          },
          type: "object",
        },
        requestId: { type: "string" },
        resolvedSearchType: { type: "string" },
        results: {
          items: {
            properties: {
              author: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
              entities: {
                items: {
                  properties: {
                    id: { type: "string" },
                    properties: { type: "object" },
                    type: { type: "string" },
                    version: { type: "number" },
                  },
                  required: ["id", "type", "version", "properties"],
                  type: "object",
                },
                type: "array",
              },
              extras: {
                additionalProperties: false,
                properties: {
                  imageLinks: {
                    items: { type: "string" },
                    type: "array",
                  },
                  links: {
                    items: { type: "string" },
                    type: "array",
                  },
                },
                type: "object",
              },
              favicon: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
              highlightScores: {
                items: { type: "number" },
                type: "array",
              },
              highlights: {
                items: { type: "string" },
                type: "array",
              },
              id: { type: "string" },
              image: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
              publishedDate: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
              score: {
                anyOf: [{ type: "number" }, { type: "null" }],
              },
              subpages: {
                items: {},
                type: "array",
              },
              summary: { type: "string" },
              text: { type: "string" },
              title: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
              url: { type: "string" },
            },
            required: ["url", "id"],
            type: "object",
          },
          type: "array",
        },
        searchTime: { type: "number" },
        searchType: { type: "string" },
      },
      required: ["requestId", "results"],
      type: "object",
    },
    {
      additionalProperties: false,
      properties: {
        error: {
          enum: [
            "api_error",
            "rate_limit",
            "timeout",
            "invalid_input",
            "configuration_error",
            "execution_error",
            "unknown",
          ],
          type: "string",
        },
        message: { type: "string" },
        statusCode: { type: "number" },
      },
      required: ["error", "message"],
      type: "object",
    },
  ],
};

/**
 * Output schema for AI Gateway's provider-managed `parallelSearch` tool.
 */
export const WEB_SEARCH_PARALLEL_OUTPUT_SCHEMA: JsonObject = {
  $schema: "http://json-schema.org/draft-07/schema#",
  anyOf: [
    {
      additionalProperties: false,
      properties: {
        results: {
          items: {
            additionalProperties: false,
            properties: {
              excerpt: { type: "string" },
              publishDate: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
              relevanceScore: { type: "number" },
              title: { type: "string" },
              url: { type: "string" },
            },
            required: ["url", "title", "excerpt"],
            type: "object",
          },
          type: "array",
        },
        searchId: { type: "string" },
      },
      required: ["searchId", "results"],
      type: "object",
    },
    {
      additionalProperties: false,
      properties: {
        error: {
          enum: [
            "api_error",
            "rate_limit",
            "timeout",
            "invalid_input",
            "configuration_error",
            "unknown",
          ],
          type: "string",
        },
        message: { type: "string" },
        statusCode: { type: "number" },
      },
      required: ["error", "message"],
      type: "object",
    },
  ],
};

const TAKO_NULLABLE_STRING: JsonObject = { anyOf: [{ type: "string" }, { type: "null" }] };

const TAKO_DATASET_CELL: JsonObject = {
  anyOf: [{ type: "boolean" }, { type: "number" }, { type: "string" }, { type: "null" }],
};

/**
 * Mirrors the `TakoResultContent` shape from `@ai-sdk/gateway`. Both data
 * cards and web results carry it; the dataset fields populate only when
 * content inlining is enabled.
 */
const TAKO_RESULT_CONTENT: JsonObject = {
  anyOf: [
    {
      properties: {
        card_data: { anyOf: [{ type: "object" }, { type: "null" }] },
        card_data_schema: { anyOf: [{ type: "object" }, { type: "null" }] },
        content_format: {
          anyOf: [
            { enum: ["card_json", "csv", "json_compact", "json_records"], type: "string" },
            { type: "null" },
          ],
        },
        cost: { type: "number" },
        data: TAKO_NULLABLE_STRING,
        dataset: {
          anyOf: [
            {
              properties: {
                columns: {
                  items: {
                    properties: {
                      name: { type: "string" },
                      type: {
                        enum: ["boolean", "date", "datetime", "number", "string"],
                        type: "string",
                      },
                      unit: TAKO_NULLABLE_STRING,
                    },
                    required: ["name", "type"],
                    type: "object",
                  },
                  type: "array",
                },
                provenance: { enum: ["query", "web_extraction"], type: "string" },
                ref: { type: "string" },
                rows: {
                  items: { items: TAKO_DATASET_CELL, type: "array" },
                  type: "array",
                },
                sources: {
                  items: {
                    properties: {
                      index: { enum: ["data", "web"], type: "string" },
                      name: { type: "string" },
                    },
                    required: ["name"],
                    type: "object",
                  },
                  type: "array",
                },
                total_rows: { type: "number" },
                truncated: { type: "boolean" },
              },
              required: ["columns", "rows", "total_rows", "truncated", "ref", "sources"],
              type: "object",
            },
            { type: "null" },
          ],
        },
        expires_at: TAKO_NULLABLE_STRING,
        export_pricing: {
          anyOf: [
            {
              properties: {
                baseline_usd: { type: "number" },
                free_rows: { type: "number" },
                max_rows_ceiling: { type: "number" },
                row_cpm_usd: { type: "number" },
              },
              required: ["baseline_usd", "free_rows", "max_rows_ceiling", "row_cpm_usd"],
              type: "object",
            },
            { type: "null" },
          ],
        },
        manifest: {
          anyOf: [
            {
              items: {
                properties: {
                  dtype: {
                    anyOf: [
                      { enum: ["boolean", "date", "datetime", "number", "string"], type: "string" },
                      { type: "null" },
                    ],
                  },
                  entity: TAKO_NULLABLE_STRING,
                  metric: TAKO_NULLABLE_STRING,
                  name: TAKO_NULLABLE_STRING,
                  unit: TAKO_NULLABLE_STRING,
                },
                type: "object",
              },
              type: "array",
            },
            { type: "null" },
          ],
        },
        records: {
          anyOf: [
            {
              items: { additionalProperties: TAKO_DATASET_CELL, type: "object" },
              type: "array",
            },
            { type: "null" },
          ],
        },
        total_rows: { anyOf: [{ type: "number" }, { type: "null" }] },
        truncated: { type: "boolean" },
        url: TAKO_NULLABLE_STRING,
      },
      type: "object",
    },
    { type: "null" },
  ],
};

/**
 * Output schema for AI Gateway's provider-managed `takoSearch` tool.
 *
 * Mirrors `TakoSearchOutput` from `@ai-sdk/gateway`: a response carrying
 * knowledge-graph data cards alongside web results, or the shared gateway
 * search error shape.
 */
export const WEB_SEARCH_TAKO_OUTPUT_SCHEMA: JsonObject = {
  $schema: "http://json-schema.org/draft-07/schema#",
  anyOf: [
    {
      properties: {
        cards: {
          items: {
            properties: {
              card_id: TAKO_NULLABLE_STRING,
              card_type: TAKO_NULLABLE_STRING,
              content: TAKO_RESULT_CONTENT,
              data_freshness: {
                anyOf: [
                  {
                    properties: {
                      coverage_end: TAKO_NULLABLE_STRING,
                      data_as_of: TAKO_NULLABLE_STRING,
                      last_updated: TAKO_NULLABLE_STRING,
                    },
                    type: "object",
                  },
                  { type: "null" },
                ],
              },
              description: TAKO_NULLABLE_STRING,
              embed_url: TAKO_NULLABLE_STRING,
              exportable: { type: "boolean" },
              image_url: TAKO_NULLABLE_STRING,
              methodologies: {
                anyOf: [
                  {
                    items: {
                      properties: {
                        methodology_description: TAKO_NULLABLE_STRING,
                        methodology_name: TAKO_NULLABLE_STRING,
                      },
                      type: "object",
                    },
                    type: "array",
                  },
                  { type: "null" },
                ],
              },
              metric_definitions: {
                anyOf: [
                  {
                    items: {
                      properties: {
                        definition: { type: "string" },
                        name: { type: "string" },
                      },
                      required: ["name", "definition"],
                      type: "object",
                    },
                    type: "array",
                  },
                  { type: "null" },
                ],
              },
              nodes: {
                anyOf: [
                  {
                    items: {
                      properties: {
                        description: TAKO_NULLABLE_STRING,
                        id: { type: "string" },
                        name: { type: "string" },
                        type: { enum: ["entity", "metric"], type: "string" },
                      },
                      required: ["id", "type", "name"],
                      type: "object",
                    },
                    type: "array",
                  },
                  { type: "null" },
                ],
              },
              relevance: {
                anyOf: [{ enum: ["High", "Low", "Medium"], type: "string" }, { type: "null" }],
              },
              semantic_description: TAKO_NULLABLE_STRING,
              source_indexes: {
                anyOf: [
                  { items: { enum: ["data", "web"], type: "string" }, type: "array" },
                  { type: "null" },
                ],
              },
              sources: {
                anyOf: [
                  {
                    items: {
                      properties: {
                        source_description: TAKO_NULLABLE_STRING,
                        source_index: { enum: ["data", "web"], type: "string" },
                        source_name: TAKO_NULLABLE_STRING,
                        source_text: TAKO_NULLABLE_STRING,
                        url: TAKO_NULLABLE_STRING,
                      },
                      required: ["source_index"],
                      type: "object",
                    },
                    type: "array",
                  },
                  { type: "null" },
                ],
              },
              title: TAKO_NULLABLE_STRING,
              webpage_url: TAKO_NULLABLE_STRING,
            },
            type: "object",
          },
          type: "array",
        },
        related: {
          anyOf: [{ items: { type: "object" }, type: "array" }, { type: "null" }],
        },
        request_id: { type: "string" },
        usage: {
          anyOf: [
            {
              properties: {
                compute: {
                  anyOf: [
                    {
                      properties: { cost_usd: { type: "number" } },
                      required: ["cost_usd"],
                      type: "object",
                    },
                    { type: "null" },
                  ],
                },
                data: {
                  anyOf: [
                    {
                      properties: {
                        cost_usd: { type: "number" },
                        datasets: { type: "number" },
                      },
                      required: ["cost_usd", "datasets"],
                      type: "object",
                    },
                    { type: "null" },
                  ],
                },
                total_cost_usd: { type: "number" },
              },
              required: ["total_cost_usd"],
              type: "object",
            },
            { type: "null" },
          ],
        },
        web_results: {
          items: {
            properties: {
              content: TAKO_RESULT_CONTENT,
              publish_date: TAKO_NULLABLE_STRING,
              snippet: TAKO_NULLABLE_STRING,
              source_name: TAKO_NULLABLE_STRING,
              title: { type: "string" },
              url: { type: "string" },
            },
            required: ["title", "url"],
            type: "object",
          },
          type: "array",
        },
      },
      required: ["request_id"],
      type: "object",
    },
    {
      additionalProperties: false,
      properties: {
        error: {
          enum: [
            "api_error",
            "configuration_error",
            "execution_error",
            "invalid_input",
            "rate_limit",
            "timeout",
            "unknown_tool",
          ],
          type: "string",
        },
        message: { type: "string" },
        statusCode: { type: "number" },
      },
      required: ["error", "message"],
      type: "object",
    },
  ],
};
