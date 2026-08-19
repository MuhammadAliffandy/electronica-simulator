import React, { useState } from 'react';

export function TutorPanel({ messages, isChatLoading, onSendMessage, chatInput, setChatInput }) {
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="right-panel">
      <div className="tutor-header">
        <div className="tutor-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v2h2v4h-2v2a2 2 0 0 1-2 2h-3v2a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2H5a2 2 0 0 1-2-2v-2H1v-4h2V8a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2h2zM7 14v4h10v-4H7zm3-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
          </svg>
        </div>
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
                <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm-1-19V1h2v2h-2zm-5.1 4.9L4.5 4.5l1.4-1.4 1.4 1.4-1.4 1.4zm12.2 0l-1.4-1.4 1.4-1.4 1.4 1.4-1.4 1.4zM12 5c-3.3 0-6 2.7-6 6 0 2.2 1.2 4.2 3 5.3v2.7h6v-2.7c1.8-1.1 3-3.1 3-5.3 0-3.3-2.7-6-6-6zm0 10.3l-1.5 1.5H10.5v-1.5L9 13.8V12c0-1.7 1.3-3 3-3s3 1.3 3 3v1.8l-1.5 1.5zM23 11h-2v2h2v-2zM3 11H1v2h2v-2z" />
                  </svg>
                  SIMULATION RESULT
                </strong><br/>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>
                  {msg.content}
                </div>
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
