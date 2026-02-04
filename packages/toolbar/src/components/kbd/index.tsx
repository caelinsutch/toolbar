import styles from './kbd.module.scss';

type KbdProps = {
  keys: string[];
  separator?: string;
};

const KEY_SYMBOLS: Record<string, string> = {
  alt: '⌥',
  option: '⌥',
  cmd: '⌘',
  command: '⌘',
  ctrl: '⌃',
  control: '⌃',
  shift: '⇧',
  enter: '↵',
  return: '↵',
  esc: '⎋',
  escape: '⎋',
  tab: '⇥',
  backspace: '⌫',
  delete: '⌦',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  space: '␣',
};

function formatKey(key: string): string {
  const lower = key.toLowerCase();
  return KEY_SYMBOLS[lower] || key.toUpperCase();
}

export function Kbd({ keys, separator = '' }: KbdProps) {
  return (
    <span className={styles.kbd}>
      {keys.map((key, i) => (
        <span key={key}>
          {i > 0 && separator && <span className={styles.separator}>{separator}</span>}
          <kbd className={styles.key}>{formatKey(key)}</kbd>
        </span>
      ))}
    </span>
  );
}

export default Kbd;
