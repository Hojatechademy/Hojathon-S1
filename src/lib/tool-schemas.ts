// ============================================
// ShopAgent — Gemini Function Declaration Schemas
// ============================================
// These schemas are used for Gemini function calling
// and also serve as documentation for the fallback parser.
// ============================================

export const toolSchemas = [
  {
    name: "update_inventory",
    description:
      "Add, update, or modify an inventory item in the shop's catalog. Creates a new item if it doesn't already exist. Use mode='add' to increase stock, 'subtract' to decrease, or 'set' to set an exact value.",
    parameters: {
      type: "object" as const,
      properties: {
        item_name: {
          type: "string",
          description: "Name of the inventory item (e.g. 'Alphonso Mangoes', 'Basmati Rice')",
        },
        category: {
          type: "string",
          description: "Category of the item (e.g. 'Fruits', 'Grains', 'Dairy', 'Oils')",
        },
        price: {
          type: "number",
          description: "Price per unit in INR (₹). Set to 0 or omit if not changing price.",
        },
        stock_delta_or_total: {
          type: "number",
          description:
            "The quantity value. Interpretation depends on 'mode': for 'add'/'subtract' this is the delta, for 'set' this is the absolute total.",
        },
        unit: {
          type: "string",
          description: "Unit of measurement (e.g. 'kg', 'litre', 'packet', 'piece')",
        },
        mode: {
          type: "string",
          enum: ["set", "add", "subtract"],
          description:
            "'add' to increase stock by the given amount, 'subtract' to decrease, 'set' to set exact stock level.",
        },
      },
      required: ["item_name", "category", "price", "stock_delta_or_total", "unit", "mode"],
    },
  },
  {
    name: "create_promo_campaign",
    description:
      "Create a promotional campaign with a discount for a specific product. Generates a promo code and prepares the campaign for broadcast.",
    parameters: {
      type: "object" as const,
      properties: {
        item_name: {
          type: "string",
          description: "Name of the product to promote (e.g. 'Alphonso Mangoes')",
        },
        discount_percentage: {
          type: "number",
          description: "Discount percentage (e.g. 15 for 15% off)",
        },
        target_audience: {
          type: "string",
          description: "Target audience for the promotion (e.g. 'all customers', 'regular customers', 'orders above 3kg')",
        },
        promo_message: {
          type: "string",
          description: "The promotional message text to be sent to customers",
        },
      },
      required: ["item_name", "discount_percentage", "target_audience", "promo_message"],
    },
  },
  {
    name: "broadcast_notification",
    description:
      "Send an automated bulk broadcast notification to a group of customers via WhatsApp or SMS. Simulates dispatch and returns confirmation.",
    parameters: {
      type: "object" as const,
      properties: {
        channel: {
          type: "string",
          enum: ["whatsapp", "sms"],
          description: "The communication channel to use for the broadcast",
        },
        recipient_group: {
          type: "string",
          description: "The target group of recipients (e.g. 'regular customers', 'all customers', 'VIP members')",
        },
        message: {
          type: "string",
          description: "The message content to broadcast",
        },
      },
      required: ["channel", "recipient_group", "message"],
    },
  },
  {
    name: "remove_item",
    description:
      "Completely remove/delete an item from the shop's inventory. Use this when the shopkeeper wants to permanently remove a product from the catalog, not just reduce its stock.",
    parameters: {
      type: "object" as const,
      properties: {
        item_name: {
          type: "string",
          description: "Name of the inventory item to remove (e.g. 'Alphonso Mangoes', 'Basmati Rice')",
        },
      },
      required: ["item_name"],
    },
  },
];

/** Tool names as a type for type-safety */
export type ToolName = "update_inventory" | "create_promo_campaign" | "broadcast_notification" | "remove_item";

