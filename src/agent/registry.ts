/**
 * Ward Sahayakan (വാർഡ് സഹായി) - Tool Registry
 * Manages registered tools and verifies parameters.
 */

import { AgentToolDeclaration } from '../types/agent';
import { AGENT_TOOL_DEFINITIONS } from '../tools/definitions';

export class ToolRegistry {
  private tools: Map<string, AgentToolDeclaration> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    for (const tool of AGENT_TOOL_DEFINITIONS) {
      this.registerTool(tool);
    }
  }

  public registerTool(tool: AgentToolDeclaration): void {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): AgentToolDeclaration | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): AgentToolDeclaration[] {
    return Array.from(this.tools.values());
  }

  public getToolsForCategory(category: AgentToolDeclaration['category']): AgentToolDeclaration[] {
    return this.getAllTools().filter(t => t.category === category);
  }

  /**
   * Validates required arguments against the tool schema.
   */
  public validateArgs(toolName: string, args: Record<string, unknown>): { valid: boolean; missing?: string[] } {
    const tool = this.getTool(toolName);
    if (!tool) {
      return { valid: false, missing: [`Tool "${toolName}" not found in registry.`] };
    }

    const missing: string[] = [];
    for (const [paramName, paramConfig] of Object.entries(tool.parameters)) {
      if (paramConfig.required && (args[paramName] === undefined || args[paramName] === null || args[paramName] === '')) {
        missing.push(paramName);
      }
    }

    return {
      valid: missing.length === 0,
      missing: missing.length > 0 ? missing : undefined
    };
  }
}

export const defaultToolRegistry = new ToolRegistry();
