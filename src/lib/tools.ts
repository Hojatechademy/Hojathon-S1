// ============================================
// ShopAgent — Executable Tool Functions
// ============================================
// Each tool mutates the global store and returns
// a structured result with success flag, data,
// and a human-readable summary.
// ============================================

import { upsertInventoryItem, removeItem, addCampaign, addLog, getState } from "./store";

export interface ToolResult {
  success: boolean;
  data: Record<string, unknown>;
  summary: string;
}

/* ---------- Tool 1: update_inventory ---------- */

export function update_inventory(args: {
  item_name: string;
  category: string;
  price: number;
  stock_delta_or_total: number;
  unit: string;
  mode: "set" | "add" | "subtract";
}): ToolResult {
  const item = upsertInventoryItem({
    name: args.item_name,
    category: args.category,
    stock: args.stock_delta_or_total,
    unit: args.unit,
    price: args.price,
    mode: args.mode,
  });

  const modeVerb =
    args.mode === "add" ? "Added" : args.mode === "subtract" ? "Removed" : "Set";
  const summary = `${modeVerb} ${args.stock_delta_or_total} ${args.unit} of ${item.name}. Current stock: ${item.stock} ${item.unit} @ ₹${item.price}/${item.unit}. Status: ${item.stock <= 5 ? "Low Stock ⚠️" : "In Stock ✓"}`;

  return {
    success: true,
    data: {
      item,
      inventoryCount: getState().inventory.length,
    },
    summary,
  };
}

/* ---------- Tool 2: create_promo_campaign ---------- */

export function create_promo_campaign(args: {
  item_name: string;
  discount_percentage: number;
  target_audience: string;
  promo_message: string;
}): ToolResult {
  const promoCode = `SHOP${args.discount_percentage}${args.item_name.replace(/\s+/g, "").slice(0, 4).toUpperCase()}`;

  const campaign = addCampaign({
    title: `${args.discount_percentage}% Off ${args.item_name}`,
    itemName: args.item_name,
    discount: args.discount_percentage,
    targetAudience: args.target_audience,
    message: args.promo_message,
    promoCode,
    status: "Active",
  });

  const summary = `Campaign created: "${campaign.title}" for ${args.target_audience}. Promo code: ${promoCode}. Ready for broadcast.`;

  return {
    success: true,
    data: { campaign },
    summary,
  };
}

/* ---------- Tool 3: broadcast_notification ---------- */

export function broadcast_notification(args: {
  channel: "whatsapp" | "sms";
  recipient_group: string;
  message: string;
}): ToolResult {
  const recipientCount = Math.floor(Math.random() * 80) + 40; // Simulate 40-120 recipients
  const dispatchedAt = new Date().toISOString();
  const channelLabel = args.channel === "whatsapp" ? "WhatsApp" : "SMS";

  // Create a campaign entry so it appears in the dashboard
  const campaign = addCampaign({
    title: `${channelLabel} Broadcast`,
    itemName: "General",
    discount: 0,
    targetAudience: args.recipient_group,
    message: args.message,
    promoCode: "",
    status: "Broadcasted",
    channel: args.channel,
    broadcastedAt: dispatchedAt,
    recipientCount,
  });

  const summary = `${channelLabel} broadcast dispatched to ${recipientCount} ${args.recipient_group}. Message delivered at ${new Date(dispatchedAt).toLocaleTimeString()}.`;

  return {
    success: true,
    data: {
      campaign,
      channel: channelLabel,
      recipientGroup: args.recipient_group,
      recipientCount,
      dispatchedAt,
      messagePreview: args.message.slice(0, 100) + (args.message.length > 100 ? "..." : ""),
      deliveryStatus: "Dispatched ✓",
    },
    summary,
  };
}
/* ---------- Tool 4: remove_item ---------- */

export function remove_item(args: {
  item_name: string;
}): ToolResult {
  const removed = removeItem(args.item_name);

  if (!removed) {
    return {
      success: false,
      data: { item_name: args.item_name },
      summary: `Item "${args.item_name}" not found in inventory. No changes made.`,
    };
  }

  const summary = `Permanently removed "${removed.name}" from inventory. It had ${removed.stock} ${removed.unit} @ ₹${removed.price}/${removed.unit}.`;

  return {
    success: true,
    data: {
      removedItem: removed,
      inventoryCount: getState().inventory.length,
    },
    summary,
  };
}

/* ---------- Tool Executor ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function executeTool(toolName: string, args: Record<string, any>): ToolResult {
  addLog({ type: "TOOL_CALL", content: `${toolName}(${JSON.stringify(args)})`, toolName, payload: args });

  let result: ToolResult;

  switch (toolName) {
    case "update_inventory":
      result = update_inventory(args as Parameters<typeof update_inventory>[0]);
      break;
    case "create_promo_campaign":
      result = create_promo_campaign(args as Parameters<typeof create_promo_campaign>[0]);
      break;
    case "broadcast_notification":
      result = broadcast_notification(args as Parameters<typeof broadcast_notification>[0]);
      break;
    case "remove_item":
      result = remove_item(args as Parameters<typeof remove_item>[0]);
      break;
    default:
      result = { success: false, data: {}, summary: `Unknown tool: ${toolName}` };
  }

  addLog({
    type: "TOOL_RESULT",
    content: result.summary,
    toolName,
    payload: result.data,
  });

  addLog({
    type: "STATUS",
    content: result.success ? "200 OK — Tool executed successfully" : "400 ERROR — Tool execution failed",
    toolName,
  });

  return result;
}

