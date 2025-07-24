export async function searchFaqsTool({ query, context, storefrontUrl }) {
    try {
        // console.log("searchFaqsTool called with query: ", query, "context: ", context, "storefrontUrl: ", storefrontUrl);
        const remoteMcpResponse = await fetch(`https://${storefrontUrl}/api/mcp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "tools/call",
                id: 1,
                params: {
                    name: "search_shop_policies_and_faqs",
                    arguments: {
                        query: query ? query : "",
                        context: context ? context : ""
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