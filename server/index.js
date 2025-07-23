import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createPost } from "./mcp.tool.js";
import { z } from "zod";
import cors from "cors";

const server = new McpServer({
    name: "example-server",
    version: "1.0.0"
});

// ... set up server resources, tools, and prompts ...

const app = express();
app.use(cors());


//hello there

server.tool(
    "addTwoNumbers",
    "Add two numbers",
    {
        a: z.number(),
        b: z.number()
    },
    async (arg) => {
        const { a, b } = arg;
        return {
            content: [
                {
                    type: "text",
                    text: `The sum of ${a} and ${b} is ${a + b}`
                }
            ]
        }
    }
)

server.tool(
    "createPost",
    "Create a post on X formally known as Twitter ", {
    status: z.string()
}, async (arg) => {
    const { status } = arg;
    return createPost(status);
})

server.tool(
    "search_shop_catalog",
    "Search the shop catalog for a product",
    {
        query: z.string(),
        context: z.string().optional().default(""),
        storefrontUrl: z.string()
    },
    async ({ query, context, storefrontUrl }) => {
            try {
              // Send MCP-formatted request to external MCP server
              const remoteMcpResponse = await fetch(`https://${storefrontUrl}/api/mcp`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  method: "tools/call",
                  id: 1,
                  params: {
                    name: "search_shop_catalog",
                    arguments: {
                      query: query ? query : "",
                      context: context ? context : ""
                    }
                  }
                })
              });
              const json = await remoteMcpResponse.json();
    
          if (!json.result || !json.result.content) {
            return {
              content: [
                {
                  type: "text",
                  text: "Remote server returned no content."
                }
              ]
            };
          }
    
          // Return the content exactly as received from remote MCP
          return {
            content: json.result.content
          };
    
        } catch (err) {
          console.error("Error contacting remote MCP server:", err);
          return {
            content: [
              {
                type: "text",
                text: "Failed to contact the remote MCP server."
              }
            ]
          };
        }
      }
)


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

app.listen(3001, () => {
    console.log("Server is running on http://localhost:3001");
});