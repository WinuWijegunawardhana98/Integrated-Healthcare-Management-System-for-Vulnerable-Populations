import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ENV from '../data/Env';
import { FaUser, FaRobot } from 'react-icons/fa';

const Chat = () => {
  const [message, setMessage] = useState(''); // Current user input
  const [history, setHistory] = useState([]); // Conversation history
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [isOpen, setIsOpen] = useState(false); // Chat window visibility
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
    const userMessage = { text: message, isUser: true };
    setHistory((prev) => [...prev, userMessage]);
    setMessage(''); // Clear input
    setLoading(true);

    try {
      // Send request to FastAPI backend
      const response = await axios.post(ENV.SERVER+'/chat', {
        history: history.map(msg => msg.isUser ? `[USER]: ${msg.text}` : `[ASSISTANT]: ${msg.text}`),
        message: message.trim(),
      });

      // Add AI response to history
      const aiResponse = { text: response.data.response, isUser: false };
      setHistory((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error fetching response:', error);
      let errorMessage = 'Sorry, something went wrong.';
      if (error.response) {
        errorMessage = `Server error: ${error.response.status} - ${error.response.data.detail || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'Could not reach the server. Is it running?';
      }
      setHistory((prev) => [...prev, { text: errorMessage, isUser: false }]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle chat window visibility
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        onClick={toggleChat}
        style={styles.floatingButton}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.container}>
            <div style={styles.header}>
              <FaRobot style={styles.headerIcon} />
              <span>AI Assistant</span>
            </div>

            {/* Chat History */}
            <div ref={chatHistoryRef} style={styles.history}>
              {history.length === 0 ? (
                <div style={styles.welcomeMessage}>
                  <FaRobot style={styles.welcomeIcon} />
                  <p>Hello! How can I help you today?</p>
                </div>
              ) : (
                history.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.messageContainer,
                      ...(msg.isUser ? styles.userContainer : styles.assistantContainer),
                    }}
                  >
                    <div style={styles.avatar}>
                      {msg.isUser ? (
                        <FaUser style={styles.userAvatar} />
                      ) : (
                        <FaRobot style={styles.assistantAvatar} />
                      )}
                    </div>
                    <div
                      style={{
                        ...styles.messageBubble,
                        ...(msg.isUser ? styles.userBubble : styles.assistantBubble),
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div style={styles.assistantContainer}>
                  <div style={styles.avatar}>
                    <FaRobot style={styles.assistantAvatar} />
                  </div>
                  <div style={styles.typingIndicator}>
                    <div style={styles.typingDot}></div>
                    <div style={styles.typingDot}></div>
                    <div style={styles.typingDot}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} style={styles.form}>
              <div style={styles.inputContainer}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows="1"
                  disabled={loading}
                  style={styles.textarea}
                />
                <button type="submit" disabled={loading || !message.trim()} style={styles.button}>
                  {loading ? (
                    <div style={styles.sendIcon}>
                      <div style={styles.spinner}></div>
                    </div>
                  ) : (
                    <svg style={styles.sendIcon} viewBox="0 0 24 24">
                      <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Inline styles
const styles = {
  // Floating button styles
  floatingButton: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.1)',
    },
  },
  // Chat window styles
  chatWindow: {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    width: '350px',
    height: '500px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  },
  header: {
    padding: '15px',
    backgroundColor: '#4caf50',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: '600',
  },
  headerIcon: {
    fontSize: '20px',
  },
  history: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  welcomeMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#666',
    padding: '20px',
    gap: '10px',
  },
  welcomeIcon: {
    fontSize: '40px',
    color: '#4caf50',
  },
  messageContainer: {
    display: 'flex',
    gap: '10px',
    maxWidth: '90%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    display: 'flex',
    alignItems: 'flex-end',
    marginBottom: '5px',
  },
  userAvatar: {
    fontSize: '16px',
    color: 'white',
    backgroundColor: '#4caf50',
    padding: '6px',
    borderRadius: '50%',
  },
  assistantAvatar: {
    fontSize: '16px',
    color: 'white',
    backgroundColor: '#666',
    padding: '6px',
    borderRadius: '50%',
  },
  messageBubble: {
    padding: '10px 15px',
    borderRadius: '18px',
    fontSize: '14px',
    lineHeight: '1.4',
    wordBreak: 'break-word',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  userBubble: {
    backgroundColor: '#4caf50',
    color: 'white',
    borderTopRightRadius: '4px',
  },
  assistantBubble: {
    backgroundColor: 'white',
    color: '#333',
    borderTopLeftRadius: '4px',
  },
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '10px 15px',
    backgroundColor: 'white',
    borderRadius: '18px',
    borderTopLeftRadius: '4px',
  },
  typingDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#ccc',
    borderRadius: '50%',
    animation: 'typingAnimation 1.4s infinite ease-in-out',
    '&:nth-child(1)': {
      animationDelay: '0s',
    },
    '&:nth-child(2)': {
      animationDelay: '0.2s',
    },
    '&:nth-child(3)': {
      animationDelay: '0.4s',
    },
  },
  form: {
    padding: '15px',
    backgroundColor: 'white',
    borderTop: '1px solid #eee',
  },
  inputContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  textarea: {
    flex: 1,
    padding: '10px 15px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    resize: 'none',
    minHeight: '40px',
    maxHeight: '100px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border 0.3s',
    '&:focus': {
      borderColor: '#4caf50',
    },
  },
  button: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: (props) => (props.disabled ? '0.6' : '1'),
    transition: 'background-color 0.3s',
    '&:hover:not(:disabled)': {
      backgroundColor: '#3e8e41',
    },
  },
  sendIcon: {
    width: '20px',
    height: '20px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  '@global': {
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    '@keyframes typingAnimation': {
      '0%, 60%, 100%': { transform: 'translateY(0)' },
      '30%': { transform: 'translateY(-5px)' },
    },
  },
};

export default Chat;