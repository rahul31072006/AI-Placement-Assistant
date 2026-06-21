let currentChatId = null;
let recognition = null;
let isRecording = false;

function initializeVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        document.getElementById('voice-indicator').textContent = 'Voice unavailable';
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isRecording = true;
        updateVoiceUI();
    };

    recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('user-input');
        input.value = transcript;
        input.focus();
    };

    recognition.onerror = event => {
        console.error('Voice recognition error:', event.error);
        stopVoiceRecording();
    };

    recognition.onend = () => {
        isRecording = false;
        updateVoiceUI();
    };
}

function updateVoiceUI() {
    const voiceButton = document.getElementById('voice-button');
    const voiceIndicator = document.getElementById('voice-indicator');

    if (isRecording) {
        voiceButton.classList.add('recording');
        voiceButton.textContent = '⏹';
        voiceIndicator.textContent = 'Listening...';
    } else {
        voiceButton.classList.remove('recording');
        voiceButton.textContent = '🎤';
        voiceIndicator.textContent = '';
    }
}

function toggleVoiceRecording() {
    if (!recognition) return;
    if (isRecording) {
        stopVoiceRecording();
    } else {
        startVoiceRecognition();
    }
}

function startVoiceRecognition() {
    if (!recognition) return;
    try {
        recognition.start();
    } catch (error) {
        console.error('Voice recognition start error:', error);
    }
}

function stopVoiceRecording() {
    if (!recognition) return;
    recognition.stop();
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const message = input.value.trim();

    if (!message) return;

    appendMessage('user', message);
    input.value = '';
    scrollChatToBottom();

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message bot-message loading';
    loadingDiv.textContent = 'Typing...';
    chatBox.appendChild(loadingDiv);
    scrollChatToBottom();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, chat_id: currentChatId })
        });

        const data = await response.json();
        loadingDiv.remove();

        currentChatId = data.chat_id;
        appendMessage('assistant', data.reply);
        scrollChatToBottom();
        loadHistory();
    } catch (error) {
        loadingDiv.remove();
        appendMessage('assistant', 'Error: ' + error.message);
        console.error(error);
        scrollChatToBottom();
    }
}

function appendMessage(role, content) {
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'bot-message'}`;
    msgDiv.textContent = content;
    chatBox.appendChild(msgDiv);
}

function scrollChatToBottom() {
    const chatBox = document.getElementById('chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function newChat() {
    try {
        const response = await fetch('/history/new', { method: 'POST' });
        const data = await response.json();
        currentChatId = data.chat_id;
        clearChat();
        loadHistory();
    } catch (error) {
        console.error('Error creating new chat:', error);
    }
}

function clearChat() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = `
        <div class="chat-empty-state">
            <div class="welcome-icon">🎓</div>
            <h2>Welcome to AI Placement Assistant</h2>
            <p>Ask your first question or choose a placement topic from the sidebar.</p>
        </div>
    `;
}

async function loadHistory() {
    try {
        const response = await fetch('/history/list');
        const data = await response.json();
        const historyList = document.getElementById('history-list');

        if (!historyList) return;

        historyList.innerHTML = '';
        data.chats.forEach(chat => {
            const itemContainer = document.createElement('div');
            itemContainer.className = 'history-item-container';

            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = chat.title;
            item.onclick = () => loadChat(chat.id);

            const menu = document.createElement('div');
            menu.className = 'chat-menu';
            menu.innerHTML = `
                <button class="menu-btn" onclick="toggleMenu(event, ${chat.id})" title="Options">⋮</button>
                <div class="menu-dropdown" id="menu-${chat.id}" style="display:none;">
                    <button onclick="renameChat(${chat.id})">Rename Chat</button>
                    <button onclick="deleteChat(${chat.id})">Delete Chat</button>
                </div>
            `;

            itemContainer.appendChild(item);
            itemContainer.appendChild(menu);
            historyList.appendChild(itemContainer);
        });
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function toggleMenu(event, chatId) {
    event.stopPropagation();
    closeAllMenus();
    const menu = document.getElementById(`menu-${chatId}`);
    if (menu) {
        menu.style.display = 'block';
    }
}

function closeAllMenus() {
    document.querySelectorAll('.menu-dropdown').forEach(menu => {
        menu.style.display = 'none';
    });
}

async function renameChat(chatId) {
    const newTitle = prompt('Enter new chat name:');
    if (!newTitle || newTitle.trim() === '') return;

    try {
        const response = await fetch(`/history/${chatId}/rename`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ new_title: newTitle })
        });

        if (response.ok) {
            loadHistory();
        } else {
            alert('Error renaming chat');
        }
    } catch (error) {
        console.error('Error renaming chat:', error);
        alert('Error renaming chat');
    }
}

async function deleteChat(chatId) {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    try {
        const response = await fetch(`/history/${chatId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            if (currentChatId === chatId) {
                currentChatId = null;
                clearChat();
            }
            loadHistory();
        } else {
            alert('Error deleting chat');
        }
    } catch (error) {
        console.error('Error deleting chat:', error);
        alert('Error deleting chat');
    }
}

async function loadChat(chatId) {
    currentChatId = chatId;
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';

    try {
        const response = await fetch(`/history/${chatId}`);
        const data = await response.json();

        if (data.messages.length === 0) {
            clearChat();
            return;
        }

        data.messages.forEach(msg => {
            const role = msg.role === 'user' ? 'user' : 'assistant';
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'bot-message'}`;
            msgDiv.textContent = msg.content;
            chatBox.appendChild(msgDiv);
        });

        scrollChatToBottom();
    } catch (error) {
        console.error('Error loading chat:', error);
        chatBox.innerHTML = '<div class="chat-empty-state"><p>Unable to load chat history.</p></div>';
    }
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const isExpanded = section.classList.contains('expanded');
    section.classList.toggle('expanded', !isExpanded);

    const toggleButton = section.previousElementSibling;
    if (toggleButton) {
        const arrow = toggleButton.querySelector('.toggle-arrow');
        if (arrow) {
            arrow.style.transform = !isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
        }
    }
}

function setTopic(topic) {
    const input = document.getElementById('user-input');
    input.value = topic;
    input.focus();
}

document.addEventListener('click', event => {
    if (!event.target.closest('.chat-menu')) {
        closeAllMenus();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initializeVoiceRecognition();
    const input = document.getElementById('user-input');
    input.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });
    loadHistory();
});