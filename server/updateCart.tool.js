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
        console.log("json.result.content ", json.result.content);
        const contentArr = json.result.content;
        if (
            Array.isArray(contentArr) &&
            contentArr.length > 0 &&
            typeof contentArr[0].text === "string"
        ) {
            try {
                // Try to parse the text as JSON
                const parsed = JSON.parse(contentArr[0].text);
                // Now you can access parsed.instructions, parsed.cart, etc.
                return { content: [{ ...contentArr[0], parsed }] };
            } catch (e) {
                // If parsing fails, just return as is
                return { content: contentArr };
            }
        }
        return { content: contentArr };
    } catch (err) {
        console.error("Error contacting remote MCP server:", err);
        return { content: [{ type: "text", text: "Failed to contact the remote MCP server." }] };
    }
}