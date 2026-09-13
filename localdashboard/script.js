const STORAGE_KEY = 'localdashboard:favorites';
const CATEGORIES_KEY = 'localdashboard:categories';
const SERVICE_KEY = 'localdashboard:faviconService';
const BACKGROUND_KEY = 'localdashboard:background';

const DEFAULTS = [
  { name: 'Google', url: 'https://www.google.com', icon: '', category: 'Geral' },
  { name: 'YouTube', url: 'https://www.youtube.com', icon: '', category: 'Lazer' },
  { name: 'GitHub', url: 'https://github.com', icon: '', category: 'Dev & Tech' },
];

const BG_PRESETS = [
  { name: 'Montanhas', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80' },
  { name: 'Oceanos', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=80' },
  { name: 'Floresta', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80' },
  { name: 'Estrelas', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80' },
  { name: 'Aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80' },
  { name: 'Deserto', url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80' },
];

const TILE_COLORS = [
  'var(--tertiary)',
  'var(--primary-soft)',
  'var(--secondary-soft)',
  'var(--error-soft)',
  'var(--on-surface)',
];

let favorites = [];
let cats = [];
let activeCategory = 'Geral';
let faviconService = '';
let savedService = '';
let editingId = null;
let draggingIndex = null;

/* ---------- DOM ---------- */

const tabs = document.getElementById('tabs');
const panels = document.getElementById('panels');
const manageLink = document.getElementById('manage-link');
const modal = document.getElementById('bookmark-modal');
const manageModal = document.getElementById('manage-modal');
const catList = document.getElementById('cat-list');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.getElementById('modal-close');
const manageClose = document.getElementById('manage-close');
const manageDone = document.getElementById('manage-done');
const form = document.getElementById('favorite-form');
const inputName = document.getElementById('f-name');
const inputUrl = document.getElementById('f-url');
const inputCategory = document.getElementById('f-category');
const inputIcon = document.getElementById('f-icon');
const inputService = document.getElementById('f-service');
const iconPreview = document.getElementById('favicon-preview');
const deleteBtn = document.getElementById('f-delete');
const cancelBtn = document.getElementById('f-cancel');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const addFavBtn = document.getElementById('add-fav-btn');
const bgBtn = document.getElementById('bg-btn');
const bgModal = document.getElementById('bg-modal');
const bgForm = document.getElementById('bg-form');
const bgInput = document.getElementById('bg-url');
const bgPresets = document.getElementById('bg-presets');
const bgClose = document.getElementById('bg-close');
const bgCancel = document.getElementById('bg-cancel');
const bgClear = document.getElementById('bg-clear');
const bgImage = document.getElementById('bg-image');

/* ---------- helpers ---------- */

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function letterOf(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

function colorFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  return TILE_COLORS[h % TILE_COLORS.length];
}

function defaultFaviconSources(host) {
  return [
    `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `https://${host}/favicon.ico`,
  ];
}

function normalizeUrl(value) {
  return /^https?:\/\//i.test(value) ? value : 'https://' + value;
}

function faviconSourcesFor(url, service) {
  const svc = (service !== undefined ? service : faviconService).trim();
  const urlHost = hostnameOf(url);
  const isTemplate = svc.includes('{domain}') || svc.includes('{url}');

  if (isTemplate) {
    const host = urlHost || hostnameOf(normalizeUrl(svc));
    const base = url || host;
    if (!host) return [svc];
    const custom = svc.replaceAll('{domain}', host).replaceAll('{url}', encodeURIComponent(base));
    return [custom, ...defaultFaviconSources(host)];
  }

  if (svc) {
    const asImage = /\.(png|jpe?g|gif|svg|webp|ico|avif)([?#]|$)/i.test(svc);
    const svcHost = hostnameOf(normalizeUrl(svc));
    if (asImage) return [svc, ...(urlHost ? defaultFaviconSources(urlHost) : [])];
    if (svcHost) return defaultFaviconSources(svcHost);
    return urlHost ? defaultFaviconSources(urlHost) : [svc];
  }

  return urlHost ? defaultFaviconSources(urlHost) : [];
}

function iconExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (ok) => {
      if (!done) {
        done = true;
        resolve(ok);
      }
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    setTimeout(() => finish(false), 3000);
    img.src = url;
  });
}

async function discoverFavicon(url) {
  try {
    const host = hostnameOf(url);
    if (!host) return '';

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const links = doc.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
        for (const link of links) {
          if (!link.href) continue;
          const abs = new URL(link.getAttribute('href'), url).href;
          if (await iconExists(abs)) return abs;
        }
      }
    } catch {
      /* CORS ou falha de rede: segue para os serviços abaixo */
    }

    for (const source of faviconSourcesFor(url)) {
      if (await iconExists(source)) return source;
    }
  } catch {
    /* nunca deve impedir o favorito de ser salvo */
  }

  return '';
}

/* ---------- persistência ---------- */

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    favorites = raw ? JSON.parse(raw) : DEFAULTS;
  } catch {
    favorites = DEFAULTS;
  }
  favorites = favorites.map((f) => ({
    name: String(f.name || f.url || '').trim(),
    url: f.url || '',
    icon: f.icon || '',
    category: (f.category || 'Geral').trim() || 'Geral',
  }));
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    /* modo privado etc. */
  }
}

