// Modal stack manager — ensures ESC closes only the topmost open modal.
// Each modal registers on open and deregisters on close.

let stack: { id: number; onClose: () => void }[] = [];
let nextId = 0;

export function pushModal(onClose: () => void): number {
  const id = ++nextId;
  stack.push({ id, onClose });
  return id;
}

export function popModal(id: number): void {
  stack = stack.filter(m => m.id !== id);
}

export function isTopModal(id: number): boolean {
  return stack.length > 0 && stack[stack.length - 1].id === id;
}
