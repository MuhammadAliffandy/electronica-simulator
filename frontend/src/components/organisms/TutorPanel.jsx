import React, { useState } from 'react';

export function TutorPanel({ messages, isChatLoading, onSendMessage, chatInput, setChatInput }) {
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="right-panel">
      <div className="tutor-header">
        <div className="tutor-avatar">🤖</div>
        <div>
          <div className="tutor-title">ELVO AI</div>
          <div className="tutor-subtitle">Active Instructor</div>
        </div>
      </div>

      <div className="tutor-content" style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflowY: 'auto', flex: 1 }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: msg.role === 'user' ? 'var(--accent-cyan)' : 'var(--bg-card)',
            color: msg.role === 'user' ? '#000' : 'var(--text-main)',
            padding: '8px 12px',
            borderRadius: '8px',
            maxWidth: '85%',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            {msg.role === 'assistant' && msg.isSystem ? (
              <div style={{ color: 'var(--accent-yellow)' }}>
                <strong>💡 SIMULATION RESULT</strong><br/>
                {msg.content}
              </div>
            ) : (
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            )}
          </div>
        ))}
        {isChatLoading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-dim)', fontSize: '0.8rem' }}>ELVO AI is typing...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="tutor-input-area" style={{ padding: '16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-panel)' }}>
        <form 
          className="tutor-input-box" 
          onSubmit={(e) => { e.preventDefault(); onSendMessage(); }}
          style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-base)', borderRadius: '4px', padding: '8px 12px' }}
        >
          <input 
            type="text" 
            placeholder="Ask ELVO..." 
            disabled={isChatLoading} 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }}
          />
          <button type="submit" disabled={isChatLoading || !chatInput.trim()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-cyan)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