function loadService() {
  faviconService = (localStorage.getItem(SERVICE_KEY) || '').trim();
  savedService = faviconService;
}

function loadCategories() {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    cats = raw
      ? JSON.parse(raw).map((c) => String(c).trim()).filter((c) => c && c !== 'undefined').filter((c, i, a) => a.indexOf(c) === i)
      : ['Geral'];
  } catch {
    cats = ['Geral'];
  }
  if (!cats.length) cats = ['Geral'];
  if (!cats.includes('Geral')) cats.unshift('Geral');
}

function normalizeCategories() {
  for (const f of favorites) {
    if (f.category && !cats.includes(f.category)) cats.push(f.category);
  }
  if (!cats.includes('Geral')) cats.unshift('Geral');
  saveCategories();
}

function saveCategories() {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
  } catch {
    /* modo privado etc. */
  }
}

/* ---------- render: tabs & painéis ---------- */

function renderTabs() {
  tabs.replaceChildren();

  cats.forEach((cat, i) => {
    if (i > 0) tabs.appendChild(el('div', 'tab-sep'));

    const btn = el('button', 'tab-btn' + (cat === activeCategory ? ' active' : ''));
    btn.type = 'button';
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      activeCategory = cat;
      renderTabs();
      renderPanels();
    });
    tabs.appendChild(btn);
  });

  tabs.appendChild(el('div', 'tab-sep'));

  const add = el('button', 'tab-add');
  add.type = 'button';
  add.title = 'Nova categoria';
  add.innerHTML = '<span class="material-symbols-outlined">add</span>';
  add.addEventListener('click', () => {
    const name = prompt('Nome da nova categoria:');
    if (name && name.trim()) {
      const n = name.trim();
      if (!cats.includes(n)) cats.push(n);
      saveCategories();
      activeCategory = n;
      renderTabs();
      renderPanels();
    }
  });
  tabs.appendChild(add);
}

function renderPanels() {
  panels.replaceChildren();

  cats.forEach((cat) => {
    const panel = el('div', 'group-panel' + (cat === activeCategory ? ' active' : ''));
    favorites.forEach((fav, i) => {
      if (fav.category === cat) panel.appendChild(buildTile(fav, i));
    });
    panels.appendChild(panel);
  });
}

function renderAll() {
  renderTabs();
  renderPanels();
}

/* ---------- favorites ---------- */

function setIcon(link, fav) {
  const sources = fav.icon ? [fav.icon] : faviconSourcesFor(fav.url);
  const letter = el('span', 'letter');
  letter.textContent = letterOf(fav.name);
  letter.style.color = colorFor(fav.name);

  if (!sources.length) {
    link.appendChild(letter);
    return;
  }

  const img = document.createElement('img');
  img.alt = '';
  let index = 0;
  img.onerror = () => {
    index += 1;
    if (index < sources.length) {
      img.src = sources[index];
    } else {
      img.remove();
      link.appendChild(letter);
    }
  };
  img.src = sources[index];
  link.appendChild(img);
}

