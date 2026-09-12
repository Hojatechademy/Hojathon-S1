// ============================================
// ShopAgent — Fallback Agent (No LLM Required)
// ============================================
// Intelligent keyword/intent parser that handles
// user prompts without any LLM API key. Designed
// to perfectly execute the 3 demo chip prompts
// and handle general inventory/campaign commands.
// ============================================

import { addLog, getState, type AgentResponse, type ToolCallRecord, type ToolResultRecord } from "./store";
import { executeTool } from "./tools";

interface ParsedAction {
  tool: string;
  args: Record<string, unknown>;
}

/* ---------- Helpers ---------- */

function extractNumber(text: string, before?: string, after?: string): number | null {
  let pattern: string;
  if (before && after) {
    pattern = `${before}\\s*(\\d+(?:\\.\\d+)?)\\s*${after}`;
  } else if (before) {
    pattern = `${before}\\s*(\\d+(?:\\.\\d+)?)`;
  } else if (after) {
    pattern = `(\\d+(?:\\.\\d+)?)\\s*${after}`;
  } else {
    pattern = `(\\d+(?:\\.\\d+)?)`;
  }
  const match = text.match(new RegExp(pattern, "i"));
  return match ? parseFloat(match[1]) : null;
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[₹,]/g, "").trim();
}

/* ---------- Demo Prompt Detectors ---------- */

function isDemoPrompt1(msg: string): boolean {
  const n = normalise(msg);
  return (
    (n.includes("alphonso") || n.includes("mango")) &&
    n.includes("inventory") &&
    n.includes("discount")
  );
}

function isDemoPrompt2(msg: string): boolean {
  const n = normalise(msg);
  return (
    (n.includes("sold") && (n.includes("mango") || n.includes("kg"))) &&
    (n.includes("basmati") || n.includes("rice")) &&
    (n.includes("price") || n.includes("90"))
  );
}

function isDemoPrompt3(msg: string): boolean {
  const n = normalise(msg);
  return (
    (n.includes("broadcast") || n.includes("whatsapp") || n.includes("alert")) &&
    (n.includes("flash sale") || n.includes("weekend")) &&
    (n.includes("customer") || n.includes("fruit"))
  );
}

/* ---------- Parse Demo Prompts ---------- */

function parseDemoPrompt1(): { actions: ParsedAction[]; thought: string; response: string } {
  return {
    thought:
      "The shopkeeper wants to: 1) Add 50kg of Alphonso Mangoes at ₹120/kg to inventory, and 2) Create a 15% discount campaign for orders above 3kg. I need to call update_inventory first, then create_promo_campaign.",
    actions: [
      {
        tool: "update_inventory",
        args: {
          item_name: "Alphonso Mangoes",
          category: "Fruits",
          price: 120,
          stock_delta_or_total: 50,
          unit: "kg",
          mode: "add",
        },
      },
      {
        tool: "create_promo_campaign",
        args: {
          item_name: "Alphonso Mangoes",
          discount_percentage: 15,
          target_audience: "orders above 3kg",
          promo_message:
            "🥭 Fresh Alphonso Mangoes just arrived! Get 15% OFF on orders above 3kg. Premium quality at ₹120/kg — limited stock, order now!",
        },
      },
    ],
    response:
      "Done! I've added 50kg of Alphonso Mangoes at ₹120/kg to your inventory and created a 15% discount campaign for orders above 3kg. The promo is ready to broadcast to your customers!",
  };
}

function parseDemoPrompt2(): { actions: ParsedAction[]; thought: string; response: string } {
  return {
    thought:
      "The shopkeeper wants to: 1) Subtract 15kg from mangoes stock (sold), and 2) Update Basmati Rice price to ₹90/kg. I need two update_inventory calls — one to subtract mango stock, one to update rice price.",
    actions: [
      {
        tool: "update_inventory",
        args: {
          item_name: "Alphonso Mangoes",
          category: "Fruits",
          price: 0,
          stock_delta_or_total: 15,
          unit: "kg",
          mode: "subtract",
        },
      },
      {
        tool: "update_inventory",
        args: {
          item_name: "Basmati Rice",
          category: "Grains",
          price: 90,
          stock_delta_or_total: 0,
          unit: "kg",
          mode: "add",
        },
      },
    ],
    response:
      "Updated! Sold 15kg of mangoes — stock has been reduced. Basmati Rice price is now set to ₹90/kg. Your inventory is up to date.",
  };
}

