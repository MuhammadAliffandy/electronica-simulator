import React from 'react';

export function SettingsModal({ 
  isOpen, 
  onClose, 
  aiMode, 
  setAiMode, 
  localAiProgress, 
  onDownloadLocalAi, 
  isDownloading 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="setting-group">
            <h3>AI Engine</h3>
            <p className="setting-description">
              Choose how ELVO AI processes your circuits. Cloud AI is fast and requires no setup. 
              Local AI runs completely offline on your machine (requires ~1.8GB download).
            </p>
            
            <div className="radio-group">
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="aiMode" 
                  value="cloud" 
                  checked={aiMode === 'cloud'} 
                  onChange={() => setAiMode('cloud')} 
                />
                <span>Cloud AI (Backend API)</span>
              </label>
              
              <label className="radio-label">
                <input 
                  type="radio" 
                  name="aiMode" 
                  value="local" 
                  checked={aiMode === 'local'} 
                  onChange={() => setAiMode('local')} 
                />
                <span>Offline Local AI (WebLLM - Phi-3)</span>
              </label>
            </div>

            {aiMode === 'local' && (
              <div className="local-ai-panel">
                {localAiProgress === 100 ? (
                  <div className="success-msg">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                    Local AI Model is ready to use!
                  </div>
                ) : (
                  <>
                    <button 
                      className="download-btn" 
                      onClick={onDownloadLocalAi}
                      disabled={isDownloading}
                    >
                      {isDownloading ? 'Downloading...' : 'Download Model (1.8 GB)'}
                    </button>
                    {isDownloading && (
                      <div className="progress-container">
                        <div className="progress-bar" style={{ width: \`\${localAiProgress}%\` }}></div>
                        <div className="progress-text">{localAiProgress.toFixed(1)}%</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
