let listeners = [];
let collapsed = false;

export function isSidebarCollapsed() {
  return collapsed;
}

export function setSidebarCollapsed(value) {
  collapsed = value;
  try { localStorage.setItem('sidebar_collapsed', String(value)); } catch {}
  listeners.forEach((fn) => fn(value));
}

export function initSidebarState() {
  try {
    const stored = localStorage.getItem('sidebar_collapsed');
    if (stored !== null) collapsed = stored === 'true';
  } catch {}
  return collapsed;
}

export function onSidebarChange(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((f) => f !== fn);
  };
}
