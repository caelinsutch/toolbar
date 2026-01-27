import { getReactComponentHierarchy, getReactComponentName } from './react-fiber';

export function getElementPath(target: HTMLElement, maxDepth = 4): string {
  const parts: string[] = [];
  let current: HTMLElement | null = target;
  let depth = 0;

  while (current && depth < maxDepth) {
    const tag = current.tagName.toLowerCase();

    if (tag === 'html' || tag === 'body') break;

    let identifier = tag;
    if (current.id) {
      identifier = `#${current.id}`;
    } else if (current.className && typeof current.className === 'string') {
      const meaningfulClass = current.className
        .split(/\s+/)
        .find((c: string) => c.length > 2 && !c.match(/^[a-z]{1,2}$/) && !c.match(/[A-Z0-9]{5,}/));
      if (meaningfulClass) {
        identifier = `.${meaningfulClass.split('_')[0]}`;
      }
    }

    parts.unshift(identifier);
    current = current.parentElement;
    depth++;
  }

  return parts.join(' > ');
}

export function identifyElement(target: HTMLElement): {
  name: string;
  path: string;
  reactComponent: string | null;
  reactHierarchy: string[];
} {
  const path = getElementPath(target);
  const reactComponent = getReactComponentName(target);
  const reactHierarchy = getReactComponentHierarchy(target, 5);

  if (target.dataset.element) {
    return { name: target.dataset.element, path, reactComponent, reactHierarchy };
  }

  const tag = target.tagName.toLowerCase();

  if (['path', 'circle', 'rect', 'line', 'g'].includes(tag)) {
    const svg = target.closest('svg');
    if (svg) {
      const parent = svg.parentElement;
      if (parent) {
        const parentResult = identifyElement(parent);
        return {
          name: `graphic in ${parentResult.name}`,
          path,
          reactComponent: reactComponent || parentResult.reactComponent,
          reactHierarchy: reactHierarchy.length > 0 ? reactHierarchy : parentResult.reactHierarchy,
        };
      }
    }
    return { name: 'graphic element', path, reactComponent, reactHierarchy };
  }
  if (tag === 'svg') {
    const parent = target.parentElement;
    if (parent?.tagName.toLowerCase() === 'button') {
      const btnText = parent.textContent?.trim();
      return {
        name: btnText ? `icon in "${btnText}" button` : 'button icon',
        path,
        reactComponent,
        reactHierarchy,
      };
    }
    return { name: 'icon', path, reactComponent, reactHierarchy };
  }

  if (tag === 'button') {
    const text = target.textContent?.trim();
    const ariaLabel = target.getAttribute('aria-label');
    if (ariaLabel) return { name: `button [${ariaLabel}]`, path, reactComponent, reactHierarchy };
    return {
      name: text ? `button "${text.slice(0, 25)}"` : 'button',
      path,
      reactComponent,
      reactHierarchy,
    };
  }
  if (tag === 'a') {
    const text = target.textContent?.trim();
    const href = target.getAttribute('href');
    if (text) return { name: `link "${text.slice(0, 25)}"`, path, reactComponent, reactHierarchy };
    if (href) return { name: `link to ${href.slice(0, 30)}`, path, reactComponent, reactHierarchy };
    return { name: 'link', path, reactComponent, reactHierarchy };
  }
  if (tag === 'input') {
    const type = target.getAttribute('type') || 'text';
    const placeholder = target.getAttribute('placeholder');
    const name = target.getAttribute('name');
    if (placeholder)
      return { name: `input "${placeholder}"`, path, reactComponent, reactHierarchy };
    if (name) return { name: `input [${name}]`, path, reactComponent, reactHierarchy };
    return { name: `${type} input`, path, reactComponent, reactHierarchy };
  }

  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    const text = target.textContent?.trim();
    return {
      name: text ? `${tag} "${text.slice(0, 35)}"` : tag,
      path,
      reactComponent,
      reactHierarchy,
    };
  }

  if (tag === 'p') {
    const text = target.textContent?.trim();
    if (text)
      return {
        name: `paragraph: "${text.slice(0, 40)}${text.length > 40 ? '...' : ''}"`,
        path,
        reactComponent,
        reactHierarchy,
      };
    return { name: 'paragraph', path, reactComponent, reactHierarchy };
  }
  if (tag === 'span' || tag === 'label') {
    const text = target.textContent?.trim();
    if (text && text.length < 40)
      return { name: `"${text}"`, path, reactComponent, reactHierarchy };
    return { name: tag, path, reactComponent, reactHierarchy };
  }
  if (tag === 'li') {
    const text = target.textContent?.trim();
    if (text && text.length < 40)
      return { name: `list item: "${text.slice(0, 35)}"`, path, reactComponent, reactHierarchy };
    return { name: 'list item', path, reactComponent, reactHierarchy };
  }

  if (tag === 'img') {
    const alt = target.getAttribute('alt');
    return {
      name: alt ? `image "${alt.slice(0, 30)}"` : 'image',
      path,
      reactComponent,
      reactHierarchy,
    };
  }
  if (tag === 'video') return { name: 'video', path, reactComponent, reactHierarchy };

  if (['div', 'section', 'article', 'nav', 'header', 'footer', 'aside', 'main'].includes(tag)) {
    const className = target.className;
    const role = target.getAttribute('role');
    const ariaLabel = target.getAttribute('aria-label');

    if (ariaLabel) return { name: `${tag} [${ariaLabel}]`, path, reactComponent, reactHierarchy };
    if (role) return { name: `${role}`, path, reactComponent, reactHierarchy };

    if (typeof className === 'string' && className) {
      const words = className
        .split(/[\s_-]+/)
        .map((c) => c.replace(/[A-Z0-9]{5,}.*$/, ''))
        .filter((c) => c.length > 2 && !/^[a-z]{1,2}$/.test(c))
        .slice(0, 2);
      if (words.length > 0) return { name: words.join(' '), path, reactComponent, reactHierarchy };
    }

    return { name: tag === 'div' ? 'container' : tag, path, reactComponent, reactHierarchy };
  }

  return { name: tag, path, reactComponent, reactHierarchy };
}

export function getNearbyText(element: HTMLElement): string {
  const texts: string[] = [];

  const ownText = element.textContent?.trim();
  if (ownText && ownText.length < 100) {
    texts.push(ownText);
  }

  const prev = element.previousElementSibling;
  if (prev) {
    const prevText = prev.textContent?.trim();
    if (prevText && prevText.length < 50) {
      texts.unshift(`[before: "${prevText.slice(0, 40)}"]`);
    }
  }

  const next = element.nextElementSibling;
  if (next) {
    const nextText = next.textContent?.trim();
    if (nextText && nextText.length < 50) {
      texts.push(`[after: "${nextText.slice(0, 40)}"]`);
    }
  }

  return texts.join(' ');
}

export function getElementClasses(element: HTMLElement): string {
  if (!element.className || typeof element.className !== 'string') return '';
  return element.className
    .split(/\s+/)
    .filter((c: string) => c.length > 0)
    .join(' ');
}
