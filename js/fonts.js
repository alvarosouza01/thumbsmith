// Google Fonts available in the Theme tab. `css` is the Google Fonts family spec.
// To add a font: pick one on fonts.google.com and add an entry with the weight you want.
window.THUMBSMITH_FONTS = {
  title: [
    { name: 'Instrument Serif', css: 'Instrument+Serif:ital@0;1', weight: 400, lineHeight: 0.86, fallback: 'serif' },
    { name: 'DM Serif Display', css: 'DM+Serif+Display:ital@0;1', weight: 400, lineHeight: 0.9, fallback: 'serif' },
    { name: 'Playfair Display', css: 'Playfair+Display:ital,wght@0,800;1,800', weight: 800, lineHeight: 0.92, fallback: 'serif' },
    { name: 'Anton', css: 'Anton', weight: 400, lineHeight: 0.95, fallback: 'sans-serif' },
    { name: 'Bebas Neue', css: 'Bebas+Neue', weight: 400, lineHeight: 0.9, fallback: 'sans-serif' },
    { name: 'Archivo Black', css: 'Archivo+Black', weight: 400, lineHeight: 0.92, fallback: 'sans-serif' },
    { name: 'Oswald', css: 'Oswald:wght@600', weight: 600, lineHeight: 0.95, fallback: 'sans-serif' },
    { name: 'Bricolage Grotesque', css: 'Bricolage+Grotesque:wght@800', weight: 800, lineHeight: 0.9, fallback: 'sans-serif' }
  ],
  label: [
    { name: 'Figtree', css: 'Figtree:wght@700', weight: 700, fallback: 'sans-serif' },
    { name: 'Host Grotesk', css: 'Host+Grotesk:wght@700', weight: 700, fallback: 'sans-serif' },
    { name: 'Space Grotesk', css: 'Space+Grotesk:wght@700', weight: 700, fallback: 'sans-serif' },
    { name: 'Manrope', css: 'Manrope:wght@800', weight: 800, fallback: 'sans-serif' },
    { name: 'Oswald', css: 'Oswald:wght@600', weight: 600, fallback: 'sans-serif' },
    { name: 'IBM Plex Mono', css: 'IBM+Plex+Mono:wght@600', weight: 600, fallback: 'monospace' }
  ]
};

window.loadFont = font => {
  if (!font || document.querySelector('link[data-font="' + font.name + '"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.crossOrigin = 'anonymous'; // lets the PNG exporter embed the font
  link.href = 'https://fonts.googleapis.com/css2?family=' + font.css + '&display=swap';
  link.dataset.font = font.name;
  document.head.appendChild(link);
};
