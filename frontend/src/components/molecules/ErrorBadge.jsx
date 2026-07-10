export function ErrorBadge({ data }) {
  if (!data.hasError) return null;
  return (
    <div className="node-error-badge-container">
      <div 
        className="node-error-badge" 
        onClick={(e) => data.onNodeErrorClick && data.onNodeErrorClick(e, data.id)}
      >
        ⚠️
      </div>
      {data.errorMessage && (
        <div className="node-error-tooltip">
          {data.errorMessage}
        </div>
      )}
    </div>
  );
}
