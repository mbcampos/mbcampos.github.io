const STORAGE_KEY = 'localdashboard:favorites';
const CATEGORIES_KEY = 'localdashboard:categories';
const SERVICE_KEY = 'localdashboard:faviconService';
const BACKGROUND_KEY = 'localdashboard:background';
const FEED_KEY = 'localdashboard:feed';

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
const catModal = document.getElementById('cat-modal');
const catForm = document.getElementById('cat-form');
const catNameInput = document.getElementById('cat-name');
const catClose = document.getElementById('cat-close');
const catCancel = document.getElementById('cat-cancel');
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmMsg = document.getElementById('confirm-msg');
const confirmOkLabel = document.getElementById('confirm-ok-label');
const confirmClose = document.getElementById('confirm-close');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');
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
const feedBtn = document.getElementById('feed-btn');
const feedModal = document.getElementById('feed-modal');
const feedForm = document.getElementById('feed-form');
const feedUrlInput = document.getElementById('feed-url');
const feedCountInput = document.getElementById('feed-count');
const feedClose = document.getElementById('feed-close');
const feedCancel = document.getElementById('feed-cancel');
const feedClear = document.getElementById('feed-clear');
const newsZone = document.getElementById('news-zone');
const newsList = document.getElementById('news-list');
const newsRefresh = document.getElementById('news-refresh');
const favShelf = document.querySelector('.fav-shelf');
const resizeHandle = document.getElementById('resize-handle');

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

/* ---------- cache local de ícones (IndexedDB) ---------- */

const ICON_DB_NAME = 'localdashboard-icons';
const ICON_DB_STORE = 'icons';
const ICON_CACHE_MAX = 512 * 1024;

function openIconDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('indexedDB indisponível'));
      return;
    }
    const req = indexedDB.open(ICON_DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(ICON_DB_STORE)) {
        req.result.createObjectStore(ICON_DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedIcon(url) {
  try {
    const db = await openIconDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(ICON_DB_STORE, 'readonly');
      const req = tx.objectStore(ICON_DB_STORE).get(url);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function cacheIcon(url, dataUrl) {
  try {
    const db = await openIconDb();
    await new Promise((resolve) => {
      const tx = db.transaction(ICON_DB_STORE, 'readwrite');
      tx.objectStore(ICON_DB_STORE).put(dataUrl, url);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* ignora */
  }
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

async function fetchAndCacheIcon(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { mode: 'cors', signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type || !blob.type.startsWith('image/')) return null;
    const dataUrl = await blobToDataURL(blob);
    if (dataUrl.length <= ICON_CACHE_MAX) cacheIcon(url, dataUrl);
    return dataUrl;
  } catch {
    return null;
  }
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
  add.addEventListener('click', () => openCatModal());
  tabs.appendChild(add);
}

function openCatModal() {
  catNameInput.value = '';
  catForm.reset();
  catModal.hidden = false;
  catNameInput.focus();
}

function closeCatModal() {
  catModal.hidden = true;
}

catClose.addEventListener('click', closeCatModal);
catCancel.addEventListener('click', closeCatModal);
catModal.addEventListener('click', (e) => {
  if (e.target === catModal) closeCatModal();
});

catForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const n = catNameInput.value.trim();
  if (!n) return;
  if (cats.includes(n)) {
    catNameInput.setCustomValidity('Já existe uma categoria com esse nome.');
    catNameInput.reportValidity();
    return;
  }
  cats.push(n);
  saveCategories();
  activeCategory = n;
  renderTabs();
  renderPanels();
  closeCatModal();
});

catNameInput.addEventListener('input', () => catNameInput.setCustomValidity(''));

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

  const activate = (src) => {
    if (letter.parentNode === link) letter.remove();
    link.appendChild(img);
    img.src = src;
  };

  getCachedIcon(sources[0]).then(async (cached) => {
    if (cached) {
      activate(cached);
      return;
    }
    link.appendChild(letter);
    const dataUrl = await fetchAndCacheIcon(sources[0]);
    if (dataUrl) {
      activate(dataUrl);
    } else {
      activate(sources[0]);
    }
  }).catch(() => {
    link.appendChild(letter);
    activate(sources[0]);
  });
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
  let firstTime = true;
  try {
    const saved = localStorage.getItem(BACKGROUND_KEY);
    firstTime = saved === null;
    src = saved || '';
  } catch {
    /* modo privado etc. */
  }
  if (firstTime && !src) {
    const oceanos = BG_PRESETS.find((p) => p.name === 'Oceanos');
    src = oceanos ? oceanos.url : '';
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

/* ---------- redimensionar quadro de favoritos ---------- */

const SHELF_WIDTH_KEY = 'localdashboard:shelfWidth';
const SHELF_MIN_W = 360;
const SHELF_REFERENCE_W = 760;
const SHELF_CSS_VARS = {
  tileSize: ['--tile-size', 56],
  tileCol: ['--tile-col', 72],
  tileGap: ['--tile-gap', 14],
  tilePad: ['--tile-pad', 6],
  tileIcon: ['--tile-icon', 30],
  tileLetter: ['--tile-letter', 18],
  tileFont: ['--tile-font', 11],
  tileBorder: ['--tile-border', 12],
  shelfPad: ['--fav-shelf-pad', 28],
};

function shelfMaxWidth() {
  return Math.round(window.innerWidth * 0.8);
}

function scaleFor(w) {
  return Math.max(0.7, Math.min(1.2, w / SHELF_REFERENCE_W));
}

function applyShelfScale(w) {
  const s = scaleFor(w);
  for (const key of Object.keys(SHELF_CSS_VARS)) {
    const [varName, base] = SHELF_CSS_VARS[key];
    favShelf.style.setProperty(varName, Math.round(base * s) + 'px');
  }
}

function applyShelfWidth(w) {
  const width = Math.max(SHELF_MIN_W, Math.min(shelfMaxWidth(), Math.round(w)));
  favShelf.style.width = width + 'px';
  favShelf.style.maxWidth = width + 'px';
  applyShelfScale(width);
  return width;
}

function loadShelfWidth() {
  try {
    const w = parseInt(localStorage.getItem(SHELF_WIDTH_KEY), 10);
    if (w && w >= SHELF_MIN_W && w <= shelfMaxWidth()) applyShelfWidth(w);
  } catch {
    /* modo privado etc. */
  }
}

window.addEventListener('resize', () => {
  const w = parseInt(localStorage.getItem(SHELF_WIDTH_KEY), 10);
  if (w) applyShelfWidth(Math.min(w, shelfMaxWidth()));
});

resizeHandle.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  resizeHandle.setPointerCapture(e.pointerId);
  resizeHandle.classList.add('active');

  const startX = e.clientX;
  const startW = favShelf.getBoundingClientRect().width;

  const move = (ev) => applyShelfWidth(startW + (ev.clientX - startX));
  const up = (ev) => {
    resizeHandle.classList.remove('active');
    resizeHandle.removeEventListener('pointermove', move);
    resizeHandle.removeEventListener('pointerup', up);
    resizeHandle.removeEventListener('pointercancel', up);
    try {
      localStorage.setItem(SHELF_WIDTH_KEY, String(applyShelfWidth(favShelf.getBoundingClientRect().width)));
    } catch {
      /* modo privado etc. */
    }
  };

  resizeHandle.addEventListener('pointermove', move);
  resizeHandle.addEventListener('pointerup', up);
  resizeHandle.addEventListener('pointercancel', up);
});

/* ---------- feed de notícias ---------- */

let feedConfig = { url: '', count: 5 };
let goodFeedShown = false;
let rawRetryTimer = null;
let rawRetryCount = 0;

function loadFeedConfig() {
  try {
    const raw = localStorage.getItem(FEED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      feedConfig.url = parsed.url || '';
      feedConfig.count = parsed.count || 5;
    }
  } catch {
    /* modo privado etc. */
  }
}

function saveFeedConfig() {
  try {
    localStorage.setItem(FEED_KEY, JSON.stringify(feedConfig));
  } catch {
    /* modo privado etc. */
  }
}

const FEED_CACHE_KEY = 'localdashboard:feedCache';

function decodeXmlBytes(bytes) {
  const utf8 = new TextDecoder('utf-8');
  const text = utf8.decode(bytes);
  if (!text.includes('\uFFFD')) return text;
  return new TextDecoder('windows-1252').decode(bytes);
}

function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function fetchRawFeed(url) {
  const encoded = encodeURIComponent(url);
  const attempts = [
    fetchWithTimeout(`https://api.allorigins.win/raw?url=${encoded}`, 12000).then(decodeAndParse),
    fetchWithTimeout(`https://api.allorigins.win/raw?url=${encoded}`, 12000).then(decodeAndParse),
    fetchWithTimeout(`https://api.codetabs.com/v1/proxy?quest=${encoded}`, 12000).then(decodeAndParse),
    fetchWithTimeout(`https://api.allorigins.win/get?charset=ISO-8859-1&url=${encoded}`, 12000).then(decodeAndParseFromGet),
  ];

  try {
    return await Promise.any(attempts);
  } catch {
    throw new Error('raw feed falhou');
  }
}

function decodeAndParseFromGet(res) {
  if (!res.ok) throw new Error('status ' + res.status);
  return res.json().then((data) => {
    if (!data || !data.contents) throw new Error('sem contents');
    const items = parseRss(String(data.contents));
    if (!items.length) throw new Error('feed vazio');
    return items;
  });
}

function decodeAndParse(res) {
  if (!res.ok) throw new Error('status ' + res.status);
  return res.arrayBuffer().then((buf) => {
    const bytes = new Uint8Array(buf);
    const text = decodeXmlBytes(bytes);
    const items = parseRss(text);
    if (!items.length) throw new Error('feed vazio');
    return items;
  });
}

async function fetchJsonFeed(url) {
  const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
  const res = await fetchWithTimeout(api, 10000);
  if (!res.ok) throw new Error('json status ' + res.status);
  const data = await res.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('json inválido');
  return data.items
    .map((it) => {
      const title = (it.title || '').trim();
      const link = (it.link || '').trim();
      if (!title || !link) return null;
      return { title, url: link, date: it.pubDate || '' };
    })
    .filter(Boolean);
}

function loadFeedCache() {
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.raw !== true) return null;
    if (!data || data.url !== feedConfig.url || !Array.isArray(data.items)) return null;
    return data.items;
  } catch {
    return null;
  }
}

function saveFeedCache(items) {
  try {
    localStorage.setItem(
      FEED_CACHE_KEY,
      JSON.stringify({ url: feedConfig.url, raw: true, savedAt: Date.now(), items: items.slice(0, feedConfig.count) })
    );
  } catch {
    /* modo privado etc. */
  }
}

function parseRss(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  const items = Array.from(doc.querySelectorAll('item'));
  return items
    .map((item) => {
      const title = item.querySelector('title');
      const link = item.querySelector('link');
      const dateNode = item.querySelector('pubDate');
      const titleText = title ? title.textContent.trim() : '';
      const linkText = link ? link.textContent.trim() : '';
      const dateText = dateNode ? dateNode.textContent.trim() : '';
      if (!titleText || !linkText) return null;
      return { title: titleText, url: linkText, date: dateText };
    })
    .filter(Boolean);
}

function formatFeedDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderNews(items) {
  newsList.replaceChildren();
  items.forEach((item) => {
    const row = document.createElement('a');
    row.className = 'news-item';
    row.href = item.url;
    row.target = '_blank';
    row.rel = 'noopener noreferrer';

    const title = el('span', 'news-title-text');
    title.textContent = item.title;

    const meta = el('span', 'news-meta');
    meta.textContent = formatFeedDate(item.date);

    row.appendChild(title);
    row.appendChild(meta);
    newsList.appendChild(row);
  });
}

function renderGoodNews(items) {
  renderNews(items.slice(0, feedConfig.count));
  goodFeedShown = true;
}

function clearRawRetry() {
  if (rawRetryTimer) {
    clearTimeout(rawRetryTimer);
    rawRetryTimer = null;
  }
  rawRetryCount = 0;
}

function scheduleRawRetry(token) {
  if (rawRetryTimer || rawRetryCount >= 10) return;
  const delay = Math.min(1500 * Math.pow(1.5, rawRetryCount), 15000);
  rawRetryCount += 1;
  rawRetryTimer = setTimeout(() => {
    rawRetryTimer = null;
    if (!feedConfig.url || newsZone.hidden || goodFeedShown || token !== feedToken) {
      clearRawRetry();
      return;
    }
    runRawUpgrade();
  }, delay);
}

let feedToken = 0;

async function runRawUpgrade() {
  const token = feedToken;
  try {
    const items = await fetchRawFeed(feedConfig.url);
    if (token !== feedToken) return;
    renderGoodNews(items);
    saveFeedCache(items);
    clearRawRetry();
  } catch {
    if (token !== feedToken) return;
    if (!goodFeedShown) {
      try {
        const items = await fetchJsonFeed(feedConfig.url);
        if (token !== feedToken) return;
        renderNews(items.slice(0, feedConfig.count));
      } catch {
        if (token !== feedToken) return;
        const cached = loadFeedCache();
        if (!cached || !cached.length) {
          newsList.replaceChildren();
          const error = el('div', 'news-error');
          error.textContent = 'Não foi possível carregar o feed de notícias.';
          newsList.appendChild(error);
        }
      }
    }
    scheduleRawRetry(token);
  }
}

async function refreshNews() {
  if (!feedConfig.url) return;

  newsZone.hidden = false;
  newsList.replaceChildren();
  goodFeedShown = false;
  feedToken += 1;
  clearRawRetry();

  const cached = loadFeedCache();
  if (cached && cached.length) {
    renderGoodNews(cached);
  } else {
    const loading = el('div', 'news-loading');
    loading.textContent = 'Carregando notícias...';
    newsList.appendChild(loading);
  }

  runRawUpgrade();
}

feedBtn.addEventListener('click', () => {
  feedUrlInput.value = feedConfig.url;
  feedCountInput.value = String(feedConfig.count);
  feedModal.hidden = false;
  setTimeout(() => feedUrlInput.focus(), 50);
});

feedClose.addEventListener('click', () => {
  feedModal.hidden = true;
});
feedCancel.addEventListener('click', () => {
  feedModal.hidden = true;
});

feedModal.addEventListener('click', (e) => {
  if (e.target === feedModal) feedModal.hidden = true;
});

feedForm.addEventListener('submit', (e) => {
  e.preventDefault();
  feedConfig.url = feedUrlInput.value.trim();
  feedConfig.count = parseInt(feedCountInput.value, 10) || 5;
  saveFeedConfig();
  feedModal.hidden = true;
  refreshNews();
});

feedClear.addEventListener('click', () => {
  feedConfig.url = '';
  feedConfig.count = 5;
  saveFeedConfig();
  clearRawRetry();
  goodFeedShown = false;
  try {
    localStorage.removeItem(FEED_CACHE_KEY);
  } catch {
    /* modo privado etc. */
  }
  feedUrlInput.value = '';
  feedCountInput.value = '5';
  newsZone.hidden = true;
  newsList.replaceChildren();
  feedModal.hidden = true;
});

newsRefresh.addEventListener('click', refreshNews);

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

  confirmTitle.textContent = 'Excluir categoria';
  const msg = el('span');
  msg.appendChild(document.createTextNode('Excluir a categoria '));
  const strong = el('strong');
  strong.textContent = `"${cat}"`;
  msg.appendChild(strong);
  msg.appendChild(
    document.createTextNode(
      `?${count ? ` Os favoritos dela serão movidos para "Geral".` : ''}`
    )
  );
  confirmMsg.replaceChildren(msg);

  confirmOkLabel.textContent = 'Excluir';
  confirmOk.onclick = () => {
    favorites.forEach((f) => {
      if (f.category === cat) f.category = 'Geral';
    });
    cats.splice(cats.indexOf(cat), 1);
    if (activeCategory === cat) activeCategory = 'Geral';
    save();
    saveCategories();
    renderAll();
    renderCatList();
    confirmModal.hidden = true;
  };
  confirmModal.hidden = false;
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

confirmClose.addEventListener('click', () => {
  confirmModal.hidden = true;
});
confirmCancel.addEventListener('click', () => {
  confirmModal.hidden = true;
});
confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) confirmModal.hidden = true;
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
    closeCatModal();
    confirmModal.hidden = true;
    manageModal.hidden = true;
    feedModal.hidden = true;
    bgModal.hidden = true;
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
loadFeedConfig();
loadShelfWidth();
renderAll();
tick();
setInterval(tick, 1000);
if (feedConfig.url) refreshNews();