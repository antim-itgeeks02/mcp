export const searchShopTool = async ({ query, context, storefrontUrl }) => {
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