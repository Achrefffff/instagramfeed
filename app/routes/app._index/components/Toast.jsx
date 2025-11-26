export function Toast({ message, isError, onDismiss }) {
  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10000,
      minWidth: '300px',
      maxWidth: '500px'
    }}>
      <div style={{
        padding: '16px 20px',
        backgroundColor: isError ? '#fef1f1' : '#f1f8f5',
        border: `1px solid ${isError ? '#fead9a' : '#9bc4b5'}`,
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <span style={{ fontSize: '20px' }}>{isError ? '❌' : '✅'}</span>
          <span style={{ 
            color: isError ? '#bf0711' : '#008060',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {message}
          </span>
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: '#6d7175',
            padding: '0',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
