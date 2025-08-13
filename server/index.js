import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
// import { createPost } from "./mcp.tool.js";
import { z } from "zod";
import cors from "cors";
import bodyParser from "body-parser";
import { GoogleGenAI } from "@google/genai"
// import { searchShopTool } from "./searchShop.tool.js";
// import { searchFaqsTool } from "./searchFaqs.tool.js";
// import { getCartTool } from "./getCart.tool.js";
// import { updateCartTool } from "./updateCart.tool.js";
import { handleProductResult, handleFaqsResult, handleCartResult, handleUpdateCartResult } from "./toolResultHandler.js";
import { config } from 'dotenv';
import { registerTools } from "./tools.js";
config()

    
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
// const tools = registerTools(server)
// console.log(registerTools(server))
// Register all tools with the server
const tools = registerTools;
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
        model: "gemini-2.5-flash",
        contents: chatHistory,
        config: { tools: [{ functionDeclarations: tools }] }
    });
    console.log(response.candidates[0].content.parts[0]);
    const part = response.candidates[0].content.parts[0];
    console.log(part)
    let responseText = "";
    if (part.functionCall) {
        // Find the tool by name
        const tool = tools.find(t => t.name === part.functionCall.name);
        if (tool) {
            // PATCH: If storefrontUrl is missing, fill it in from the request
            if (part.functionCall.name === "search_shop_catalog") {
                responseText = await handleProductResult(tool, part, message, storefrontUrl);
            } else if (part.functionCall.name === "search_shop_policies_and_faqs") {
                responseText = await handleFaqsResult(tool, part, message, storefrontUrl);
            } else if (part.functionCall.name === "get_cart") {
                responseText = await handleCartResult(tool, part, message, storefrontUrl);
            } else if (part.functionCall.name === "update_cart") {
                responseText = await handleUpdateCartResult(tool, part, message, storefrontUrl);
            } else {
                responseText = await tool.handler(part.functionCall.args, message);
            }
            // responseText = await tool.handler(part.functionCall.args, message);
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
  console.log(server)
    console.log("Server is running on http://localhost:3001");
});