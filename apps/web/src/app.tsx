import { Toolbar } from 'cloudflare-toolbar';
import { type ReactNode, useState } from 'react';

function Header() {
  return (
    <header>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Cloudflare Toolbar Demo</h1>
      <p style={{ fontSize: '1.125rem', opacity: 0.7 }}>
        Inspired by the clean animations and design of agentation
      </p>
    </header>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h2>
      {children}
    </section>
  );
}

function FeatureList() {
  return (
    <ul style={{ lineHeight: 1.8 }}>
      <li>🎨 Clean, minimal floating toolbar design</li>
      <li>✨ Smooth entrance animations with scale and rotation</li>
      <li>🎯 Draggable positioning with constrained boundaries</li>
      <li>🔄 Smooth expand/collapse transitions</li>
      <li>💡 Tooltip hints with delayed appearance</li>
      <li>🎭 Blur effects on state transitions</li>
    </ul>
  );
}

function Button({
  children,
  variant = 'primary',
  onClick,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'purple' | 'ghost';
  onClick?: () => void;
}) {
  const baseStyles = {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    transition: 'transform 0.15s ease',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: '#3c82f7', color: 'white' },
    secondary: {
      background: 'transparent',
      color: 'rgba(255, 255, 255, 0.8)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    },
    danger: { background: '#ff6b6b', color: 'white' },
    success: { background: '#4ecdc4', color: 'white' },
    warning: { background: '#f59e0b', color: 'white' },
    purple: { background: '#a855f7', color: 'white' },
    ghost: {
      padding: '0.5rem 1rem',
      background: 'rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.7)',
      border: '1px solid rgba(255,255,255,0.2)',
      fontSize: '0.875rem',
    },
  };

  return (
    <button
      type="button"
      style={{ ...baseStyles, ...variantStyles[variant] }}
      onClick={onClick}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div>
      {title && <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', opacity: 0.7 }}>{title}</h3>}
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(255,255,255,0.2)',
          borderTopColor: '#3c82f7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 0.5rem',
        }}
      />
      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Spinner</span>
    </div>
  );
}

function PulseIndicator() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 16,
          height: 16,
          background: '#34c759',
          borderRadius: '50%',
          animation: 'pulse 2s ease-in-out infinite',
          margin: '12px auto 12px',
        }}
      />
      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Pulse</span>
    </div>
  );
}

function BouncingBox() {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: 20,
          height: 20,
          background: '#ff9500',
          borderRadius: 4,
          animation: 'bounce 1s ease-in-out infinite',
          margin: '0 auto 0.5rem',
        }}
      />
      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Bounce</span>
    </div>
  );
}

function ProgressBar() {
  return (
    <div style={{ textAlign: 'center', minWidth: 120 }}>
      <div
        style={{
          width: 120,
          height: 6,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
          margin: '17px auto 17px',
        }}
      >
        <div
          style={{
            width: '30%',
            height: '100%',
            background: '#af52de',
            borderRadius: 3,
            animation: 'progress 2s ease-in-out infinite',
          }}
        />
      </div>
      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Progress</span>
    </div>
  );
}

function AnimationExamples() {
  return (
    <>
      <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
        Use the pause button in the toolbar to stop all animations on the page.
      </p>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Spinner />
        <PulseIndicator />
        <BouncingBox />
        <ProgressBar />
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
    </>
  );
}

function ResizableBox({ width }: { width: number }) {
  return (
    <Card title="Resizable Box">
      <div
        style={{
          width,
          height: 60,
          background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 500,
          transition: 'none',
        }}
      >
        {width}px
      </div>
    </Card>
  );
}

function DynamicImage() {
  return (
    <Card title="Dynamic Image">
      <div
        style={{
          width: 150,
          height: 100,
          background: 'linear-gradient(135deg, #a855f7, #6366f1)',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 500,
        }}
      >
        Image Placeholder
      </div>
    </Card>
  );
}

