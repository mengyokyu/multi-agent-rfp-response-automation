"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ChatInterface.module.css";

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setSessionId(`session_${Date.now()}`);
    setMessages([
      {
        role: "assistant",
        message:
          "👋 Hi! I'm your RFP Assistant. I can help you scan tenders from tendersontime.com, analyze products, and generate pricing.\n\nTry: \"Scan for cable RFPs\" or \"Complete workflow for electrical tenders\"",
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      message: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Simulate 2-second processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate response based on user input
    let response = "";
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("scan") || lowerInput.includes("rfp")) {
      response = "🔍 **Scanning for RFPs...**\n\nI found 3 new cable and wire RFPs:\n\n1. **Electrical Infrastructure Project** - Budget: $2.5M\n2. **Fiber Optic Cable Installation** - Budget: $1.8M\n3. **Power Cable Supply** - Budget: $3.2M\n\nWould you like me to analyze any of these tenders?";
    } else if (lowerInput.includes("workflow") || lowerInput.includes("complete")) {
      response = "⚡ **Starting Complete Workflow...**\n\n1. ✅ Scanning for relevant tenders\n2. ✅ Analyzing requirements\n3. ✅ Generating pricing estimates\n4. ✅ Preparing documentation\n\n**Workflow completed successfully!** Ready for review.";
    } else if (lowerInput.includes("status")) {
      response = "📊 **Current System Status**\n\n- **Active Tenders**: 12\n- **Processed**: 8\n- **Pending**: 4\n- **Success Rate**: 85%\n- **Last Sync**: 2 minutes ago\n\nEverything is running smoothly!";
    } else if (lowerInput.includes("pricing") || lowerInput.includes("price")) {
      response = "💰 **Pricing Analysis Complete**\n\n**Selected RFP**: Electrical Infrastructure Project\n\n- **Materials Cost**: $1,200,000\n- **Labor Cost**: $800,000\n- **Equipment**: $300,000\n- **Overhead**: $200,000\n\n**Total Estimated**: $2,500,000\n\n**Profit Margin**: 15%\n\nWould you like a detailed breakdown?";
    } else {
      response = "🤖 **Processing your request...**\n\nI understand you're asking about: \"" + input + "\"\n\nLet me help you with that. Could you provide more specific details about what you'd like to know?";
    }

    const assistantMessage = {
      role: "assistant",
      message: response,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: "🔍 Scan RFPs", message: "Scan for cable and wire RFPs" },
    { label: "⚡ Full Workflow", message: "Complete workflow for electrical tenders" },
    { label: "📊 Show Status", message: "Show me the current status" },
    { label: "💰 Pricing", message: "Calculate pricing for selected RFP" },
  ];

  return (
    <div className={styles.chatInterface}>
      <header className={styles.chatHeader}>
        <div>
          <h1>💬 Chat Assistant</h1>
          <p>AI-powered RFP automation conversation</p>
        </div>
        <div className={styles.sessionInfo}>
          {sessionId && (
            <span className={styles.sessionBadge}>Session: {sessionId.slice(-8)}</span>
          )}
        </div>
      </header>

      <div className={styles.chatMessages}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`${styles.message} ${msg.role === "user" ? styles.user : styles.assistant}`}>
            <div className={styles.messageAvatar}>{msg.role === "user" ? "👤" : "🤖"}</div>
            <div className={styles.messageContent}>
              {msg.role === "assistant" ? (
                <div className={styles.messageText}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.message || ""}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className={styles.messageText}>
                  {(msg.message || "").split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < (msg.message || "").split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              )}
              <div className={styles.messageTime}>
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ""}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <>
            <div className={styles.loading3D}>
              <div className={styles.loading3DCube}></div>
              <div className={styles.loading3DText}>Processing your request...</div>
              <div className={styles.loading3DSubtext}>Analyzing and generating response</div>
            </div>
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.messageAvatar}>🤖</div>
              <div className={styles.messageContent}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.quickActionsBar}>
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            className={styles.quickActionBtn}
            onClick={() => {
              setInput(action.message);
              setTimeout(() => sendMessage(), 100);
            }}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className={styles.chatInputContainer}>
        <textarea
          className={styles.chatInput}
          placeholder="Type your message... (e.g., 'Scan for cable RFPs')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={2}
        />
        <button className={styles.sendBtn} onClick={sendMessage} disabled={loading || !input.trim()} type="button">
          {loading ? "⏳" : "📤"}
        </button>
      </div>
    </div>
  );
}
