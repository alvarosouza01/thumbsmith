// Edit this file to make Thumbsmith yours: starting text, layout, theme and color presets.
window.THUMBSMITH_CONFIG = {
  // Change the key if you change the default layout, so old browser saves don't override it.
  storageKey: 'thumbsmith-v1',
  size: { width: 1280, height: 720 },

  defaults: {
    kicker: { text: 'UX DESIGN TIPS', x: 50, y: 36, w: 1180, fs: 22 },
    lines: [
      { text: 'Europe', x: 50, y: 74, w: 1180, fs: 230 },
      { text: '', x: 50, y: 281, w: 1180, fs: 230 },
      { text: '', x: 50, y: 488, w: 1180, fs: 230 }
    ],
    footer: { text: 'Jobs, Salaries, Visas', fs: 18, gap: 56 },
    photo: { src: '', x: 50, y: 26, zoom: 1, drop: 0 },
    cutout: '',
    icons: [
      { src: '', orig: '', clean: '', cleanOn: true, x: 96, y: 318, s: 168, rot: 0, above: false, order: 0 },
      { src: '', orig: '', clean: '', cleanOn: true, x: 220, y: 456, s: 128, rot: 0, above: false, order: 1 },
      { src: '', orig: '', clean: '', cleanOn: true, x: 1016, y: 318, s: 168, rot: 0, above: false, order: 2 },
      { src: '', orig: '', clean: '', cleanOn: true, x: 936, y: 456, s: 128, rot: 0, above: false, order: 3 }
    ],
    theme: {
      overlay: '#091F4A',
      accent: '#F9CD5A',
      title: '#FFFFFF',
      footer: '#FFFFFF',
      strength: 100,
      titleFont: 'Instrument Serif',
      labelFont: 'Figtree',
      italic: true
    },
    guides: false
  },

  presets: [
    { id: 'navy-gold', name: 'Navy & Gold', overlay: '#091F4A', accent: '#F9CD5A', title: '#FFFFFF', footer: '#FFFFFF' },
    { id: 'royal-gold', name: 'Royal & Gold', overlay: '#085DCE', accent: '#F9CD5A', title: '#FFFFFF', footer: '#FFFFFF' },
    { id: 'ink-lime', name: 'Ink & Lime', overlay: '#121212', accent: '#C6F432', title: '#FFFFFF', footer: '#FFFFFF' },
    { id: 'plum-peach', name: 'Plum & Peach', overlay: '#3A1142', accent: '#FFB38A', title: '#FFFFFF', footer: '#FFFFFF' },
    { id: 'forest-cream', name: 'Forest & Cream', overlay: '#0E3B2E', accent: '#F2E2B3', title: '#FFFFFF', footer: '#FFFFFF' },
    { id: 'wine-sand', name: 'Wine & Sand', overlay: '#5C0E1C', accent: '#FFD9A3', title: '#FFFFFF', footer: '#FFFFFF' }
  ]
};