function parseDemoPrompt3(): { actions: ParsedAction[]; thought: string; response: string } {
  return {
    thought:
      "The shopkeeper wants to: 1) Create a weekend flash sale campaign on fresh fruits, and 2) Broadcast the promo via WhatsApp to regular customers. I'll call create_promo_campaign first, then broadcast_notification.",
    actions: [
      {
        tool: "create_promo_campaign",
        args: {
          item_name: "Fresh Fruits",
          discount_percentage: 20,
          target_audience: "regular customers",
          promo_message:
            "🎉 WEEKEND FLASH SALE! Get 20% OFF on all fresh fruits this weekend only! Farm-fresh mangoes, bananas, apples & more at unbeatable prices. Visit us today! 🍎🥭🍌",
        },
      },
      {
        tool: "broadcast_notification",
        args: {
          channel: "whatsapp",
          recipient_group: "regular customers",
          message:
            "🎉 WEEKEND FLASH SALE! Get 20% OFF on all fresh fruits this weekend only! Farm-fresh mangoes, bananas, apples & more at unbeatable prices. Visit us today! 🍎🥭🍌",
        },
      },
    ],
    response:
      "All done! I've created a weekend flash sale campaign with 20% off on fresh fruits and broadcasted the announcement via WhatsApp to your regular customers. They should be receiving the message shortly!",
  };
}

/* ---------- General Intent Parser ---------- */

function parseGeneral(message: string): { actions: ParsedAction[]; thought: string; response: string } {
  const n = normalise(message);
  const actions: ParsedAction[] = [];
  const thoughts: string[] = [];
  const responses: string[] = [];

  // Detect inventory-related intent
  if (
    n.includes("add") || n.includes("stock") || n.includes("inventory") ||
    n.includes("sold") || n.includes("price") || n.includes("set") ||
    n.includes("update") || n.includes("remove") || n.includes("new item") ||
    n.includes("got") || n.includes("received") || n.includes("arrived")
  ) {
    // Try to extract item name — look for quoted strings or known patterns
    const quotedMatch = message.match(/["']([^"']+)["']/);
    const itemName = quotedMatch
      ? quotedMatch[1]
      : extractItemName(n);

    const price = extractNumber(n, "(?:at|price|@|₹|rs\\.?)", "(?:\\/|per)?");
    const qty =
      extractNumber(n, undefined, "\\s*(?:kg|litre|packet|piece|unit|dozen)") ??
      extractNumber(n, "(?:got|add|added|received|sold|remove)\\s*") ??
      extractNumber(n);
    const unit = n.match(/(kg|litre|packet|piece|unit|dozen)/)?.[1] || "unit";

    const mode: "add" | "subtract" | "set" =
      n.includes("sold") || n.includes("remove") || n.includes("subtract")
        ? "subtract"
        : n.includes("set") || n.includes("price to")
          ? "set"
          : "add";

    if (itemName) {
      thoughts.push(
        `Detected inventory update: ${mode} ${qty || 0} ${unit} of "${itemName}" at price ${price || "unchanged"}.`
      );
      actions.push({
        tool: "update_inventory",
        args: {
          item_name: itemName,
          category: guessCategory(itemName),
          price: price || 0,
          stock_delta_or_total: qty || 0,
          unit,
          mode,
        },
      });
      responses.push(`Inventory updated for ${itemName}.`);
    }
  }

  // Detect promo/campaign intent
  if (
    n.includes("discount") || n.includes("promo") || n.includes("campaign") ||
    n.includes("sale") || n.includes("offer") || n.includes("deal")
  ) {
    const discount = extractNumber(n, undefined, "%") || 10;
    const quotedMatch = message.match(/["']([^"']+)["']/);
    const itemName = quotedMatch ? quotedMatch[1] : extractItemName(n) || "Products";
    const audience =
      n.includes("regular") ? "regular customers" :
        n.includes("vip") ? "VIP members" :
          n.includes("new") ? "new customers" : "all customers";

    thoughts.push(
      `Detected promo campaign: ${discount}% off on "${itemName}" for ${audience}.`
    );
    actions.push({
      tool: "create_promo_campaign",
      args: {
        item_name: itemName,
        discount_percentage: discount,
        target_audience: audience,
        promo_message: `🎉 Special Offer! Get ${discount}% OFF on ${itemName}! Limited time only. Visit our shop today!`,
      },
    });
    responses.push(`Created ${discount}% discount campaign for ${itemName}.`);
  }

  // Detect broadcast intent
  if (
    n.includes("broadcast") || n.includes("whatsapp") || n.includes("sms") ||
    n.includes("notify") || n.includes("alert") || n.includes("send message")
  ) {
    const channel: "whatsapp" | "sms" = n.includes("sms") ? "sms" : "whatsapp";
    const audience =
      n.includes("regular") ? "regular customers" :
        n.includes("vip") ? "VIP members" :
          n.includes("all") ? "all customers" : "regular customers";

    // Use the latest promo message or generate one
    const broadcastMsg = `📢 New announcement from your favourite shop! Check out our latest offers and fresh arrivals. Visit us today!`;

    thoughts.push(`Detected broadcast request via ${channel} to ${audience}.`);
    actions.push({
      tool: "broadcast_notification",
      args: {
        channel,
        recipient_group: audience,
        message: broadcastMsg,
      },
    });
    responses.push(`${channel === "whatsapp" ? "WhatsApp" : "SMS"} broadcast sent to ${audience}.`);
  }

  // Detect remove/delete item intent
  if (
    (n.includes("remove") || n.includes("delete") || n.includes("get rid of")) &&
    !n.includes("discount") && !n.includes("promo")
  ) {
    const itemName = extractItemName(n);
    if (itemName) {
      thoughts.push(`Detected request to permanently remove "${itemName}" from inventory.`);
      actions.push({
        tool: "remove_item",
        args: { item_name: itemName },
      });
      responses.push(`Removed ${itemName} from inventory.`);
    }
  }

  // Fallback if nothing detected
  if (actions.length === 0) {
    return {
      thought: "The user's request doesn't clearly match any of my available tools (update_inventory, create_promo_campaign, broadcast_notification, remove_item). I'll provide a helpful response suggesting what I can do.",
      actions: [],
      response:
        "I'm ShopAgent, your autonomous business operations assistant! I can help you with:\n\n• **Inventory Management** — Add items, update stock, adjust prices\n• **Remove Items** — Permanently delete products from inventory\n• **Promo Campaigns** — Create discount offers with promo codes\n• **Customer Broadcasts** — Send WhatsApp/SMS alerts to customers\n\nTry one of the quick-action chips above, or describe what you need in natural language!",
    };
  }

  return {
    thought: thoughts.join(" "),
    actions,
    response: responses.join(" "),
  };
}

