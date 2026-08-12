# Future MCP server (design only — NOT implemented in Phase 1)

This directory documents how a **future** local Model Context Protocol (MCP)
server would expose the prototype's capabilities to MCP clients (e.g. ChatGPT
or the MCP Inspector). **Do not implement MCP in Phase 1.**

## Guiding principle: one source of truth

The MCP server must reuse the **same** behaviour layer as the browser
prototype:

- **`src/tools`** — tool metadata (`ToolDefinition`) + the single execution
  path `runTool(service, name, input)`.
- **`src/peacock`** — the `PeacockService` contract and its implementation
  (`MockPeacockService`, or a real service later).

No business logic is re-implemented here. The MCP layer is a thin adapter that
advertises tools (from their metadata) and executes them (via `runTool`).

## Sketch

1. Iterate the ordered `TOOLS` registry from `src/tools/index.ts`.
2. Convert each `ToolDefinition.inputSchema` / `outputSchema` (Zod) to JSON
   Schema — e.g. with `zod-to-json-schema` (**FUTURE dependency; not added
   now**).
3. Register each tool with `@modelcontextprotocol/sdk` (**FUTURE dependency**),
   advertising `name`, `description`, and the JSON Schemas. Prototype metadata
   (`mutates`, `requiresConfirmation`, `requiresAuth`) informs how the server
   annotates or gates each tool.
4. On invocation, call `runTool(service, name, input)` with a `PeacockService`
   instance (the `MockPeacockService`, or a real implementation) so validation
   and behaviour are identical to the browser prototype.

## Explicitly out of scope for Phase 1

- No MCP server process, transport, or SDK wiring.
- No new dependencies (`zod-to-json-schema`, `@modelcontextprotocol/sdk` are
  documented as future-only).
- The shared contracts (`PeacockService`, `ToolDefinition`) are the integration
  boundary; keep metadata separate from execution so this adapter stays thin.
