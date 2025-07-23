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
    storeDomain = storeInput.value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/\.com$/, '');
    if (storeDomain) {
        await connectSSE();
        storeForm.style.display = 'none';
        chat.style.display = '';
        chatForm.style.display = '';
        addBotMessage(`Welcome to <b>${storeDomain}</b>!!! Ask about store, products, policies, faqs, etc.!`);
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

function addBotMessage(text) {
    chatHistory.push({ role: 'bot', content: text });
    renderChat();
}

function addLoadingMessage() {
    chatHistory.push({ role: 'bot', content: '<span class="loading"><span></span><span></span><span></span></span>' });
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
        bubble.innerHTML = msg.content;
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
        const res = await fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: query,
                history: chatHistory
            })
        });
        const data = await res.json();
        removeLoadingMessage();
        if (data && data.reply) {
            addBotMessage(data.reply);
            // Optionally update chatHistory with data.history if you want to keep full context
        } else {
            addBotMessage("Bot: (no response)");
        }
    } catch (err) {
        removeLoadingMessage();
        addBotMessage("Error communicating with server.");
    }
}