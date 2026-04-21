"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Phone, X, User } from "lucide-react";

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
}

interface ChatBoxProps {
  rideId: number;
  currentUser: string;
  otherUser: string;
  otherNumber?: string;
}

export default function ChatBox({ rideId, currentUser, otherUser, otherNumber }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?rideId=${rideId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, rideId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ride_id: rideId, content: inputValue }),
      });
      if (res.ok) {
        setInputValue("");
        fetchMessages();
      }
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "var(--primary)",
          color: "#000",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          zIndex: 1000,
          border: "none",
          cursor: "pointer"
        }}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "350px",
          height: "500px",
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1001,
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          overflow: "hidden",
          animation: "slideUp 0.3s ease-out"
        }}>
          {/* Header */}
          <div style={{
            padding: "1rem",
            background: "rgba(255, 255, 255, 0.05)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--primary)", display: "flex", justifyContent: "center", alignItems: "center", color: "#000" }}>
                <User size={20} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem" }}>{otherUser}</strong>
                <span style={{ fontSize: "0.7rem", color: "#4ade80" }}>Online</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {otherNumber && (
                <a 
                  href={`tel:${otherNumber}`}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(34, 197, 94, 0.2)",
                    color: "#4ade80",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textDecoration: "none"
                  }}
                >
                  <Phone size={18} />
                </a>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            style={{
              flex: 1,
              padding: "1rem",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem"
            }}
          >
            {messages.length === 0 && (
              <div style={{ textAlign: "center", marginTop: "40%", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Say hello to your {currentUser === otherUser ? "captain" : "passenger"}!
              </div>
            )}
            {messages.map((msg) => (
              <div 
                key={msg.id}
                style={{
                  alignSelf: msg.sender === currentUser ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  background: msg.sender === currentUser ? "var(--primary)" : "rgba(255, 255, 255, 0.08)",
                  color: msg.sender === currentUser ? "#000" : "#fff",
                  padding: "0.6rem 1rem",
                  borderRadius: msg.sender === currentUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                  fontSize: "0.9rem",
                  position: "relative"
                }}
              >
                {msg.content}
                <span style={{
                  display: "block",
                  fontSize: "0.6rem",
                  opacity: 0.5,
                  marginTop: "0.2rem",
                  textAlign: "right"
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>

          {/* Input */}
          <form 
            onSubmit={sendMessage}
            style={{
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.03)",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              gap: "0.5rem"
            }}
          >
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "0.6rem 1rem",
                color: "#fff",
                outline: "none"
              }}
            />
            <button 
              type="submit"
              disabled={loading}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "var(--primary)",
                border: "none",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer"
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
