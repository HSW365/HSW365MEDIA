// Shared helpers for every page.
export async function api(path, { method = 'GET', body, form } = {}) {
  const opts = { method, credentials: 'same-origin', headers: {} };
  if (form) opts.body = form;
  else if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  let res;
  try { res = await fetch(path, opts); } catch { throw Object.assign(new Error('Network problem. Check your connection and try again.'), { status: 0 }); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed.'), { status: res.status, code: data.code });
  return data;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function fmtDuration(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
export const fmtLimit = (sec) => (sec >= 60 ? `${sec % 60 ? (sec / 60).toFixed(1) : sec / 60} min` : `${sec} sec`);

let toastTimer;
export function toast(msg, kind = '') {
  let el = $('.toast');
  if (!el) { el = document.createElement('div'); el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.className = `toast ${kind}`;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 5200);
}

// Renders the three plan cards. `action(plan)` returns { label, href?, disabled? }.
export function renderPlans(container, plans, action, currentId = null) {
  container.innerHTML = plans.map((p) => {
    const a = action(p);
    const cls = ['plan', p.featured ? 'featured' : '', p.id === currentId ? 'current' : ''].join(' ');
    const btnCls = `btn ${p.featured ? 'btn-primary' : 'btn-ghost'} btn-block`;
    const btn = a.href
      ? `<a class="${btnCls}" href="${a.href}">${esc(a.label)}</a>`
      : `<button class="${btnCls}" data-plan="${p.id}" ${a.disabled ? 'disabled' : ''}>${esc(a.label)}</button>`;
    return `<article class="${cls}">
      ${p.featured ? '<span class="tag">Most popular</span>' : ''}
      <h3>${esc(p.name)}</h3>
      <p class="tagline">${esc(p.tagline)}</p>
      <div class="price"><b>$${p.price}</b><span>/ month</span></div>
      <div class="cap">${p.projects} projects / month &middot; ${fmtLimit(p.maxSeconds)} each</div>
      <ul>${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      ${btn}
    </article>`;
  }).join('');
}