function DynamicList({ items }: { items: string[] }) {
  return (
    <Card title="Dynamic List">
      <ul
        style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '0.5rem 1rem 0.5rem 2rem',
          borderRadius: '0.5rem',
          margin: 0,
          minWidth: 150,
        }}
      >
        {items.map((item) => (
          <li key={item} style={{ padding: '0.25rem 0' }}>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AlertBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        color: 'white',
        fontWeight: 500,
      }}
    >
      {message}
    </div>
  );
}

function LayoutShiftDemo() {
  const [showBanner, setShowBanner] = useState(false);
  const [boxWidth, setBoxWidth] = useState(100);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [listItems, setListItems] = useState(['Item 1', 'Item 2', 'Item 3']);

  const resetAll = () => {
    setShowBanner(false);
    setBoxWidth(100);
    setImageLoaded(false);
    setListItems(['Item 1', 'Item 2', 'Item 3']);
  };

  return (
    <>
      <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
        Click the layout shift button (rectangles icon) in the toolbar, then use these controls to
        trigger layout shifts. You&apos;ll see the shifts detected and can replay them.
      </p>

      {showBanner && <AlertBanner message="This banner just appeared and pushed content down!" />}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <Button variant="danger" onClick={() => setTimeout(() => setShowBanner((b) => !b), 600)}>
          {showBanner ? 'Hide Banner' : 'Inject Banner (Delayed Shift)'}
        </Button>

        <Button
          variant="success"
          onClick={() => setTimeout(() => setBoxWidth((w) => (w === 100 ? 200 : 100)), 600)}
        >
          Resize Box (Delayed)
        </Button>

        <Button variant="purple" onClick={() => setTimeout(() => setImageLoaded((i) => !i), 600)}>
          {imageLoaded ? 'Remove Image' : 'Load Image (Delayed)'}
        </Button>

        <Button
          variant="warning"
          onClick={() =>
            setTimeout(() => {
              setListItems((items) => [`New Item ${items.length + 1}`, ...items]);
            }, 600)
          }
        >
          Add List Item (Delayed)
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <ResizableBox width={boxWidth} />
        {imageLoaded && <DynamicImage />}
        <DynamicList items={listItems} />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Button variant="ghost" onClick={resetAll}>
          Reset All
        </Button>
      </div>
    </>
  );
}

function LowContrastText() {
  return (
    <Card title="Low Contrast Text">
      <p
        style={{
          color: '#777777',
          backgroundColor: '#888888',
          padding: '0.5rem',
          borderRadius: '0.25rem',
        }}
      >
        This text has very low contrast (1.13:1 ratio) and fails WCAG AA guidelines (needs 4.5:1).
      </p>
      <p
        style={{
          color: '#999',
          backgroundColor: '#aaa',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          marginTop: '0.5rem',
        }}
      >
        Another low contrast example - light gray on slightly lighter gray.
      </p>
    </Card>
  );
}

function ImageWithoutAlt() {
  return (
    <Card title="Image Without Alt Text">
      {/* biome-ignore lint/a11y/useAltText: intentional a11y violation for demo */}
      <img
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60' viewBox='0 0 100 60'%3E%3Crect fill='%234ecdc4' width='100' height='60'/%3E%3Ctext x='50' y='35' fill='white' text-anchor='middle' font-size='12'%3ENo Alt%3C/text%3E%3C/svg%3E"
        style={{ borderRadius: '0.25rem' }}
      />
    </Card>
  );
}

function BadLinks() {
  return (
    <Card title="Links Without Proper Href">
      <div style={{ display: 'flex', gap: '1rem' }}>
        {/* biome-ignore lint/a11y/useValidAnchor: intentional a11y violation for demo */}
        <a style={{ color: '#3c82f7', cursor: 'pointer' }}>Link without href</a>
        {/* biome-ignore lint/a11y/useValidAnchor: intentional a11y violation for demo */}
        <a href="#" style={{ color: '#3c82f7' }}>
          Empty hash link
        </a>
      </div>
    </Card>
  );
}

