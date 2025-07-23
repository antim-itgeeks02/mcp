export async function updateCartTool({ query, context, cartId, lines, storefrontUrl }) {
    try {
        const remoteMcpResponse = await fetch(`https://${storefrontUrl}/api/mcp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "tools/call",
                id: 1,
                params: {
                    name: "update_cart",
                    arguments: {
                        query: query || "",
                        context: context || "",
                        cartId: cartId || "",
                        lines: lines || []
                    }
                }
            })
        });
        const json = await remoteMcpResponse.json();
        if (!json.result || !json.result.content) {
            return { content: [{ type: "text", text: "Remote server returned no content." }] };
        }
        return { content: json.result.content };
    } catch (err) {
        console.error("Error contacting remote MCP server:", err);
        return { content: [{ type: "text", text: "Failed to contact the remote MCP server." }] };
    }
}