function buildTile(fav, index) {
  const item = el('article', 'fav-item');
  item.draggable = true;

  const tile = document.createElement('a');
  tile.className = 'fav-tile';
  tile.draggable = false;
  tile.href = fav.url;
  tile.rel = 'noopener noreferrer';
  tile.title = fav.name;
  setIcon(tile, fav);
  item.appendChild(tile);

  const name = el('span', 'fav-name');
  name.textContent = fav.name;
  name.title = fav.name;
  item.appendChild(name);

  item.addEventListener('dragstart', (e) => {
    draggingIndex = index;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  });

  item.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== draggingIndex) item.classList.add('drag-target');
  });

  item.addEventListener('dragleave', () => item.classList.remove('drag-target'));

  item.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const from = draggingIndex;
    if (from === null || from === index) return;
    const [moving] = favorites.splice(from, 1);
    favorites.splice(index, 0, moving);
    save();
    renderAll();
  });

  item.addEventListener('dragend', () => {
    draggingIndex = null;
    item.classList.remove('dragging');
    clearDragTargets();
  });

  const menuBtn = el('button', 'fav-menu-btn');
  menuBtn.type = 'button';
  menuBtn.title = 'Opções';
  menuBtn.innerHTML = '<span class="material-symbols-outlined">more_vert</span>';
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllMenus();
    menu.hidden = !menu.hidden;
  });

  const menu = el('div', 'fav-menu');
  menu.hidden = true;

  const edit = el('button', 'fav-menu-item');
  edit.type = 'button';
  edit.innerHTML = '<span class="material-symbols-outlined">edit</span> Editar';
  edit.addEventListener('click', (e) => {
    e.stopPropagation();
    openModal(index);
  });

  const remove = el('button', 'fav-menu-item danger');
  remove.type = 'button';
  remove.innerHTML = '<span class="material-symbols-outlined">delete</span> Remover';
  remove.addEventListener('click', (e) => {
    e.stopPropagation();
    favorites.splice(index, 1);
    save();
    renderAll();
  });

  remove.addEventListener('mousedown', (e) => e.stopPropagation());
  edit.addEventListener('mousedown', (e) => e.stopPropagation());
  menuBtn.addEventListener('mousedown', (e) => e.stopPropagation());

  menu.appendChild(edit);
  menu.appendChild(remove);
  item.appendChild(menuBtn);
  item.appendChild(menu);
  return item;
}

function closeAllMenus() {
  document.querySelectorAll('.fav-menu').forEach((m) => {
    m.hidden = true;
  });
}

function clearDragTargets() {
  document.querySelectorAll('.fav-item.drag-target').forEach((t) => {
    t.classList.remove('drag-target');
  });
}

document.addEventListener('click', closeAllMenus);

/* ---------- modal favorito ---------- */

addFavBtn.addEventListener('click', () => openModal(null));

function populateCategories(selected) {
  inputCategory.replaceChildren();
  cats.forEach((c) => {
    const option = document.createElement('option');
    option.value = c;
    option.textContent = c;
    inputCategory.appendChild(option);
  });
  inputCategory.value = selected || cats[0] || 'Geral';
}

function openModal(index) {
  editingId = index;
  if (index === null) {
    modalTitle.textContent = 'Novo Favorito';
    form.reset();
    inputUrl.value = '';
    inputService.value = '';
    deleteBtn.hidden = true;
    populateCategories(activeCategory);
  } else {
    const fav = favorites[index];
    modalTitle.textContent = 'Editar Favorito';
    inputName.value = fav.name;
    inputUrl.value = fav.url;
    inputIcon.value = fav.icon || '';
    inputService.value = '';
    deleteBtn.hidden = false;
    populateCategories(fav.category);
  }
  iconPreview.innerHTML = '<span class="material-symbols-outlined">public</span>';
  modal.hidden = false;
  setTimeout(() => inputName.focus(), 50);
}

function closeModal() {
  editingId = null;
  modal.hidden = true;
}

modalClose.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

