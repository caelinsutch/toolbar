import Toolbar from './components/Toolbar'

function App() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Cloudflare Toolbar Demo</h1>
        <p style={{ fontSize: '1.125rem', opacity: 0.7 }}>
          Inspired by the clean animations and design of agentation
        </p>
      </header>
      
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Features</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>🎨 Clean, minimal floating toolbar design</li>
          <li>✨ Smooth entrance animations with scale and rotation</li>
          <li>🎯 Draggable positioning with constrained boundaries</li>
          <li>🔄 Smooth expand/collapse transitions</li>
          <li>💡 Tooltip hints with delayed appearance</li>
          <li>🎭 Blur effects on state transitions</li>
        </ul>
      </section>

      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Try It Out</h2>
        <p style={{ opacity: 0.8, marginBottom: '1rem' }}>
          Look for the floating toolbar in the bottom-right corner. You can:
        </p>
        <ol style={{ lineHeight: 1.8, opacity: 0.8 }}>
          <li>Click the star icon to expand the toolbar</li>
          <li>Drag it anywhere on the screen</li>
          <li>Hover over buttons to see tooltips</li>
          <li>Click the close button (X) to collapse it</li>
        </ol>
      </section>

      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Sample Content</h2>
        <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button type="button" style={{ 
            padding: '0.75rem 1.5rem', 
            background: '#3c82f7',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 500,
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Primary Action
          </button>
          <button type="button" style={{ 
            padding: '0.75rem 1.5rem', 
            background: 'transparent',
            color: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 500,
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Secondary Action
          </button>
        </div>
      </section>

      <div style={{ height: '50vh' }} />

      <Toolbar />
    </div>
  )
}

export default App