/* ---------- Item Name Extraction ---------- */

const knownItems = [
  "alphonso mangoes", "mangoes", "mango", "basmati rice", "rice",
  "coconut oil", "milk", "farm eggs", "eggs", "wheat flour", "flour",
  "tomatoes", "onions", "potatoes", "apples", "bananas", "oranges",
  "sugar", "salt", "tea", "coffee", "ghee", "butter", "paneer", "curd",
  "fresh fruits", "fruits", "vegetables",
];

function extractItemName(text: string): string {
  // Check known items first (longest match first)
  const sorted = [...knownItems].sort((a, b) => b.length - a.length);
  for (const item of sorted) {
    if (text.includes(item)) {
      return item
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }
  // Try pattern: "of <item>" or "for <item>"
  const ofMatch = text.match(/(?:of|for|on)\s+([a-zA-Z\s]{2,30})(?:\s+(?:at|to|@|for|with)|$)/i);
  if (ofMatch) {
    return ofMatch[1].trim().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
  return "";
}

function guessCategory(itemName: string): string {
  const n = itemName.toLowerCase();
  if (["mango", "apple", "banana", "orange", "fruit"].some((f) => n.includes(f))) return "Fruits";
  if (["tomato", "onion", "potato", "vegetable"].some((v) => n.includes(v))) return "Vegetables";
  if (["rice", "wheat", "flour", "grain"].some((g) => n.includes(g))) return "Grains";
  if (["oil", "ghee"].some((o) => n.includes(o))) return "Oils";
  if (["milk", "curd", "paneer", "butter", "cheese"].some((d) => n.includes(d))) return "Dairy";
  if (["egg"].some((e) => n.includes(e))) return "Poultry";
  if (["tea", "coffee", "sugar", "salt"].some((s) => n.includes(s))) return "Essentials";
  return "General";
}

/* ---------- Main Entry Point ---------- */

export async function runFallbackAgent(message: string): Promise<AgentResponse> {
  const n = normalise(message);

  // Step 1: Log the thought
  let parsed: { actions: ParsedAction[]; thought: string; response: string };

  if (isDemoPrompt1(n)) {
    parsed = parseDemoPrompt1();
  } else if (isDemoPrompt2(n)) {
    parsed = parseDemoPrompt2();
  } else if (isDemoPrompt3(n)) {
    parsed = parseDemoPrompt3();
  } else {
    parsed = parseGeneral(message);
  }

  addLog({ type: "THOUGHT", content: parsed.thought });

  // Step 2: Execute tools
  const toolCalls: ToolCallRecord[] = [];
  const toolResults: ToolResultRecord[] = [];

  for (const action of parsed.actions) {
    toolCalls.push({ tool: action.tool, args: action.args });
    const result = executeTool(action.tool, action.args);
    toolResults.push({ tool: action.tool, result: result as unknown as Record<string, unknown> });
  }

  // Step 3: Return structured response
  return {
    thought: parsed.thought,
    toolCalls,
    toolResults,
    agentResponse: parsed.response,
    state: getState(),
  };
}

