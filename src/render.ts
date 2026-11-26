export function setDivCollapsed(divId: string, collapsed: boolean): void {
  const el = document.getElementById(divId);
  if (el) el.style.display = collapsed ? 'none' : '';
}

export function renderIntoDiv(divId: string, html: string): HTMLIFrameElement | null {
  const container = document.getElementById(divId);
  if (!container) {
    console.warn(`mock-gpt: no element with id "${divId}" found; skipping render`);
    return null;
  }

  const iframe = document.createElement('iframe');
  iframe.srcdoc = html;
  container.innerHTML = '';
  container.appendChild(iframe);
  return iframe;
}