deleteBtn.addEventListener('click', () => {
  if (editingId === null) return;
  favorites.splice(editingId, 1);
  save();
  renderAll();
  closeModal();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = inputName.value.trim();
  let url = inputUrl.value.trim();
  const icon = inputIcon.value.trim();
  const category = inputCategory.value || 'Geral';

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const fav = { name, url, icon, category };

  if (editingId === null) {
    favorites.push(fav);
  } else {
    favorites[editingId] = fav;
  }

  save();
  renderAll();
  closeModal();

  const serviceNow = inputService.value.trim();
  const isTemplate = serviceNow.includes('{domain}') || serviceNow.includes('{url}');

  if (isTemplate && serviceNow !== faviconService) {
    faviconService = serviceNow;
    try {
      localStorage.setItem(SERVICE_KEY, faviconService);
    } catch {
      /* modo privado etc. */
    }
    savedService = faviconService;
  } else if (!serviceNow && faviconService !== '') {
    faviconService = '';
    try {
      localStorage.setItem(SERVICE_KEY, '');
    } catch {
      /* modo privado etc. */
    }
    savedService = '';
  }

  if (!icon) {
    const target = serviceNow && !isTemplate ? normalizeUrl(serviceNow) : url;
    discoverFavicon(target).then((found) => {
      if (!found) return;
      fav.icon = found;
      save();
      renderAll();
    });
  }
});

function updateFaviconPreview() {
  const url = inputUrl.value.trim();
  const service = inputService.value.trim();
  iconPreview.replaceChildren();

  const sources = faviconSourcesFor(url, service);
  if (!sources.length) {
    iconPreview.innerHTML = '<span class="material-symbols-outlined">public</span>';
    return;
  }

  const img = document.createElement('img');
  img.alt = '';
  let index = 0;
  img.onerror = () => {
    index += 1;
    if (index < sources.length) {
      img.src = sources[index];
    } else {
      iconPreview.innerHTML = '<span class="material-symbols-outlined">public</span>';
    }
  };
  img.src = sources[index];
  iconPreview.appendChild(img);
}

inputUrl.addEventListener('input', updateFaviconPreview);
inputService.addEventListener('input', updateFaviconPreview);

/* ---------- plano de fundo ---------- */

function loadBackground() {
  let src = '';
  try {
    src = localStorage.getItem(BACKGROUND_KEY) || '';
  } catch {
    /* modo privado etc. */
  }
  applyBackground(src, false);
  bgInput.value = src;
}

function applyBackground(src, persist = true) {
  if (src) {
    bgImage.style.backgroundImage = `url("${src}")`;
    bgImage.parentElement.classList.add('visible');
  } else {
    bgImage.style.backgroundImage = 'none';
    bgImage.parentElement.classList.remove('visible');
  }
  if (persist) {
    try {
      localStorage.setItem(BACKGROUND_KEY, src);
    } catch {
      /* modo privado etc. */
    }
  }
  markSelectedPreset();
}

function renderBgPresets() {
  bgPresets.replaceChildren();
  BG_PRESETS.forEach((preset) => {
    const btn = el('button', 'preset-thumb');
    btn.type = 'button';
    btn.title = preset.name;
    btn.style.backgroundImage = `url("${preset.url}")`;

    const label = el('span', 'preset-name');
    label.textContent = preset.name;
    btn.appendChild(label);

    btn.addEventListener('click', () => {
      bgInput.value = preset.url;
      applyBackground(preset.url, false);
      markSelectedPreset();
    });

    bgPresets.appendChild(btn);
  });
  markSelectedPreset();
}

function markSelectedPreset() {
  const current = bgInput.value.trim();
  bgPresets.querySelectorAll('.preset-thumb').forEach((btn) => {
    btn.classList.toggle('selected', btn.style.backgroundImage.includes(current));
  });
}

bgBtn.addEventListener('click', () => {
  bgModal.hidden = false;
  setTimeout(() => bgInput.focus(), 50);
});

bgClose.addEventListener('click', () => {
  bgModal.hidden = true;
});
bgCancel.addEventListener('click', () => {
  bgModal.hidden = true;
});

bgModal.addEventListener('click', (e) => {
  if (e.target === bgModal) bgModal.hidden = true;
});

bgInput.addEventListener('input', () => applyBackground(bgInput.value.trim(), false));

bgClear.addEventListener('click', () => {
  bgInput.value = '';
  applyBackground('', false);
  markSelectedPreset();
});

bgForm.addEventListener('submit', (e) => {
  e.preventDefault();
  applyBackground(bgInput.value.trim(), true);
  bgModal.hidden = true;
});

