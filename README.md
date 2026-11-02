# Thumbsmith

A free, open-source YouTube thumbnail maker that runs entirely in your browser. No account, no server, no build step.

Made by [alvarosouza.com](https://alvarosouza.com).

## Features

- 1280 × 720 thumbnails exported as PNG
- Separate, draggable text boxes: a kicker and up to three title lines, each with its own size and width
- Photo positioning, zoom, and a "Lower" control that pushes the photo down and fills the top with color
- One-click background removal, so you appear in front of the title
- Up to four icons with position, size, rotation, layer order and automatic white-border removal
- Theme tab with color presets, custom colors, overlay strength and font choices
- Safe-area and timestamp guides
- Work is saved in your browser automatically. Save and open projects as `.json` files

## Use it

**Online:** open the GitHub Pages link of this repository.

**Locally:** download the repository and run a local server in its folder, for example `npx serve` or `python3 -m http.server`, then open the address it prints. Opening `index.html` directly also works for editing, but exporting the example images needs a server. An internet connection is needed for the fonts, the PNG exporter and the background-removal model.

## Make it yours

1. Click **Use this template** at the top of this repository to create your own copy.
2. Edit `js/config.js` to change the starting text, layout, default theme and color presets.
3. Replace the images in `examples/` and the values in `js/example.js` with your own thumbnail, or set `window.THUMBSMITH_EXAMPLE = null` to start blank.
4. Edit `js/fonts.js` to add or remove Google Fonts from the Theme tab.
5. Edit `css/styles.css` to restyle the editor itself.

If you change the default layout, also change `storageKey` in `js/config.js` so old browser saves don't override your new defaults.

## Publish on GitHub Pages

1. In your repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the `main` branch and the `/ (root)` folder, then **Save**.
4. After a minute your site is live at `https://<your-username>.github.io/<repository-name>/`.

## Project structure

```
index.html          Editor page
css/styles.css      Editor and thumbnail styles
js/config.js        Default content, theme and color presets
js/example.js       Example project shown on first visit
examples/           Example photo, cutout and icons
js/fonts.js         Fonts offered in the Theme tab
js/image-tools.js   Image resizing, icon border cleanup, background removal
js/app.js           Editor state, preview rendering, controls and export
```

## Privacy

Everything happens on your device. Photos and projects are never uploaded anywhere.

## Credits

- [html-to-image](https://github.com/bubkoo/html-to-image) (MIT) for PNG export
- [@imgly/background-removal](https://github.com/imgly/background-removal-js) (AGPL-3.0) for background removal, loaded from a CDN when you use it
- Fonts from [Google Fonts](https://fonts.google.com)

## License

MIT. See [LICENSE](LICENSE). You can use, copy, modify and sell it freely.
