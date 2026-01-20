
// pages/ChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import './ChatInterface.css';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initial greeting
    setMessages([{
      role: 'assistant',
      message: "👋 Hi! I'm your RFP Assistant. I can help you scan tenders from tendersontime.com, analyze products, and generate pricing.\n\nTry: \"Scan for cable RFPs\" or \"Complete workflow for electrical tenders\"",
      timestamp: new Date().toISOString()
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      role: 'user',
      message: input,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          session_id: sessionId
        })
      });

      const data = await response.json();

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        message: data.response,
        timestamp: data.timestamp,
        workflow_state: data.workflow_state
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        message: '❌ Error: Failed to process message. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: '🔍 Scan RFPs', message: 'Scan for cable and wire RFPs' },
    { label: '⚡ Full Workflow', message: 'Complete workflow for electrical tenders' },
    { label: '📊 Show Status', message: 'Show me the current status' },
    { label: '💰 Pricing', message: 'Calculate pricing for selected RFP' }
  ];

  return (
    <div className="chat-interface">
      <header className="chat-header">
        <div>
          <h1>💬 Chat Assistant</h1>
          <p>AI-powered RFP automation conversation</p>
        </div>
        <div className="session-info">
          <span className="session-badge">Session: {sessionId.slice(-8)}</span>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">
                {msg.message.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < msg.message.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-bar">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            className="quick-action-btn"
            onClick={() => {
              setInput(action.message);
              setTimeout(() => sendMessage(), 100);
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          placeholder="Type your message... (e.g., 'Scan for cable RFPs')"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={2}
        />
        <button 
          className="send-btn"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          {loading ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;
