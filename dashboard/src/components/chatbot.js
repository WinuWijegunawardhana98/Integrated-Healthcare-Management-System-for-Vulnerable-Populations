import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chat = () => {
  const [message, setMessage] = useState(''); // Current user input
  const [history, setHistory] = useState([]); // Conversation history
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const chatHistoryRef = useRef(null); // Ref for auto-scrolling

  // Auto-scroll to the bottom of the chat history when it updates
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [history]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return; // Prevent empty messages

    // Add user message to history
    const userMessage = `[USER]: ${message}`;
    setHistory((prev) => [...prev, userMessage]);
    setMessage(''); // Clear input
    setLoading(true);

    try {
      // Send request to FastAPI backend
      const response = await axios.post('http://127.0.0.1:8000/chat', {
        history: history, // Send full history for context
        message: message.trim(),
      });

      // Add AI response to history
      const aiResponse = `[ASSISTANT]: ${response.data.response}`;
      setHistory((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error fetching response:', error);
      let errorMessage = '[ASSISTANT]: Sorry, something went wrong.';
      if (error.response) {
        errorMessage = `[ASSISTANT]: Server error: ${error.response.status} - ${error.response.data.detail || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = '[ASSISTANT]: Could not reach the server. Is it running?';
      }
      setHistory((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Chat with AI Assistant</h1>

      {/* Chat History */}
      <div ref={chatHistoryRef} style={styles.history}>
        {history.length === 0 ? (
          <p style={styles.emptyMessage}>Start chatting by typing a message below!</p>
        ) : (
          history.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.message,
                ...(msg.startsWith('[USER]') ? styles.userMessage : styles.assistantMessage),
              }}
            >
              {msg}
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} style={styles.form}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          rows="3"
          disabled={loading}
          style={styles.textarea}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

// Inline styles (can be moved to a separate CSS file)
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center',
    color: '#333',
  },
  history: {
    border: '1px solid #ccc',
    padding: '10px',
    height: '400px',
    overflowY: 'auto',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  message: {
    margin: '10px 0',
    padding: '8px',
    borderRadius: '5px',
  },
  userMessage: {
    backgroundColor: '#e3f2fd',
    textAlign: 'right',
  },
  assistantMessage: {
    backgroundColor: '#f1f8e9',
    textAlign: 'left',
  },
  emptyMessage: {
    color: '#888',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    gap: '10px',
  },
  textarea: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    resize: 'none',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    opacity: (props) => (props.disabled ? '0.6' : '1'),
  },
};

export default Chat;