// import { chatHistory } from "./index.js"
const SERVER_URL = 'http://localhost:3001/messages';
// const eventSource = new EventSource('http://localhost:3001/sse?sessionId=' + sessionId);
let sessionId = Math.random().toString(36).substring(2);
// let eventSource = null;
let storeDomain = '';
const storeForm = document.getElementById('storeForm');
const storeInput = document.getElementById('storeInput');
const chat = document.getElementById('chat');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

let chatHistory = [];

storeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    storeDomain = storeInput.value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (storeDomain) {
        await connectSSE();
        storeForm.style.display = 'none';
        chat.style.display = '';
        chatForm.style.display = '';
        addBotMessage(`Welcome to <b>${storeDomain}</b>!!! Ask about store, products, policies, faqs, etc.!`, true);
    }
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    console.log(query);
    if (!query) return;
    addUserMessage(query);
    chatInput.value = '';
    await sendMessage(query);
});

function addUserMessage(text) {
    chatHistory.push({ role: 'user', content: text });
    renderChat();
}

function addBotMessage(text, isHtml = false) {
    chatHistory.push({ role: 'bot', content: text, isHtml });
    renderChat();
}

function addLoadingMessage() {
    chatHistory.push({ role: 'bot', content: '<span class="loading"><span></span><span></span><span></span></span>', isHtml: true });
    renderChat();
}

function removeLoadingMessage() {
    chatHistory = chatHistory.filter(msg => !msg.content.includes('class="loading"'));
    renderChat();
}

function renderChat() {
    chat.innerHTML = '';
    chatHistory.forEach(msg => {
        const row = document.createElement('div');
        row.className = 'message-row ' + msg.role;
        const bubble = document.createElement('div');
        bubble.className = 'bubble ' + msg.role;
        if (msg.isHtml) {
            bubble.innerHTML = msg.content;
        } else {
            bubble.textContent = msg.content;
        }
        row.appendChild(bubble);
        chat.appendChild(row);
    });
    chat.scrollTop = chat.scrollHeight;
}

async function connectSSE() { 
    try {
        console.log('connectSSE', sessionId);
        
        // eventSource = new EventSource('http://localhost:3001/sse?sessionId=' + sessionId);
        let es = new EventSource(`http://localhost:3001/sse?sessionId=${sessionId}`);
        es.onopen = () => {
            console.log('SSE connection established');
        };
        es.onerror = (err) => {
            console.error('SSE error:', err);
        };
        es.onmessage = (e) => console.log('msg', e.data);
    } catch (error) {
        console.error('Error connecting to SSE:', error);
    }
    // Optionally handle messages from the server here
}

function removeImmediateRepeatedWords(text) {
    // Split by spaces, but keep line breaks as is
    return text.split('\n').map(line => {
        const words = line.split(' ');
        const filtered = [];
        for (let i = 0; i < words.length; i++) {
            if (i === 0 || words[i].toLowerCase() !== words[i - 1].toLowerCase()) {
                filtered.push(words[i]);
            }
        }
        return filtered.join(' ');
    }).join('\n');
}

function formatInstructionsAsBullets(instructions) {
    
    const lines = instructions.split('\n');
    let html = '';
    let inList = false;
    let inSubList = false;
    let buffer = [];

    function flushParagraph() {
        if (buffer.length > 0) {
            html += `<p>${buffer.join(' ')}</p>`;
            buffer = [];
        }
    }

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Nested numbered or bulleted (starts with 1+ spaces then 1. or - or *)
        if (/^(\s{2,}(\d+\.)|\s{2,}[-*])\s+/.test(lines[i])) {
            if (!inSubList) {
                html += '<ul style="margin-left:1em">';
                inSubList = true;
            }
            flushParagraph();
            // Remove leading spaces and bullet/number
            let text = line.replace(/^(\s{2,}(\d+\.)|\s{2,}[-*])\s+/, '');
            html += `<li>${text}</li>`;
            continue;
        } else if (inSubList) {
            html += '</ul>';
            inSubList = false;
        }

        // Top-level bullet or number
        if (/^(-|\*|\d+\.)\s+/.test(line)) {
            if (!inList) {
                flushParagraph();
                html += '<ul>';
                inList = true;
            }
            // Remove bullet/number
            let text = line.replace(/^(-|\*|\d+\.)\s+/, '');
            html += `<li>${text}</li>`;
        } else if (line === '') {
            // Blank line: end any open lists and flush paragraph
            if (inSubList) {
                html += '</ul>';
                inSubList = false;
            }
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            flushParagraph();
        } else {
            // Paragraph text
            buffer.push(line);
        }
    }
    // Close any open lists or paragraphs
    if (inSubList) html += '</ul>';
    if (inList) html += '</ul>';
    flushParagraph();

    return html;
}

async function sendMessage(query) {
    addLoadingMessage();
    try {
        console.log("hit");
        
        console.log("send message ", chatHistory);
        console.log("storeDomain ", storeDomain);
        const res = await fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                {
                    message: query,
                    history: chatHistory,
                    storefrontUrl: storeDomain
                }
            )
        });
        const data = await res.json();
        console.log("data ", data);
        
        removeLoadingMessage();
        // Try to parse as JSON for product data
        let parsed;
        if (!parsed) {
            try {
                parsed = typeof data.reply === "string"
                    ? JSON.parse(data.reply)
                    : data.reply;
            } catch (e) {
                parsed = null;
            }
        }   

         // Check if it's an array of FAQ/policy objects
        //  console.log("parsed before if ", parsed);
         if (data.reply && data.reply?.products && Array.isArray(data.reply.products)) {
            if (data.reply?.products?.length === 0) {
                // No products, show instructions if available
                console.log("hit");
                const formatted = formatInstructionsAsBullets(data.reply.instructions || "No products found.");
                addBotMessage(formatted || "No products found.", true);
            } else {
                // Render product cards
                let html = `<div class="product-list">`;
                data.reply.products.forEach(product => {
                    html += `
                    <div class="product-card">
                        <a href="${product.url}" target="_blank">
                            <img src="${product.image_url}" alt="${product.title}" class="product-image"/>
                            <div class="product-title">${product.title}</div>
                        </a>
                        <div class="product-price">$${product.price_range.min} ${product.price_range.currency}</div>
                    </div>
                    `;
                });
                html += `</div>`;
                addBotMessage(html, true);
            }
        } else if (Array.isArray(parsed) && parsed[0]?.question && parsed[0]?.answer) {
            //  <div class="faq-question"><b>Q:</b> ${item.question}</div>
            let html = parsed.map(item => `
                <div class="">
                    <div class="">${removeImmediateRepeatedWords(item.answer).replace(/\n/g, "<br>")}</div>
                </div>
            `).join('');
            addBotMessage(html, true);
        } else if (data && data.reply) {
            // Fallback: show as plain text
            addBotMessage(data.reply);
        // } else {
        //     // Fallback: show as plain text
        //     addBotMessage(data.reply);
        // }
        // if (data && data.reply) {
        //     addBotMessage(data.reply);
        //     // Optionally update chatHistory with data.history if you want to keep full context
        } else {
            addBotMessage("Bot: (no response)");
        }
    } catch (err) {
        removeLoadingMessage();
        addBotMessage("Error communicating with server.");
    }
}