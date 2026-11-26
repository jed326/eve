import { stripLogicalPathExtension } from "#discover/filesystem.js";
import { normalizeToolDefinition } from "#internal/authored-definition/schema-backed.js";
import type { ModuleSourceRef } from "#shared/source-ref.js";
import type { CompiledDefinition, CompiledToolDefinition } from "#compiler/manifest.js";
import {
  compiledDefinition,
  loadModuleBackedDefinition,
  type ModuleBackedDefinitionLoadOptions,
} from "#compiler/normalize-helpers.js";
import { eveNamespaceReservation } from "#protocol/runtime-tools.js";
import { GATEWAY_WEB_FETCH_TOOL_DESCRIPTION } from "#tools/provided/gateway-web-fetch.js";
import { WEB_SEARCH_TOOL_DESCRIPTION } from "#tools/provided/web-search.js";

const PROVIDER_TOOLS = {
  "web-fetch-tool": {
    description: GATEWAY_WEB_FETCH_TOOL_DESCRIPTION,
    factory: "gatewayWebFetch()",
    label: "Web fetch",
    name: "web_fetch",
  },
  "web-search-tool": {
    description: WEB_SEARCH_TOOL_DESCRIPTION,
    factory: "webSearch()",
    label: "Web search",
    name: "web_search",
  },
} as const;

export type CompiledToolEntry =
  | { readonly kind: "tool"; readonly definition: CompiledToolDefinition }
  | { readonly kind: "disabled"; readonly name: string }
  | {
      readonly definition: CompiledToolDefinition;
      readonly kind: "provider-tool";
      readonly label: string;
    }
  | { readonly kind: "dynamic"; readonly definition: CompiledDefinition };

export async function compileToolEntry(
  _agentRoot: string,
  source: ModuleSourceRef,
  options: ModuleBackedDefinitionLoadOptions,
): Promise<CompiledToolEntry> {
  const entry = normalizeToolDefinition(
    await loadModuleBackedDefinition({
      binding: options.binding,
      kind: "tool",
      loadNamespace: options.loadNamespace,
      source,
    }),
    `Expected the tool export "${source.exportName ?? "default"}" from "${source.logicalPath}" to match the public eve shape.`,
  );
  const toolName = stripLogicalPathExtension(source.logicalPath)
    .replace(/^tools\//, "")
    .replaceAll("/", "-");

  const reservation = eveNamespaceReservation(toolName);
  if (reservation !== undefined) {
    throw new Error(
      `Tool "${source.logicalPath}" uses the reserved name "${toolName}". Rename its path; ${reservation}.`,
    );
  }

  if (entry.kind === "disabled") {
    return { kind: "disabled", name: toolName };
  }

  if (entry.kind === "web-search-tool" || entry.kind === "web-fetch-tool") {
    const providerTool = PROVIDER_TOOLS[entry.kind];
    if (toolName !== providerTool.name) {
      throw new Error(
        `The ${providerTool.factory} definition must be exported from "tools/${providerTool.name}.ts", not "${source.logicalPath}".`,
      );
    }
    return {
      definition: {
        behavior: {
          availability: [],
          handling: { kind: "provider-tool", ...entry.selection },
        },
        description: providerTool.description,
        exportName: source.exportName,
        hasExecute: false,
        hasModelOutputProjection: false,
        inputSchema: null,
        logicalPath: source.logicalPath,
        name: toolName,
        sourceId: source.sourceId,
        sourceKind: "module",
        requiresApproval: false,
      },
      kind: "provider-tool",
      label: providerTool.label,
    };
  }

  if (entry.kind === "dynamic-tool") {
    return { definition: compiledDefinition("tool", source, toolName), kind: "dynamic" };
  }

  const { workflow } = entry.definition;
  const shape = {
    suspend: workflow === undefined ? ("none" as const) : ("workflow" as const),
  };
  return {
    kind: "tool",
    definition: {
      availableInSubagents: entry.definition.availableInSubagents,
      deferred: entry.definition.deferred,
      behavior:
        workflow === undefined
          ? entry.definition.behavior === undefined
            ? { availability: [], shape }
            : { ...entry.definition.behavior, shape }
          : { availability: [], handling: { kind: "workflow-tool", ...workflow }, shape },
      description: entry.definition.description,
      exportName: source.exportName,
      hasExecute: entry.definition.hasExecute,
      hasModelOutputProjection: entry.definition.hasModelOutputProjection,
      inputSchema: entry.definition.inputSchema ?? null,
      logicalPath: source.logicalPath,
      modelInputSchema: entry.definition.modelInputSchema,
      name: toolName,
      outputSchema: entry.definition.outputSchema,
      requiresApproval: entry.definition.hasApproval,
      sourceId: source.sourceId,
      sourceKind: "module",
      workflowProgram: entry.definition.workflowProgram,
    },
  };
}
