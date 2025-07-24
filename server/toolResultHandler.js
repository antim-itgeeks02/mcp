export async function handleProductResult(tool, part, message, storefrontUrl) {
    // PATCH: If storefrontUrl is missing, fill it in from the request
    if (part.functionCall.name === "search_shop_catalog") {
        if (!part.functionCall.args.storefrontUrl && storefrontUrl) {
            part.functionCall.args.storefrontUrl = storefrontUrl;
        }
    }
    if (!('query' in part.functionCall.args)) {
        part.functionCall.args.query = message ? message : "Provide the result of this message";
    }
    if (!('context' in part.functionCall.args)) {
        part.functionCall.args.context = "Provide the result of this message";
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
    console.log("parsed", Array.isArray(parsed?.products));

    // Beautify the response if products are present
    let responseText = "";
    console.log("handler parsed ", parsed);
    if (parsed && Array.isArray(parsed.products)) {
        return parsed; // Return the object, not a string
    } else {
        return { message: result }; // Fallback: wrap plain text in an object
    }
    // Always return the tool result text (as in the original code)
    // responseText = toolResult.content[0].text;
    // return responseText;
}

export async function handleFaqsResult(tool, part, message, storefrontUrl) {
    if (!part.functionCall.args.storefrontUrl && storefrontUrl) {
        part.functionCall.args.storefrontUrl = storefrontUrl;
    }
    if (!('query' in part.functionCall.args)) {
        part.functionCall.args.query = message ? message : "Provide the result of this message";
    }
    if (!('context' in part.functionCall.args)) {
        part.functionCall.args.context = "Give me the faqs and policies that is mentioned in the message";
    }
    const toolResult = await tool.handler(part.functionCall.args, message);
    let result = toolResult.content[0].text;
    let parsed;
    try {
        parsed = typeof result === "string" ? JSON.parse(result) : result;
    } catch (e) {
        parsed = null;
    }
    return toolResult.content[0].text;
}

export async function handleCartResult(tool, part, message, storefrontUrl) {
    if (!part.functionCall.args.storefrontUrl && storefrontUrl) {
        part.functionCall.args.storefrontUrl = storefrontUrl;
    }
    if (!('query' in part.functionCall.args)) {
        part.functionCall.args.query = message ? message : "Provide the result of this message";
    }
    if (!('context' in part.functionCall.args)) {
        part.functionCall.args.context = "Give me cart details and products in the cart of the user";
    }
    const toolResult = await tool.handler(part.functionCall.args, message);
    let result = toolResult.content[0].text;
    let parsed;
    try {
        parsed = typeof result === "string" ? JSON.parse(result) : result;
    } catch (e) {
        parsed = null;
    }
    return toolResult.content[0].text;
}

export async function handleUpdateCartResult(tool, part, message, storefrontUrl) {
    if (!part.functionCall.args.storefrontUrl && storefrontUrl) {
        part.functionCall.args.storefrontUrl = storefrontUrl;
    }
    if (!('query' in part.functionCall.args)) {
        part.functionCall.args.query = message ? message : "Provide the result of this message";
    }
    if (!('context' in part.functionCall.args)) {
        part.functionCall.args.context = "Provide the result of this message";
    }
    const toolResult = await tool.handler(part.functionCall.args, message);
    const parsed = toolResult.content[0].parsed;
    if (parsed && parsed.cart && parsed.cart.checkout_url) {
        // You can now use parsed.cart.checkout_url, parsed.instructions, etc.
        // For example, return a markdown link to checkout:
        return `Ready to checkout? [Click here to proceed to checkout](${parsed.cart.checkout_url})`;
    }
    // Fallback: return the raw text if parsing failed
    return toolResult.content[0].text;
}