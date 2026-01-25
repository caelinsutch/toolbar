import { useState } from 'react'
import Toolbar from './components/toolbar'

function App() {
  const [showBanner, setShowBanner] = useState(false)
  const [boxWidth, setBoxWidth] = useState(100)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [listItems, setListItems] = useState(['Item 1', 'Item 2', 'Item 3'])
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
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Animation Examples</h2>
        <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
          Use the pause button (⏸) in the toolbar to stop all animations on the page.
        </p>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(255,255,255,0.2)',
              borderTopColor: '#3c82f7',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 0.5rem',
            }} />
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Spinner</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 16,
              height: 16,
              background: '#34c759',
              borderRadius: '50%',
              animation: 'pulse 2s ease-in-out infinite',
              margin: '12px auto 12px',
            }} />
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Pulse</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 20,
              height: 20,
              background: '#ff9500',
              borderRadius: 4,
              animation: 'bounce 1s ease-in-out infinite',
              margin: '0 auto 0.5rem',
            }} />
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Bounce</span>
          </div>
          <div style={{ textAlign: 'center', minWidth: 120 }}>
            <div style={{
              width: 120,
              height: 6,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              overflow: 'hidden',
              margin: '17px auto 17px',
            }}>
              <div style={{
                width: '30%',
                height: '100%',
                background: '#af52de',
                borderRadius: 3,
                animation: 'progress 2s ease-in-out infinite',
              }} />
            </div>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Progress</span>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.7; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
          @keyframes progress {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
          }
        `}</style>
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

      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Layout Shift Testing</h2>
        <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
          Click the layout shift button (rectangles icon) in the toolbar, then use these controls to trigger layout shifts.
          You&apos;ll see the shifts detected and can replay them.
        </p>

        {showBanner && (
          <div style={{
            background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: 'white',
            fontWeight: 500,
          }}>
            This banner just appeared and pushed content down!
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => {
              // Delayed to avoid hadRecentInput filter
              setTimeout(() => setShowBanner((b) => !b), 600)
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            {showBanner ? 'Hide Banner' : 'Inject Banner (Delayed Shift)'}
          </button>

          <button
            type="button"
            onClick={() => {
              setTimeout(() => setBoxWidth((w) => w === 100 ? 200 : 100), 600)
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#4ecdc4',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            Resize Box (Delayed)
          </button>

          <button
            type="button"
            onClick={() => {
              setTimeout(() => setImageLoaded((i) => !i), 600)
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#a855f7',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            {imageLoaded ? 'Remove Image' : 'Load Image (Delayed)'}
          </button>

          <button
            type="button"
            onClick={() => {
              setTimeout(() => {
                setListItems((items) => [
                  `New Item ${items.length + 1}`,
                  ...items,
                ])
              }, 600)
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            Add List Item (Delayed)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.7 }}>Resizable Box</h3>
            <div style={{
              width: boxWidth,
              height: 60,
              background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 500,
              transition: 'none', // No transition so it causes a shift
            }}>
              {boxWidth}px
            </div>
          </div>

          {imageLoaded && (
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.7 }}>Dynamic Image</h3>
              <div style={{
                width: 150,
                height: 100,
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 500,
              }}>
                Image Placeholder
              </div>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.7 }}>Dynamic List</h3>
            <ul style={{
              background: 'rgba(255,255,255,0.05)',
              padding: '0.5rem 1rem 0.5rem 2rem',
              borderRadius: '0.5rem',
              margin: 0,
              minWidth: 150,
            }}>
              {listItems.map((item, i) => (
                <li key={`${item}-${i}`} style={{ padding: '0.25rem 0' }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => {
              setShowBanner(false)
              setBoxWidth(100)
              setImageLoaded(false)
              setListItems(['Item 1', 'Item 2', 'Item 3'])
            }}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Reset All
          </button>
        </div>
      </section>

      <div style={{ height: '50vh' }} />

      <Toolbar />
    </div>
  )
}

export default App
