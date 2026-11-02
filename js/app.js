(() => {
  'use strict';

  const CFG = window.THUMBSMITH_CONFIG;
  const FONTS = window.THUMBSMITH_FONTS;
  const W = CFG.size.width, H = CFG.size.height;
  const ICON_NAMES = ['Left 1', 'Left 2', 'Right 1', 'Right 2'];
  const THEME_COLORS = ['overlay', 'accent', 'title', 'footer'];

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const clone = o => JSON.parse(JSON.stringify(o));

  // ---------- state ----------

  // Deep-merges saved data over defaults so new fields always exist.
  const merge = (base, saved) => {
    if (saved === undefined || saved === null) return base;
    if (Array.isArray(base)) return base.map((b, i) => merge(b, Array.isArray(saved) ? saved[i] : undefined));
    if (base && typeof base === 'object') {
      const out = { ...base };
      if (typeof saved === 'object') Object.keys(saved).forEach(k => { out[k] = k in base ? merge(base[k], saved[k]) : saved[k]; });
      return out;
    }
    return saved;
  };

  const example = () => merge(clone(CFG.defaults), window.THUMBSMITH_EXAMPLE ? clone(window.THUMBSMITH_EXAMPLE) : null);

  // First visit shows the example; after that, whatever was saved in this browser.
  const load = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(CFG.storageKey) || 'null');
      return saved ? merge(clone(CFG.defaults), saved) : example();
    } catch (e) { return clone(CFG.defaults); }
  };

  let state = load();
  const ui = { tab: 'text', sel: 0, box: -1, scale: 1 };

  let saveTimer;
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(CFG.storageKey, JSON.stringify(state)); }
      catch (e) {
        // Images too large for browser storage: keep everything else.
        try { const s = clone(state); s.photo.src = ''; s.cutout = ''; localStorage.setItem(CFG.storageKey, JSON.stringify(s)); } catch (e2) {}
      }
    }, 400);
  };
  const commit = () => { render(); save(); };

  const getPath = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const setPath = (o, path, v) => {
    const keys = path.split('.'), last = keys.pop();
    keys.reduce((a, k) => a[k], o)[last] = v;
  };
  const box = i => (i === 0 ? state.kicker : state.lines[i - 1]);
  const font = (kind, name) => FONTS[kind].find(f => f.name === name) || FONTS[kind][0];
  const family = f => "'" + f.name + "', " + f.fallback;

  const rgba = (hex, a) => {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16) || 0;
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  };

  const slug = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'thumbnail';

  const download = (href, name) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ---------- stage ----------

  const stage = $('#stage'), frame = $('#frame');
  const els = {};

  const make = (tag, cls, parent = stage) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    parent.appendChild(e);
    return e;
  };
  const editorOnly = e => { e.dataset.noexport = '1'; return e; };

  // Only touch img.src when it changes, so data URLs aren't re-decoded on every drag.
  const setSrc = (img, src) => {
    if (img._src === src) return;
    img._src = src;
    if (src) img.src = src; else img.removeAttribute('src');
  };

  const buildStage = () => {
    stage.style.width = W + 'px';
    stage.style.height = H + 'px';
    els.bg = make('div', 's-bg');
    els.photo = make('img', 's-photo');
    els.photo.alt = '';
    els.band = make('div', 's-band');
    els.overlay = make('div', 's-overlay');
    els.empty = editorOnly(make('div', 's-empty'));
    els.empty.textContent = 'Add your photo in the Photo tab';

    els.boxes = [0, 1, 2, 3].map(i => {
      const b = make('div', 's-box ' + (i === 0 ? 's-kicker' : 's-line'));
      const text = make('span', 's-text', b);
      editorOnly(make('div', 's-frame', b));
      const hl = editorOnly(make('div', 's-handle s-handle-l', b));
      const hr = editorOnly(make('div', 's-handle s-handle-r', b));
      b.addEventListener('pointerdown', e => startMoveBox(i, e));
      hl.addEventListener('pointerdown', e => startResize(i, 'l', e));
      hr.addEventListener('pointerdown', e => startResize(i, 'r', e));
      return { b, text };
    });

    els.icons = [0, 1, 2, 3].map(i => {
      const d = make('div', 's-icon');
      const img = make('img', '', d);
      img.alt = '';
      img.draggable = false;
      d.addEventListener('pointerdown', e => startMoveIcon(i, e));
      return { d, img };
    });

    els.cutout = make('img', 's-cutout');
    els.cutout.alt = '';
    els.footer = make('div', 's-footer');
    els.guides = editorOnly(make('div', 's-guides'));
    els.guides.innerHTML = '<div class="s-safe"></div><div class="s-time">12:34</div>';
  };

  const renderStage = () => {
    const t = state.theme, tf = font('title', t.titleFont), lf = font('label', t.labelFont);
    window.loadFont(tf);
    window.loadFont(lf);
    const k = (t.strength ?? 100) / 100;

    els.bg.style.background = t.overlay;

    const p = state.photo, pos = p.x + '% ' + p.y + '%';
    const drop = Math.max(0, p.drop || 0);
    [els.photo, els.cutout].forEach(img => {
      img.style.objectPosition = pos;
      img.style.transformOrigin = pos;
      img.style.transform = 'translateY(' + drop + 'px) scale(' + p.zoom + ')';
    });
    setSrc(els.photo, p.src);
    els.photo.style.display = p.src ? 'block' : 'none';
    els.empty.style.display = p.src ? 'none' : 'flex';
    setSrc(els.cutout, state.cutout);
    els.cutout.style.display = state.cutout ? 'block' : 'none';

    // Lowering the photo leaves space at the top, filled with the overlay color fading into the photo.
    els.band.style.height = (drop > 0 ? drop + 240 : 0) + 'px';
    els.band.style.background = 'linear-gradient(180deg,' + t.overlay + ' ' + Math.round((drop / (drop + 240)) * 100) + '%,' + rgba(t.overlay, 0) + ' 100%)';
    els.overlay.style.background = 'linear-gradient(180deg,' +
      rgba(t.overlay, 0.86 * k) + ' 0%,' + rgba(t.overlay, 0.4 * k) + ' 34%,' + rgba(t.overlay, 0) + ' 54%,' +
      rgba(t.overlay, 0) + ' 74%,' + rgba(t.overlay, 0.72 * k) + ' 100%)';

    els.boxes.forEach(({ b, text }, i) => {
      const bx = box(i);
      b.style.display = String(bx.text || '').trim() ? 'block' : 'none';
      b.style.left = bx.x + 'px';
      b.style.top = bx.y + 'px';
      b.style.width = bx.w + 'px';
      b.style.fontSize = bx.fs + 'px';
      b.classList.toggle('is-sel', ui.box === i);
      text.textContent = bx.text;
      if (i === 0) {
        b.style.fontFamily = family(lf);
        b.style.fontWeight = lf.weight;
        b.style.color = t.accent;
      } else {
        const highlight = i === 1;
        b.style.fontFamily = family(tf);
        b.style.fontWeight = tf.weight;
        b.style.lineHeight = tf.lineHeight;
        b.style.color = highlight ? t.accent : t.title;
        b.style.fontStyle = highlight && t.italic ? 'italic' : 'normal';
      }
    });

    // Icons below the cutout sit at z 10+, above it at z 30+; higher order = further front.
    const active = state.icons.map((ic, i) => ({ ic, i })).filter(o => o.ic.src)
      .sort((a, b) => (a.ic.order ?? a.i) - (b.ic.order ?? b.i));
    const z = {};
    let below = 0, above = 0;
    active.forEach(o => { z[o.i] = o.ic.above ? 30 + above++ : 10 + below++; });
    els.icons.forEach(({ d, img }, i) => {
      const ic = state.icons[i];
      if (!ic.src) { d.style.display = 'none'; return; }
      d.style.display = 'block';
      d.style.left = ic.x + 'px';
      d.style.top = ic.y + 'px';
      d.style.width = d.style.height = ic.s + 'px';
      d.style.borderRadius = Math.round(ic.s * 0.12) + 'px';
      d.style.transform = 'rotate(' + (ic.rot || 0) + 'deg)';
      d.style.zIndex = z[i];
      setSrc(img, ic.src);
    });

    const items = String(state.footer.text || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
    els.footer.replaceChildren(...items.map(s => { const sp = document.createElement('span'); sp.textContent = s; return sp; }));
    els.footer.style.fontFamily = family(lf);
    els.footer.style.fontWeight = lf.weight;
    els.footer.style.fontSize = state.footer.fs + 'px';
    els.footer.style.columnGap = state.footer.gap + 'px';
    els.footer.style.color = t.footer;

    els.guides.style.display = state.guides ? 'block' : 'none';
  };

  const fit = () => {
    ui.scale = frame.clientWidth / W || 1;
    stage.style.transform = 'scale(' + ui.scale + ')';
  };

  // ---------- dragging ----------

  const drag = (e, move) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY, s = ui.scale || 1;
    const onMove = ev => { move((ev.clientX - x0) / s, (ev.clientY - y0) / s); render(); };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      save();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const startMoveBox = (i, e) => {
    const b = box(i), x = b.x, y = b.y;
    ui.box = i;
    ui.tab = 'text';
    render();
    drag(e, (dx, dy) => { b.x = Math.round(x + dx); b.y = Math.round(y + dy); });
  };

  const startResize = (i, side, e) => {
    e.stopPropagation();
    const b = box(i), x = b.x, w = b.w;
    ui.box = i;
    ui.tab = 'text';
    render();
    drag(e, dx => {
      if (side === 'l') { const nw = Math.max(120, w - dx); b.x = Math.round(x + w - nw); b.w = Math.round(nw); }
      else b.w = Math.round(Math.max(120, w + dx));
    });
  };

  const startMoveIcon = (i, e) => {
    const ic = state.icons[i], x = ic.x, y = ic.y;
    ui.sel = i;
    ui.tab = 'icons';
    render();
    drag(e, (dx, dy) => { ic.x = Math.round(x + dx); ic.y = Math.round(y + dy); });
  };

  // Moves the selected icon to the front (1) or back (-1); crosses the cutout layer when needed.
  const reorder = dir => {
    const i = ui.sel, icons = state.icons;
    icons.forEach((ic, j) => { if (ic.order == null) ic.order = j; });
    const orders = icons.map(ic => ic.order);
    const others = icons.filter((ic, j) => j !== i && ic.src);
    const cur = !!icons[i].above;
    icons[i].above = dir > 0 ? cur || others.some(o => o.above) : cur && others.every(o => o.above);
    icons[i].order = dir > 0 ? Math.max(...orders) + 1 : Math.min(...orders) - 1;
    commit();
  };

  // ---------- controls ----------

  const formatOut = (out, v) => {
    if (out.dataset.fmt === 'zoom') return Number(v).toFixed(2) + '×';
    return (v ?? '') + (out.dataset.unit || '');
  };

  const syncControls = () => {
    $$('[data-k]').forEach(inp => {
      const v = getPath(state, inp.dataset.k);
      if (inp.type === 'checkbox') inp.checked = !!v;
      else if (inp.value !== String(v ?? '')) inp.value = v ?? '';
    });
    $$('[data-o]').forEach(out => { out.textContent = formatOut(out, getPath(state, out.dataset.o)); });

    const ic = state.icons[ui.sel];
    $$('[data-ik]').forEach(inp => {
      const v = ic[inp.dataset.ik];
      if (inp.type === 'checkbox') inp.checked = inp.dataset.ik === 'cleanOn' ? v !== false : !!v;
      else inp.value = v ?? 0;
    });
    $$('[data-io]').forEach(out => { out.textContent = (ic[out.dataset.io] ?? 0) + (out.dataset.unit || ''); });

    $$('[data-box]').forEach(el => el.classList.toggle('is-active', Number(el.dataset.box) === ui.box));
    $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === ui.tab)));
    $$('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== ui.tab; });
    $('#photoRemove').hidden = !state.photo.src;
    $('#cutoutRemove').hidden = !state.cutout;
  };

  let tilesKey = '';
  const renderIcons = () => {
    const key = state.icons.map(ic => (ic.src ? ic.src.length + ic.src.slice(-32) : '')).join('|') + '#' + ui.sel;
    if (key !== tilesKey) {
      tilesKey = key;
      $('#iconTiles').replaceChildren(...state.icons.map(buildTile));
    }
    const ic = state.icons[ui.sel];
    $('#iconEditor').hidden = !ic.src;
    $('#iconEmpty').hidden = !!ic.src;
    $('#cleanRow').hidden = !ic.clean;
    $$('[data-icon-name]').forEach(el => { el.textContent = ICON_NAMES[ui.sel]; });
  };

  const buildTile = (ic, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile' + (ui.sel === i ? ' is-sel' : '');
    const label = '<span class="tile-label">' + ICON_NAMES[i] + '</span>';
    if (ic.src) {
      tile.innerHTML = '<button type="button" class="tile-img" aria-label="' + ICON_NAMES[i] + '"><img alt=""></button>' +
        '<button type="button" class="tile-x" aria-label="Remove ' + ICON_NAMES[i] + '" title="Remove">' +
        '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/></svg></button>' + label;
      $('img', tile).src = ic.src;
      $('.tile-img', tile).addEventListener('click', () => { ui.sel = i; render(); });
      $('.tile-x', tile).addEventListener('click', () => { Object.assign(state.icons[i], { src: '', orig: '', clean: '' }); commit(); });
    } else {
      tile.innerHTML = '<label class="tile-add" aria-label="Add ' + ICON_NAMES[i] + '">+<input type="file" accept="image/*" hidden></label>' + label;
      $('input', tile).addEventListener('change', e => iconFromFile(i, e));
    }
    return tile;
  };

  const buildPresets = () => {
    $('#presets').replaceChildren(...CFG.presets.map(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset';
      b.dataset.preset = p.id;
      b.innerHTML = '<span class="preset-swatch"><span></span><span></span></span><span></span>';
      const sw = $$('.preset-swatch span', b);
      sw[0].style.background = p.overlay;
      sw[1].style.background = p.accent;
      b.lastChild.textContent = p.name;
      b.addEventListener('click', () => { THEME_COLORS.forEach(k => { state.theme[k] = p[k]; }); commit(); });
      return b;
    }));
  };

  const renderPresets = () => {
    $$('.preset').forEach(b => {
      const p = CFG.presets.find(x => x.id === b.dataset.preset);
      b.classList.toggle('is-active', THEME_COLORS.every(k => String(state.theme[k]).toLowerCase() === p[k].toLowerCase()));
    });
  };

  const fillFontSelect = (sel, list) => {
    sel.replaceChildren(...list.map(f => { const o = document.createElement('option'); o.value = o.textContent = f.name; return o; }));
  };

  const render = () => { renderStage(); syncControls(); renderIcons(); renderPresets(); };

  // ---------- images ----------

  const firstFile = e => { const f = e.target.files && e.target.files[0]; e.target.value = ''; return f; };
  const cutStatus = msg => { $('#cutoutStatus').textContent = msg; };

  const photoFromFile = async e => {
    const f = firstFile(e);
    if (!f) return;
    const c = await ImageTools.fileToCanvas(f, 2000);
    Object.assign(state.photo, { src: c.toDataURL('image/jpeg', 0.9), x: 50, y: 40, zoom: 1 });
    commit();
  };

  const cutout = async src => {
    try {
      state.cutout = await ImageTools.removeBackground(src, cutStatus);
      cutStatus('Done. The cutout now sits in front of the title and icons.');
      commit();
    } catch (err) {
      cutStatus('Could not remove the background. ' + ((err && err.message) || ''));
    }
  };

  const cutoutFromFile = async e => {
    const f = firstFile(e);
    if (!f) return;
    const c = await ImageTools.fileToCanvas(f, 2000);
    const png = c.toDataURL('image/png');
    if (ImageTools.hasAlpha(c)) { state.cutout = png; cutStatus(''); commit(); }
    else cutout(png);
  };

  const iconFromFile = async (i, e) => {
    const f = firstFile(e);
    if (!f) return;
    const c = await ImageTools.fileToCanvas(f, 512);
    const orig = c.toDataURL('image/png');
    const cleaned = ImageTools.cleanBorder(c);
    const clean = cleaned ? cleaned.toDataURL('image/png') : '';
    Object.assign(state.icons[i], { orig, clean, cleanOn: true, src: clean || orig });
    ui.sel = i;
    commit();
  };

  // ---------- export & projects ----------

  const exportPng = async () => {
    const status = $('#exportStatus');
    if (!window.htmlToImage) { status.textContent = 'The exporter is still loading. Try again in a few seconds.'; return; }
    const name = 'thumbnail-' + slug([state.kicker.text, ...state.lines.map(l => l.text)].join(' ')) + '.png';
    status.textContent = 'Rendering PNG…';
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const url = await window.htmlToImage.toPng(stage, {
        width: W, height: H, pixelRatio: 1,
        style: { transform: 'none' },
        filter: n => !(n.dataset && n.dataset.noexport)
      });
      download(url, name);
      status.textContent = 'Saved ' + name;
    } catch (err) {
      status.textContent = 'Export failed. ' + ((err && err.message) || '');
    }
  };

  const saveProject = () => {
    const blob = new Blob([JSON.stringify({ app: 'thumbsmith', version: 1, ...state }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    download(url, 'thumbsmith-' + slug(state.lines[0].text) + '.json');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const openProject = e => {
    const f = firstFile(e);
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        delete data.app; delete data.version;
        state = merge(clone(CFG.defaults), data);
        ui.box = -1;
        commit();
      } catch (err) {
        alert('That file is not a Thumbsmith project.');
      }
    };
    r.readAsText(f);
  };

  // ---------- wiring ----------

  const bind = () => {
    document.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.k) {
        const v = t.type === 'checkbox' ? t.checked : t.type === 'range' ? parseFloat(t.value) : t.value;
        setPath(state, t.dataset.k, v);
        commit();
      } else if (t.dataset.ik) {
        const ic = state.icons[ui.sel], key = t.dataset.ik;
        if (t.type === 'checkbox') {
          ic[key] = t.checked;
          if (key === 'cleanOn') ic.src = t.checked ? ic.clean || ic.orig : ic.orig || ic.src;
        } else ic[key] = parseFloat(t.value);
        commit();
      }
    });

    document.addEventListener('focusin', e => {
      const field = e.target.closest && e.target.closest('[data-box]');
      if (field && ui.box !== Number(field.dataset.box)) { ui.box = Number(field.dataset.box); render(); }
    });

    $$('[data-tab]').forEach(b => b.addEventListener('click', () => { ui.tab = b.dataset.tab; render(); }));

    $('#centerAll').addEventListener('click', () => {
      [state.kicker, ...state.lines].forEach(b => { b.x = Math.round((W - b.w) / 2); });
      commit();
    });

    $('#photoFile').addEventListener('change', photoFromFile);
    $('#photoRemove').addEventListener('click', () => { state.photo.src = ''; commit(); });
    $('#cutFromPhoto').addEventListener('click', () => {
      if (!state.photo.src) { cutStatus('Upload a photo in the Photo tab first.'); return; }
      cutout(state.photo.src);
    });
    $('#cutoutFile').addEventListener('change', cutoutFromFile);
    $('#cutoutRemove').addEventListener('click', () => { state.cutout = ''; cutStatus(''); commit(); });

    $('#iconUpload').addEventListener('change', e => iconFromFile(ui.sel, e));
    $('#iconReplace').addEventListener('change', e => iconFromFile(ui.sel, e));
    $('#iconRemove').addEventListener('click', () => { Object.assign(state.icons[ui.sel], { src: '', orig: '', clean: '' }); commit(); });
    $('#iconForward').addEventListener('click', () => reorder(1));
    $('#iconBackward').addEventListener('click', () => reorder(-1));

    $('#themeReset').addEventListener('click', () => { state.theme = clone(CFG.defaults.theme); commit(); });

    $('#exportPng').addEventListener('click', exportPng);
    $('#saveProject').addEventListener('click', saveProject);
    $('#loadExample').hidden = !window.THUMBSMITH_EXAMPLE;
    $('#loadExample').addEventListener('click', () => {
      if (!confirm('Load the example? This replaces your current thumbnail.')) return;
      state = example();
      ui.box = -1;
      commit();
    });
    $('#openProject').addEventListener('change', openProject);
    $('#resetAll').addEventListener('click', () => {
      if (!confirm('Start over? This clears your text, photo, cutout and icons.')) return;
      state = clone(CFG.defaults);
      ui.box = -1;
      commit();
    });
  };

  // ---------- init ----------

  fillFontSelect($('#titleFont'), FONTS.title);
  fillFontSelect($('#labelFont'), FONTS.label);
  buildPresets();
  buildStage();
  bind();
  new ResizeObserver(fit).observe(frame);
  fit();
  render();
})();
