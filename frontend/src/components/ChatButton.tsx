import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import './ChatButton.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatButton: React.FC = () => {
  const { player } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'world' | 'province' | 'roleplay' | 'gm'>('world');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    world: [],
    province: [],
    roleplay: [],
    gm: []
  });
  const [input, setInput] = useState('');
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('chat-header')) {
      setDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  React.useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, dragOffset]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages({
      ...messages,
      [selectedChannel]: [...messages[selectedChannel], newMessage]
    });
    setInput('');

    // TODO: Send to backend API
    try {
      const response = await fetch(`http://localhost:5000/api/chat/${selectedChannel}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: input })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => ({
          ...prev,
          [selectedChannel]: [...prev[selectedChannel], {
            role: 'assistant',
            content: data.message,
            timestamp: new Date()
          }]
        }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getChannelIcon = () => {
    switch (selectedChannel) {
      case 'world': return '🌍';
      case 'province': return '🏛️';
      case 'roleplay': return '🎭';
      case 'gm': return '👑';
    }
  };

  const getChannelName = () => {
    switch (selectedChannel) {
      case 'world': return 'World Chat';
      case 'province': return 'Province Chat';
      case 'roleplay': return 'Roleplay Chat';
      case 'gm': return 'GM Only';
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button 
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Open Chat"
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="chat-window"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`
          }}
        >
          <div 
            className="chat-header"
            onMouseDown={handleMouseDown}
          >
            <span className="chat-header-icon">{getChannelIcon()}</span>
            <span className="chat-header-title">{getChannelName()}</span>
            <button 
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="chat-channels">
            <button
              className={`channel-btn ${selectedChannel === 'world' ? 'active' : ''}`}
              onClick={() => setSelectedChannel('world')}
            >
              🌍 World
            </button>
            <button
              className={`channel-btn ${selectedChannel === 'province' ? 'active' : ''}`}
              onClick={() => setSelectedChannel('province')}
            >
              🏛️ Province
            </button>
            <button
              className={`channel-btn ${selectedChannel === 'roleplay' ? 'active' : ''}`}
              onClick={() => setSelectedChannel('roleplay')}
            >
              🎭 Roleplay
            </button>
            {player?.isGameMaster && (
              <button
                className={`channel-btn gm-channel ${selectedChannel === 'gm' ? 'active' : ''}`}
                onClick={() => setSelectedChannel('gm')}
              >
                👑 GM Only
              </button>
            )}
          </div>

          <div className="chat-messages">
            {messages[selectedChannel].length === 0 ? (
              <div className="chat-empty">
                No messages yet. Start chatting!
              </div>
            ) : (
              messages[selectedChannel].map((msg, idx) => (
                <div key={idx} className={`chat-msg ${msg.role}`}>
                  <div className="msg-content">{msg.content}</div>
                  <div className="msg-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${getChannelName().toLowerCase()}...`}
              className="chat-input"
            />
            <button type="submit" className="chat-send-btn">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatButton;
