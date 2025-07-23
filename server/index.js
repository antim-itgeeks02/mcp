import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createPost } from "./mcp.tool.js";
import { z } from "zod";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleGenAI } from "@google/genai"
import { searchShopTool } from "./searchShop.tool.js";
import { searchFaqsTool } from "./searchFaqs.tool.js";
import { getCartTool } from "./getCart.tool.js";
import { updateCartTool } from "./updateCart.tool.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


const server = new McpServer({
    name: "example-server",
    version: "1.0.0"
});

// ... set up server resources, tools, and prompts ...

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function extractNumbersFromText(text) {
    // This regex finds all numbers (including negative and decimal numbers)
    const matches = text.match(/-?\d+(\.\d+)?/g);
    if (!matches) return [];
    return matches.map(Number);
}

//hello there
const tools = [
    {
        name: "addTwoNumbers",
        description: "Add two numbers",
        schema: {
            a: z.number(),
            b: z.number()
        },
        handler: async (arg, userMessage) => {
            console.log("arg", arg);
            let { a, b } = arg;
            if (typeof a !== "number" || typeof b !== "number" || isNaN(a) || isNaN(b)) {
                // Try to extract numbers from the user message
                if (userMessage) {
                    const nums = extractNumbersFromText(userMessage);
                    if (nums.length >= 2) {
                        a = nums[0];
                        b = nums[1];
                    }
                }
            }
            if (typeof a !== "number" || typeof b !== "number" || isNaN(a) || isNaN(b)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "Please provide two numbers, e.g., 'add 2 and 3'."
                        }
                    ]
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: `The sum of ${a} and ${b} is ${a + b}`
                    }
                ]
            }
        }
    },

    // {
    //     name: "createPost",
    //     description: "Create a post on X formally known as Twitter ",
    //     schema: {
    //         status: z.string()
    //     },
    //     handler: async (arg) => {
    //         const { status } = arg;
    //         return createPost(status);
    //     }
    // },

    {
        name: "search_shop_catalog",
        description: "Search the shop catalog for a product",
        schema: {
            query: z.string(),
            context: z.string().optional().default(""),
            storefrontUrl: z.string()
        },
        handler: searchShopTool
    },
    {
        name: "search_shop_policies_and_faqs",
        description: "Search the shop policies and faqs",
        schema: {
            query: z.string(),
            context: z.string().optional().default(""),
            storefrontUrl: z.string()
        },
        handler: searchFaqsTool
    },
    {
        name: "get_cart",
        description: "Get the cart details from your shopify cart",
        schema: {
            query: z.string().optional(),
            context: z.string().optional().default(""),
            cartId: z.string().optional(),
            storefrontUrl: z.string()
        },
        handler: searchShopTool
    },
    {
        name: "update_cart",
        description: "Update your shopify cart with the given items or new one  ",
        schema: {
            query: z.string().optional(),   
            context: z.string().optional().default(""),
            cartId: z.string().optional(),
            lines: z.array(z.object({
                lines_item_id: z.string().optional(),
                merchandise_id: z.string().optional(),
                quantity: z.number()
            })),
            storefrontUrl: z.string()
        },
        handler: searchShopTool
    },
]
// Register all tools with the server
tools.forEach(tool => {
    server.tool(
        tool.name,
        tool.description,
        tool.schema,
        tool.handler
    );
});


// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports = {};

app.get("/sse", async (req, res) => {
    try {
        const transport = new SSEServerTransport('/messages', res);
        transports[ transport.sessionId ] = transport;
        res.on("close", () => {
            delete transports[ transport.sessionId ];
        });
        await server.connect(transport);
        console.log("SSE connection established");
    } catch (err) {
        console.error("Error in /sse:", err);
        res.status(500).send("Internal server error");
    }
});

app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports[ sessionId ];
    if (transport) {
        await transport.handlePostMessage(req, res);
    } else {
        res.status(400).send('No transport found for sessionId');
    }
});

app.post('/chat', async (req, res) => {
    const { message, history, storefrontUrl } = req.body;
    let chatHistory = history || [];
    if (storefrontUrl) {
        chatHistory.unshift({
            role: "user",
            parts: [{ text: `For all tool calls, use storefrontUrl: "${storefrontUrl}". The current store domain is: ${storefrontUrl}`, type: "text" }]
        });
    }
    chatHistory = chatHistory.map(msg => {
        if (typeof msg === "string") {
            return { role: "user", parts: [{ text: msg, type: "text" }] };
        }
        if (msg.role && Array.isArray(msg.parts)) {
            return msg;
        }
        // fallback: treat as user text
        return { role: "user", parts: [{ text: String(msg), type: "text" }] };
    });
    // chatHistory.push({ role: "user", parts: [{ text: message, type: "text" }] });
    chatHistory.push({ role: "user", parts: [{ text: message, type: "text" }] });
    // console.log("message", message, "storefrontUrl", storefrontUrl);
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: chatHistory,
        config: { tools: [{ functionDeclarations: tools }] }
    });
    console.log(response.candidates[0].content.parts[0]);
    const part = response.candidates[0].content.parts[0];
    let responseText = "";
    if (part.functionCall) {
        // Find the tool by name
        const tool = tools.find(t => t.name === part.functionCall.name);
        if (tool) {
            // PATCH: If storefrontUrl is missing, fill it in from the request
            if (part.functionCall.name === "search_shop_catalog") {
                if (!part.functionCall.args.storefrontUrl && storefrontUrl) {
                    part.functionCall.args.storefrontUrl = storefrontUrl;
                }
            }
            const toolResult = await tool.handler(part.functionCall.args, message);
            let result = toolResult.content[0].text;
            let parsed;
            try {
                parsed = typeof result === "string" ? JSON.parse(result) : result;
            } catch (e) {
                parsed = null;
            }
            console.log("parsed", parsed);
            console.log("parsed", Array.isArray(parsed.products));
            
            // Beautify the response if products are present
            if (parsed && Array.isArray(parsed.products)) {
                if (parsed.products.length === 0) {
                    responseText = "No products found for your search.";
                } else {
                    responseText = `Found ${parsed.products.length} products:**\n\n`;
                    responseText += parsed.products.map(product => {
                        return `- [${product.title}](${product.url}) - $${product.price_range.min} ${product.price_range.currency}\n  ![${product.title}](${product.image_url})`;
                    }).join('\n\n');
                }
            } else {
                // Fallback: just show the raw tool result
                responseText = result;
            }
            responseText = toolResult.content[0].text;
        } else {
            responseText = "Unknown tool: " + part.functionCall.name;
        }
    } else {
        responseText = part.text;
    }
    // console.log("responseText", responseText);
    chatHistory.push({ role: "model", parts: [{ text: responseText, type: "text" }] });
    res.json({ reply: responseText });
});

app.listen(3001, () => {
    console.log("Server is running on http://localhost:3001");
});