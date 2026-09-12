// ============================================
// ShopAgent — In-Memory State Store
// ============================================
// Global singleton holding inventory, campaigns,
// and agent execution logs. Persists for the
// lifetime of the Node.js server process.
// ============================================

/* ---------- Type Definitions ---------- */

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  price: number;
}

export interface Campaign {
  id: string;
  title: string;
  itemName: string;
  discount: number;
  targetAudience: string;
  message: string;
  promoCode: string;
  status: string;
  channel?: string;
  broadcastedAt?: string;
  recipientCount?: number;
  createdAt: string;
}

export interface LogEntry {
  timestamp: string;
  type: "THOUGHT" | "TOOL_CALL" | "TOOL_RESULT" | "STATUS";
  content: string;
  toolName?: string;
  payload?: Record<string, unknown>;
}

export interface AppState {
  inventory: InventoryItem[];
  campaigns: Campaign[];
  logs: LogEntry[];
}

export interface ToolCallRecord {
  tool: string;
  args: Record<string, unknown>;
}

export interface ToolResultRecord {
  tool: string;
  result: Record<string, unknown>;
}

export interface AgentResponse {
  thought: string;
  toolCalls: ToolCallRecord[];
  toolResults: ToolResultRecord[];
  agentResponse: string;
  state: AppState;
}

/* ---------- Default Seed Data ---------- */

const defaultInventory: InventoryItem[] = [
  { id: "inv_1", name: "Palakkadan Matta Rice", category: "Grains", stock: 45, unit: "kg", price: 52 },
  { id: "inv_2", name: "Fresh Nendran Banana", category: "Produce", stock: 25, unit: "kg", price: 65 },
  { id: "inv_3", name: "Pure Coconut Oil", category: "Essentials", stock: 18, unit: "L", price: 195 },
  { id: "inv_4", name: "Nadan Kozhi Mutta", category: "Poultry", stock: 80, unit: "pcs", price: 7 },
  { id: "inv_5", name: "Local Naadan Thakkali", category: "Produce", stock: 12, unit: "kg", price: 38 },
];

/* ---------- Global State ---------- */

let state: AppState = {
  inventory: defaultInventory.map((i) => ({ ...i })),
  campaigns: [],
  logs: [],
};

let nextId = 100;

/** Generate a short unique ID with a prefix */
export function genId(prefix: string = "id"): string {
  nextId += 1;
  return `${prefix}_${nextId}`;
}

/** Return a deep-clone snapshot of the current state */
export function getState(): AppState {
  return {
    inventory: state.inventory.map((i) => ({ ...i })),
    campaigns: state.campaigns.map((c) => ({ ...c })),
    logs: state.logs.map((l) => ({ ...l })),
  };
}

/* ---------- Inventory Mutations ---------- */

export function findItem(name: string): InventoryItem | undefined {
  const lower = name.toLowerCase();
  return state.inventory.find(
    (item) => item.name.toLowerCase() === lower || item.name.toLowerCase().includes(lower)
  );
}

export function upsertInventoryItem(patch: {
  name: string;
  category?: string;
  stock: number;
  unit?: string;
  price?: number;
  mode: "set" | "add" | "subtract";
}): InventoryItem {
  let item = findItem(patch.name);

  if (item) {
    // Update existing item
    if (patch.category) item.category = patch.category;
    if (patch.unit) item.unit = patch.unit;
    if (patch.price !== undefined && patch.price > 0) item.price = patch.price;

    switch (patch.mode) {
      case "set":
        item.stock = patch.stock;
        break;
      case "add":
        item.stock += patch.stock;
        break;
      case "subtract":
        item.stock = Math.max(0, item.stock - patch.stock);
        break;
    }
  } else {
    // Create new item
    item = {
      id: genId("inv"),
      name: patch.name,
      category: patch.category || "General",
      stock: patch.stock,
      unit: patch.unit || "unit",
      price: patch.price || 0,
    };
    state.inventory.push(item);
  }

  return { ...item };
}

/* ---------- Campaign Mutations ---------- */

export function addCampaign(data: {
  title: string;
  itemName: string;
  discount: number;
  targetAudience: string;
  message: string;
  promoCode: string;
  status: string;
  channel?: string;
  broadcastedAt?: string;
  recipientCount?: number;
}): Campaign {
  const campaign: Campaign = {
    id: genId("cmp"),
    createdAt: new Date().toISOString(),
    ...data,
  };
  state.campaigns.push(campaign);
  return { ...campaign };
}

/* ---------- Log Mutations ---------- */

export function addLog(entry: Omit<LogEntry, "timestamp">): void {
  state.logs.push({
    ...entry,
    timestamp: new Date().toISOString(),
  });
}

/* ---------- Remove Item ---------- */

export function removeItem(name: string): InventoryItem | null {
  const lower = name.toLowerCase();
  const idx = state.inventory.findIndex(
    (item) => item.name.toLowerCase() === lower || item.name.toLowerCase().includes(lower)
  );
  if (idx === -1) return null;
  const [removed] = state.inventory.splice(idx, 1);
  return { ...removed };
}

/* ---------- Reset (for testing) ---------- */

export function resetState(): void {
  state = {
    inventory: defaultInventory.map((i) => ({ ...i })),
    campaigns: [],
    logs: [],
  };
}