function UnlabeledInputs() {
  return (
    <Card title="Form Inputs Without Labels">
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="No label input"
          style={{
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '0.25rem',
            color: 'white',
          }}
        />
        <select
          style={{
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '0.25rem',
            color: 'white',
          }}
        >
          <option>Select without label</option>
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
      </div>
    </Card>
  );
}

function IconButton({ color, icon }: { color: string; icon: 'plus' | 'close' }) {
  return (
    <button
      type="button"
      style={{
        width: 40,
        height: 40,
        background: color,
        border: 'none',
        borderRadius: '0.25rem',
        cursor: 'pointer',
      }}
    >
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: intentional a11y violation for demo */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
        {icon === 'plus' ? (
          <path d="M10 3v14M3 10h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M5 5l10 10M15 5L5 15" stroke="white" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}

function ButtonsWithoutNames() {
  return (
    <Card title="Buttons Without Accessible Names">
      <div style={{ display: 'flex', gap: '1rem' }}>
        <IconButton color="#3c82f7" icon="plus" />
        <IconButton color="#ff6b6b" icon="close" />
      </div>
    </Card>
  );
}

function InteractiveIssues() {
  return (
    <Card title="Interactive Element Issues">
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/useFocusableInteractive lint/a11y/useSemanticElements: intentional a11y violation for demo */}
        <div
          role="button"
          onClick={() => {}}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#f59e0b',
            color: 'white',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'inline-block',
            fontWeight: 500,
          }}
        >
          role=button, no keyboard
        </div>
        <div
          // biome-ignore lint/a11y/noNoninteractiveTabindex: intentional a11y violation for demo
          tabIndex={0}
          onClick={() => {}}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#8b5cf6',
            color: 'white',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'inline-block',
            fontWeight: 500,
          }}
        >
          tabIndex=0, no role
        </div>
      </div>
    </Card>
  );
}

function AccessibilityDemo() {
  return (
    <>
      <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>
        Click the accessibility button (person icon) in the toolbar, then click &quot;Run
        Audit&quot; to check this page. The elements below have intentional accessibility issues for
        testing purposes.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <LowContrastText />
        <ImageWithoutAlt />
        <BadLinks />
        <UnlabeledInputs />
        <ButtonsWithoutNames />
        <InteractiveIssues />
      </div>
    </>
  );
}

function NavBar() {
  return (
    <nav
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '2rem',
      }}
    >
      <NavLink href="#features">Features</NavLink>
      <NavLink href="#animations">Animations</NavLink>
      <NavLink href="#layout-shift">Layout Shift</NavLink>
      <NavLink href="#accessibility">Accessibility</NavLink>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      style={{
        color: 'rgba(255,255,255,0.8)',
        textDecoration: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '0.25rem',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </a>
  );
}

function App() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Header />
      <NavBar />

      <Section title="Features">
        <FeatureList />
      </Section>

      <Section title="Try It Out">
        <p style={{ opacity: 0.8, marginBottom: '1rem' }}>
          Look for the floating toolbar in the bottom-right corner. You can:
        </p>
        <ol style={{ lineHeight: 1.8, opacity: 0.8 }}>
          <li>Click the star icon to expand the toolbar</li>
          <li>Drag it anywhere on the screen</li>
          <li>Hover over buttons to see tooltips</li>
          <li>Click the close button (X) to collapse it</li>
        </ol>
      </Section>

      <Section title="Animation Examples">
        <AnimationExamples />
      </Section>

      <Section title="Sample Content">
        <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary Action</Button>
          <Button variant="secondary">Secondary Action</Button>
        </div>
      </Section>

      <Section title="Layout Shift Testing">
        <LayoutShiftDemo />
      </Section>

      <Section title="Accessibility Testing">
        <AccessibilityDemo />
      </Section>

      <div style={{ height: '50vh' }} />

      <Toolbar />
    </div>
  );
}

export default App;