/* ---------- gerenciar categorias ---------- */

function renderCatList() {
  catList.replaceChildren();

  cats.forEach((cat) => {
    const row = el('div', 'cat-row');
    const count = favorites.filter((f) => f.category === cat).length;

    const name = el('span', 'cat-name');
    name.textContent = cat;
    name.title = cat;
    row.appendChild(name);

    const countEl = el('span', 'cat-count mono');
    countEl.textContent = count + (count === 1 ? ' favorito' : ' favoritos');
    row.appendChild(countEl);

    if (cat === 'Geral') {
      const note = el('span', 'cat-note mono');
      note.textContent = 'padrão';
      row.appendChild(note);
    } else {
      const rename = el('button', 'icon-btn');
      rename.type = 'button';
      rename.title = 'Renomear';
      rename.innerHTML = '<span class="material-symbols-outlined">edit</span>';
      rename.addEventListener('click', () => renameCategory(cat));

      const del = el('button', 'icon-btn danger');
      del.type = 'button';
      del.title = 'Excluir';
      del.innerHTML = '<span class="material-symbols-outlined">delete</span>';
      del.addEventListener('click', () => deleteCategory(cat));

      row.appendChild(rename);
      row.appendChild(del);
    }

    catList.appendChild(row);
  });
}

function renameCategory(cat) {
  const next = prompt(`Novo nome para "${cat}":`, cat);
  if (!next || !next.trim()) return;
  const n = next.trim();
  if (cats.includes(n) && n !== cat) {
    alert('Já existe uma categoria com esse nome.');
    return;
  }
  favorites.forEach((f) => {
    if (f.category === cat) f.category = n;
  });
  cats.splice(cats.indexOf(cat), 1, n);
  if (activeCategory === cat) activeCategory = n;
  save();
  saveCategories();
  renderAll();
  renderCatList();
}

function deleteCategory(cat) {
  if (cat === 'Geral') return;
  const count = favorites.filter((f) => f.category === cat).length;
  const ok = confirm(
    `Excluir a categoria "${cat}"?${count ? ' Os favoritos dela serão movidos para "Geral".' : ''}`
  );
  if (!ok) return;
  favorites.forEach((f) => {
    if (f.category === cat) f.category = 'Geral';
  });
  cats.splice(cats.indexOf(cat), 1);
  if (activeCategory === cat) activeCategory = 'Geral';
  save();
  saveCategories();
  renderAll();
  renderCatList();
}

manageLink.addEventListener('click', () => {
  renderCatList();
  manageModal.hidden = false;
});

manageClose.addEventListener('click', () => {
  manageModal.hidden = true;
});
manageDone.addEventListener('click', () => {
  manageModal.hidden = true;
});

manageModal.addEventListener('click', (e) => {
  if (e.target === manageModal) manageModal.hidden = true;
});

/* ---------- busca ---------- */

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) return;

  if (q.startsWith('http://') || q.startsWith('https://')) {
    window.open(q, '_blank');
  } else if (q.includes('.') && !q.includes(' ')) {
    window.open('https://' + q, '_blank');
  } else {
    window.open('https://www.google.com/search?q=' + encodeURIComponent(q), '_blank');
  }
  searchInput.value = '';
});

document.addEventListener('keydown', (e) => {
  if (
    e.key === '/' &&
    document.activeElement.tagName !== 'INPUT' &&
    document.activeElement.tagName !== 'TEXTAREA'
  ) {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.key === 'Escape') {
    closeModal();
    manageModal.hidden = true;
  }
});

/* ---------- relógio & data ---------- */

function tick() {
  const now = new Date();

  document.getElementById('clock-h').textContent = String(now.getHours()).padStart(2, '0');
  document.getElementById('clock-m').textContent = String(now.getMinutes()).padStart(2, '0');

  document.getElementById('date').textContent = now
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/^./, (c) => c.toUpperCase());
}

/* ---------- init ---------- */

load();
loadService();
loadCategories();
normalizeCategories();
if (!cats.includes(activeCategory)) activeCategory = 'Geral';
renderAll();
loadBackground();
renderBgPresets();
tick();
setInterval(tick, 1000);