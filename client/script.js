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
        console.log(data);
        
        removeLoadingMessage();
        // Try to parse as JSON for product data
        let parsed;
        try {
            parsed = typeof data.reply === "string" ? JSON.parse(data.reply) : data.reply;
        } catch (e) {
            parsed = null;
        }

        if (parsed && Array.isArray(parsed.products)) {
            // Render product cards
            let html = `<div class="product-list">`;
            parsed.products.forEach(product => {
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
        }  else if (data && data.reply) {
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