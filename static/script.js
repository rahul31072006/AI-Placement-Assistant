let currentChatId = null;

async function sendMessage() {
    const input = document.getElementById("user-input");
    const chatBox = document.getElementById("chat-box");
    const message = input.value.trim();

    if (!message) return;

    const userDiv = document.createElement("div");
    userDiv.className = "message user-message";
    userDiv.textContent = message;
    chatBox.appendChild(userDiv);

    input.value = "";

    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message bot-message loading";
    loadingDiv.textContent = "Typing...";
    chatBox.appendChild(loadingDiv);

    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                chat_id: currentChatId
            })
        });

        const data = await response.json();
        loadingDiv.remove();

        currentChatId = data.chat_id;

        const botDiv = document.createElement("div");
        botDiv.className = "message bot-message";
        botDiv.textContent = data.reply;
        chatBox.appendChild(botDiv);
    } catch (error) {
        loadingDiv.remove();
        const errorDiv = document.createElement("div");
        errorDiv.className = "message bot-message";
        errorDiv.textContent = "Error: " + error.message;
        chatBox.appendChild(errorDiv);
        console.error(error);
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}

async function newChat() {
    try {
        const response = await fetch("/history/new", { method: "POST" });
        const data = await response.json();
        currentChatId = data.chat_id;

        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML = `<div class="welcome"><h2>Welcome 👋</h2><p>Ask me about placements, interviews and resumes.</p></div>`;
        
        loadHistory();
    } catch (error) {
        console.error("Error creating new chat:", error);
    }
}

async function loadHistory() {
    try {
        const response = await fetch("/history/list");
        const data = await response.json();
        const historyList = document.getElementById("history-list");
        
        if (!historyList) return;
        
        historyList.innerHTML = "";
        data.chats.forEach(chat => {
            const itemContainer = document.createElement("div");
            itemContainer.className = "history-item-container";
            
            const item = document.createElement("div");
            item.className = "history-item";
            item.textContent = chat.title;
            item.onclick = () => loadChat(chat.id);
            
            const menu = document.createElement("div");
            menu.className = "chat-menu";
            menu.innerHTML = `
                <button class="menu-btn" onclick="toggleMenu(event, ${chat.id})" title="Options">
                    ⋮
                </button>
                <div class="menu-dropdown" id="menu-${chat.id}" style="display:none;">
                    <button onclick="renameChat(${chat.id})">Rename</button>
                    <button onclick="deleteChat(${chat.id})">Delete</button>
                </div>
            `;
            
            itemContainer.appendChild(item);
            itemContainer.appendChild(menu);
            historyList.appendChild(itemContainer);
        });
    } catch (error) {
        console.error("Error loading history:", error);
    }
}

function toggleMenu(event, chatId) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-${chatId}`);
    const isVisible = menu.style.display === "block";
    
    // Close all other menus
    document.querySelectorAll(".menu-dropdown").forEach(m => m.style.display = "none");
    
    // Toggle current menu
    menu.style.display = isVisible ? "none" : "block";
}

async function renameChat(chatId) {
    const newTitle = prompt("Enter new chat name:");
    if (!newTitle || newTitle.trim() === "") return;
    
    try {
        const response = await fetch(`/history/${chatId}/rename`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ new_title: newTitle })
        });
        
        if (response.ok) {
            loadHistory();
        } else {
            alert("Error renaming chat");
        }
    } catch (error) {
        console.error("Error renaming chat:", error);
        alert("Error renaming chat");
    }
}

async function deleteChat(chatId) {
    if (!confirm("Are you sure you want to delete this chat?")) return;
    
    try {
        const response = await fetch(`/history/${chatId}`, {
            method: "DELETE"
        });
        
        if (response.ok) {
            if (currentChatId === chatId) {
                currentChatId = null;
                document.getElementById("chat-box").innerHTML = `
                    <div class="welcome">
                        <h2>Welcome 👋</h2>
                        <p>Ask me about placements, interviews and resumes.</p>
                    </div>
                `;
            }
            loadHistory();
        } else {
            alert("Error deleting chat");
        }
    } catch (error) {
        console.error("Error deleting chat:", error);
        alert("Error deleting chat");
    }
}

async function loadChat(chatId) {
    currentChatId = chatId;
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";

    try {
        const response = await fetch(`/history/${chatId}`);
        const data = await response.json();

        data.messages.forEach(msg => {
            const msgDiv = document.createElement("div");
            msgDiv.className = msg.role === "user" ? "message user-message" : "message bot-message";
            msgDiv.textContent = msg.content;
            chatBox.appendChild(msgDiv);
        });

        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        console.error("Error loading chat:", error);
        const errorDiv = document.createElement("div");
        errorDiv.className = "message bot-message";
        errorDiv.textContent = "Error loading chat history.";
        chatBox.appendChild(errorDiv);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("user-input");
    input.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            sendMessage();
        }
    });
    loadHistory();
});