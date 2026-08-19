import React, { useState, useEffect, useRef } from 'react';

// Typewriter hook — streams text character by character
function useTypewriter(text, speed = 6, enabled = true) {
  const [displayed, setDisplayed] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      return;
    }
    setDisplayed('');
    let i = 0;
    const tick = () => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
        ref.current = setTimeout(tick, speed);
      }
    };
    ref.current = setTimeout(tick, speed);
    return () => clearTimeout(ref.current);
  }, [text, speed, enabled]);

  return displayed;
}

// Single message bubble with streaming support
function MessageBubble({ msg, isLatest }) {
  const displayed = useTypewriter(
    msg.content,
    6,
    isLatest && msg.role === 'assistant'
  );
  const showCursor = isLatest && msg.role === 'assistant' && displayed.length < msg.content.length;
  const isUser = msg.role === 'user';
  const isSystem = msg.isSystem;

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'flex-end' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-cyan), #00b8d9)',
          color: '#000',
          padding: '10px 14px',
          borderRadius: '16px 16px 4px 16px',
          maxWidth: '80%',
          fontSize: '0.85rem',
          lineHeight: '1.5',
          fontWeight: '500',
          boxShadow: '0 2px 8px rgba(0,212,255,0.2)',
        }}>
          {msg.content}
        </div>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'var(--accent-cyan)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#000">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', alignItems: 'flex-start' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, var(--accent-cyan))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: '2px',
        boxShadow: '0 0 8px rgba(124,58,237,0.4)',
      }}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
          <path d="M12 2a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v2h2v4h-2v2a2 2 0 0 1-2 2h-3v2a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2H5a2 2 0 0 1-2-2v-2H1v-4h2V8a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2h2zM7 14v4h10v-4H7zm3-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
        </svg>
      </div>
      <div style={{
        background: isSystem
          ? 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(0,212,255,0.06))'
          : 'var(--bg-card)',
        border: isSystem ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.06)',
        color: 'var(--text-main)',
        padding: '12px 14px',
        borderRadius: '4px 16px 16px 16px',
        maxWidth: '85%',
        fontSize: '0.83rem',
        lineHeight: '1.6',
        boxShadow: isSystem ? '0 2px 12px rgba(124,58,237,0.1)' : '0 1px 4px rgba(0,0,0,0.2)',
      }}>
        {isSystem && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            marginBottom: '8px', paddingBottom: '8px',
            borderBottom: '1px solid rgba(124,58,237,0.2)',
          }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="var(--accent-cyan)">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              Simulation Result
            </span>
          </div>
        )}
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {isLatest && msg.role === 'assistant' ? displayed : msg.content}
          {showCursor && (
            <span style={{
              display: 'inline-block', width: '2px', height: '1em',
              background: 'var(--accent-cyan)', marginLeft: '1px',
              animation: 'elvoCursorBlink 0.7s step-end infinite',
              verticalAlign: 'text-bottom',
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

// Animated typing indicator
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, var(--accent-cyan))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, animation: 'elvoPulse 2s ease-in-out infinite',
      }}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
          <path d="M12 2a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v2h2v4h-2v2a2 2 0 0 1-2 2h-3v2a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2H5a2 2 0 0 1-2-2v-2H1v-4h2V8a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2h2zM7 14v4h10v-4H7zm3-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
        </svg>
      </div>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 16px', borderRadius: '4px 16px 16px 16px',
        display: 'flex', alignItems: 'center', gap: '5px',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'var(--accent-cyan)',
            animation: `elvoBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// Simulation loading state
function SimulatingState() {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, var(--accent-cyan))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
          <path d="M12 2a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v2h2v4h-2v2a2 2 0 0 1-2 2h-3v2a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2H5a2 2 0 0 1-2-2v-2H1v-4h2V8a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2h2zM7 14v4h10v-4H7zm3-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
        </svg>
      </div>
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(0,212,255,0.06))',
        border: '1px solid rgba(124,58,237,0.3)',
        padding: '14px 18px', borderRadius: '4px 16px 16px 16px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '16px', height: '16px',
            border: '2px solid rgba(0,212,255,0.2)',
            borderTop: '2px solid var(--accent-cyan)',
            borderRadius: '50%',
            animation: 'elvoSpin 0.8s linear infinite',
            flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: '600', letterSpacing: '0.06em' }}>
            RUNNING MNA SOLVER...
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {['Building circuit graph', 'Solving node voltages', 'Computing currents', 'Generating AI insights'].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '4px', height: '4px', borderRadius: '50%',
                background: 'var(--accent-cyan)',
                animation: `elvoBounce 1.5s ease-in-out ${i * 0.3}s infinite`,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TutorPanel({ messages, isChatLoading, isSimulating, onSendMessage, chatInput, setChatInput }) {
  const messagesEndRef = useRef(null);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading, isSimulating]);

  const canSend = chatInput.trim() && !isChatLoading && !isSimulating;

  return (
    <div className="right-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="tutor-header" style={{ flexShrink: 0 }}>
        <div className="tutor-avatar" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #7c3aed, var(--accent-cyan))',
          borderRadius: '50%', boxShadow: '0 0 12px rgba(124,58,237,0.4)',
        }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M12 2a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v2h2v4h-2v2a2 2 0 0 1-2 2h-3v2a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2H5a2 2 0 0 1-2-2v-2H1v-4h2V8a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2h2zM7 14v4h10v-4H7zm3-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
          </svg>
        </div>
        <div>
          <div className="tutor-title">ELVO AI</div>
          <div className="tutor-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: isSimulating ? '#f59e0b' : isChatLoading ? '#f59e0b' : '#22c55e',
              display: 'inline-block',
              animation: (isSimulating || isChatLoading) ? 'elvoPulse 1s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }} />
            {isSimulating ? 'Simulating...' : isChatLoading ? 'Thinking...' : 'Active Instructor'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="tutor-content" style={{
        display: 'flex', flexDirection: 'column',
        padding: '16px', gap: '16px',
        overflowY: 'auto', flex: 1,
      }}>
        {messages.map((msg, index) => (
          <MessageBubble key={index} msg={msg} isLatest={index === messages.length - 1} />
        ))}
        {isSimulating && <SimulatingState />}
        {isChatLoading && !isSimulating && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'var(--bg-panel)', flexShrink: 0,
      }}>
        <form
          onSubmit={(e) => { e.preventDefault(); if (canSend) onSendMessage(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: inputFocused ? 'rgba(0,212,255,0.05)' : 'var(--bg-base)',
            border: inputFocused ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', padding: '10px 12px',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="text"
            placeholder={isSimulating ? 'Simulating circuit...' : isChatLoading ? 'ELVO is thinking...' : 'Ask ELVO anything...'}
            disabled={isChatLoading || isSimulating}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: 'var(--text-main)', outline: 'none',
              fontSize: '0.85rem', lineHeight: '1.4',
              opacity: (isChatLoading || isSimulating) ? 0.5 : 1,
            }}
          />
          <button
            type="submit"
            disabled={!canSend}
            style={{
              background: canSend
                ? 'linear-gradient(135deg, #7c3aed, var(--accent-cyan))'
                : 'rgba(255,255,255,0.08)',
              border: 'none', cursor: canSend ? 'pointer' : 'not-allowed',
              color: canSend ? 'white' : 'var(--text-dim)',
              width: '32px', height: '32px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
              transform: canSend ? 'scale(1)' : 'scale(0.92)',
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
        <div style={{
          textAlign: 'center', fontSize: '0.62rem', color: 'var(--text-dim)',
          marginTop: '6px', opacity: 0.5,
        }}>
          ELVO AI can make mistakes. Always verify results.
        </div>
      </div>

      <style>{`
        @keyframes elvoBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes elvoSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes elvoPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes elvoCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
