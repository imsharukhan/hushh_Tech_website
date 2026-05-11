import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[contenteditable="true"]',
  '[role="button"]:not([aria-disabled="true"])',
  '[role="menuitem"]:not([aria-disabled="true"])',
  '[role="option"]:not([aria-disabled="true"])',
  '[role="tab"]:not([aria-disabled="true"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function isKeyboardActivationKey(key: string) {
  return key === 'Enter' || key === ' ';
}

export function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];

  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.offsetParent !== null,
  );
}

export function activateOnKeyboard(
  event: ReactKeyboardEvent,
  action: () => void,
) {
  if (!isKeyboardActivationKey(event.key)) return;

  event.preventDefault();
  action();
}

export function moveFocusWithin(
  container: HTMLElement | null,
  event: Pick<KeyboardEvent | ReactKeyboardEvent, 'key' | 'preventDefault'>,
) {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) {
    return false;
  }

  const activeElement = document.activeElement;
  const currentIndex = focusableElements.findIndex((element) => element === activeElement);
  const lastIndex = focusableElements.length - 1;
  let nextIndex = currentIndex;

  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    nextIndex = currentIndex >= lastIndex ? 0 : currentIndex + 1;
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = lastIndex;
  } else {
    return false;
  }

  event.preventDefault();
  focusableElements[nextIndex]?.focus({ preventScroll: true });
  return true;
}
