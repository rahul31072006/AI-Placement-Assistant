import sqlite3

DB_NAME = "chat_history.db"


def create_tables():

    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chats(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER,
        role TEXT,
        content TEXT
    )
    """)

    conn.commit()
    conn.close()


def create_chat(title="New Chat"):

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO chats(title) VALUES(?)",
        (title,)
    )

    chat_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return chat_id


def save_message(chat_id, role, content):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO messages(chat_id, role, content) VALUES(?, ?, ?)",
        (chat_id, role, content)
    )

    conn.commit()
    conn.close()


def get_all_chats():

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("SELECT id, title FROM chats ORDER BY id DESC")
    chats = cursor.fetchall()

    conn.close()

    return [{"id": chat[0], "title": chat[1]} for chat in chats]


def get_chat_messages(chat_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        "SELECT role, content FROM messages WHERE chat_id = ? ORDER BY id ASC",
        (chat_id,)
    )
    messages = cursor.fetchall()

    conn.close()

    return [{"role": msg[0], "content": msg[1]} for msg in messages]


def update_chat_title(chat_id, new_title):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE chats SET title = ? WHERE id = ?",
        (new_title, chat_id)
    )

    conn.commit()
    conn.close()


def delete_chat(chat_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM messages WHERE chat_id = ?", (chat_id,))
    cursor.execute("DELETE FROM chats WHERE id = ?", (chat_id,))

    conn.commit()
    conn.close()