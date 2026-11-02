// Image helpers: resizing uploads, white-border cleanup for icons, background removal.
(() => {
  let removeBg = null;

  const blobToDataUrl = blob => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

  // Draws an uploaded file onto a canvas, scaled down so its longest side is at most `max`.
  const fileToCanvas = (file, max) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || max, h = img.naturalHeight || max;
      const k = Math.min(1, max / Math.max(w, h));
      const c = document.createElement('canvas');
      c.width = Math.round(w * k);
      c.height = Math.round(h * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    img.src = url;
  });

  const hasAlpha = c => {
    const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (let p = 3; p < px.length; p += 4 * 97) if (px[p] < 250) return true;
    return false;
  };

  // Removes white background connected to the image edges and crops to the content.
  // Returns null when the image has no white border.
  const cleanBorder = src => {
    const w = src.width, h = src.height;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    const data = ctx.getImageData(0, 0, w, h), px = data.data;
    const light = p => px[p * 4 + 3] > 0 && px[p * 4] > 232 && px[p * 4 + 1] > 232 && px[p * 4 + 2] > 232;
    let total = 0, white = 0;
    for (let x = 0; x < w; x++) { total += 2; white += light(x) + light((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { total += 2; white += light(y * w) + light(y * w + w - 1); }
    if (white / total < 0.6) return null;
    const seen = new Uint8Array(w * h), stack = [];
    const add = p => { if (!seen[p] && light(p)) { seen[p] = 1; stack.push(p); } };
    for (let x = 0; x < w; x++) { add(x); add((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { add(y * w); add(y * w + w - 1); }
    while (stack.length) {
      const p = stack.pop(), x = p % w, y = (p - x) / w;
      px[p * 4 + 3] = 0;
      if (x > 0) add(p - 1);
      if (x < w - 1) add(p + 1);
      if (y > 0) add(p - w);
      if (y < h - 1) add(p + w);
    }
    ctx.putImageData(data, 0, 0);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return null;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, s = Math.max(bw, bh);
    const out = document.createElement('canvas');
    out.width = s; out.height = s;
    out.getContext('2d').drawImage(c, x0, y0, bw, bh, (s - bw) / 2, (s - bh) / 2, bw, bh);
    return out;
  };

  // Background removal runs in the browser with @imgly/background-removal (model downloads once).
  const removeBackground = async (src, onStatus) => {
    if (!removeBg) {
      onStatus('Downloading the cutout model (first time only)…');
      let mod;
      try { mod = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/+esm'); }
      catch (e) { mod = await import('https://esm.sh/@imgly/background-removal@1.4.5'); }
      removeBg = mod.removeBackground || (mod.default && mod.default.removeBackground) || mod.default;
    }
    onStatus('Removing the background…');
    const blob = await (await fetch(src)).blob();
    const out = await removeBg(blob, {
      progress: (key, cur, tot) => {
        if (/fetch/.test(key) && tot) onStatus('Downloading the cutout model… ' + Math.round((cur / tot) * 100) + '%');
      }
    });
    return blobToDataUrl(out);
  };

  window.ImageTools = { fileToCanvas, hasAlpha, cleanBorder, removeBackground };
})();
