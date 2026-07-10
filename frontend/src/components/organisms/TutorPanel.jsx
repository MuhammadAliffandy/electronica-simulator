export function TutorPanel({ response, isLoading, t, onSuggestionClick }) {
  if (isLoading) {
    return (
      <div className="tutor-panel">
        <div className="tutor-header">
          <div className="tutor-avatar">⚡</div>
          <div>
            <div className="tutor-name">ELVO AI</div>
            <div className="tutor-role">{t.tutorRole}</div>
          </div>
        </div>
        <div className="tutor-body">
          <div className="response-card">
            <div className="card-header">
              <span className="card-icon">🔄</span>
              <span className="card-title">{t.analyzing}</span>
            </div>
            <div className="card-content">
              <div className="loading-shimmer" style={{ width: "90%" }}></div>
              <div className="loading-shimmer" style={{ width: "75%" }}></div>
              <div className="loading-shimmer" style={{ width: "60%" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="tutor-panel">
        <div className="tutor-header">
          <div className="tutor-avatar">⚡</div>
          <div>
            <div className="tutor-name">ELVO AI</div>
            <div className="tutor-role">{t.tutorRole}</div>
          </div>
        </div>
        <div className="tutor-body">
          <div className="welcome-placeholder">
            <div className="welcome-emoji">🔬</div>
            <div className="welcome-title">{t.readyTitle}</div>
            <div className="welcome-text">
              {t.readyText}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tutor-panel">
      <div className="tutor-header">
        <div className="tutor-avatar">⚡</div>
        <div>
          <div className="tutor-name">ELVO AI</div>
          <div className="tutor-role">{t.tutorRole}</div>
        </div>
      </div>
      <div className="tutor-body">
        {/* Analysis Log Card */}
        {response.analysis_log && response.analysis_log.length > 0 && (
          <div className="response-card analysis-card" style={{ animationDelay: "0.1s" }}>
            <div className="card-header">
              <span className="card-icon">📊</span>
              <span className="card-title">{t.analysisLog}</span>
            </div>
            <div className="log-list">
              {response.analysis_log.map((log, i) => (
                <div key={i} className="log-item">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights Card */}
        {response.ai_insights && (
          <div className="response-card insight-card" style={{ animationDelay: "0.2s" }}>
            <div className="card-header">
              <span className="card-icon">🧠</span>
              <span className="card-title">{t.aiInsights}</span>
            </div>
            <div className="card-content">
              {/* Greeting */}
              <div className="insight-section">
                <div className="insight-label">{t.greeting}</div>
                <div className="insight-text">
                  {response.ai_insights.greeting}
                </div>
              </div>

              {/* Explanation */}
              <div className="insight-section">
                <div className="insight-label">{t.explanation}</div>
                <div className="insight-text">
                  {response.ai_insights.explanation}
                </div>
              </div>

              {/* Hint */}
              <div className="insight-section">
                <div className="insight-label">{t.hint}</div>
                <div className="insight-text">{response.ai_insights.hint}</div>
              </div>

              {/* Suggestion Tip */}
              {response.ai_insights.suggestion_button_text && (
                <div className="suggestion-tip" style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '8px', color: '#60a5fa', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem' }}>💡</span>
                  <span>{response.ai_insights.suggestion_button_text}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Log Card */}
        {response.error_log && response.error_log.length > 0 && (
          <div className="response-card error-card" style={{ animationDelay: "0.3s" }}>
            <div className="card-header">
              <span className="card-icon">⚠️</span>
              <span className="card-title">{t.errorLog}</span>
            </div>
            <div className="log-list">
              {response.error_log.map((err, i) => (
                <div key={i} className="log-item" style={{ color: "#f87171" }}>
                  {err}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
