# vue-svg-inline-plugin

[![version](https://img.shields.io/npm/v/vue-svg-inline-plugin.svg?style=flat)][npm]
[![downloads](https://img.shields.io/npm/dt/vue-svg-inline-plugin.svg?style=flat)][npm]
[![license](https://img.shields.io/npm/l/vue-svg-inline-plugin.svg?style=flat)][mit]
[![paypal](https://img.shields.io/badge/donate-paypal-blue.svg?colorB=0070ba&style=flat)](https://paypal.me/oliverfindl)

[Vue][vue] plugin for inline replacement of SVG images with actual content of SVG files.

> SVG files should be optimised beforehand (e.g.: using [SVGO](https://www.npmjs.com/package/svgo) or [SVGOMG](https://jakearchibald.github.io/svgomg/)).

> Placeholder images should be optimised beforehand (e.g.: using [pngquant](https://pngquant.org/) or [TinyPNG](https://tinypng.com/) / [TinyJPG](https://tinyjpg.com/)).

---

## Table of contents:
* [Installation](#installation)
* [Usage](#usage)
* [Directives](#directives)
* [Lazy loading](#lazy-loading)
* [Configuration](#configuration)

---

## Installation

### Package managers

* [npm](https://npmjs.com/) [[package][npm]]:
```bash
$ npm install vue-svg-inline-plugin --save
```

* [yarn](https://yarnpkg.com/en/) [[package](https://yarnpkg.com/en/package/vue-svg-inline-plugin)]:
```bash
$ yarn add vue-svg-inline-plugin
```

### Browsers

* [unpkg](https://unpkg.com/) [[package](https://www.unpkg.com/browse/vue-svg-inline-plugin/)]:
```html
<script src="//unpkg.com/vue-svg-inline-plugin"></script>
```

* [jsDelivr](https://jsdelivr.com/) [[package](https://www.jsdelivr.com/package/npm/vue-svg-inline-plugin)]:
```html
<script src="//cdn.jsdelivr.net/npm/vue-svg-inline-plugin"></script>
```

### Modern browsers

> This version is not transpiled and does not include any polyfills.

* [unpkg](https://unpkg.com/) [[package](https://www.unpkg.com/browse/vue-svg-inline-plugin/)]:
```html
<script src="//unpkg.com/vue-svg-inline-plugin/dist/vue-svg-inline-plugin-modern.min.js"></script>
```

* [jsDelivr](https://jsdelivr.com/) [[package](https://www.jsdelivr.com/package/npm/vue-svg-inline-plugin)]:
```html
<script src="//cdn.jsdelivr.net/npm/vue-svg-inline-plugin/dist/vue-svg-inline-plugin-modern.min.js"></script>
```

## Usage

### [Webpack][webpack] based [Vue][vue] projects (e.g.: [Webpack][webpack] or [Vue CLI][vue-cli])

```javascript
// import plugin
import VueSvgInlinePlugin from "vue-svg-inline-plugin";

// import polyfills for IE if you want to support it
import "vue-svg-inline-plugin/src/polyfills";

// use without options
Vue.use(VueSvgInlinePlugin);

// use with options
VueSvgInlinePlugin.install(Vue, {
	attributes: {
		data: ["src"],
		remove: ["alt"]
	}
});
```

### Browsers

```javascript
// use without options
Vue.use(VueSvgInlinePlugin);

// use with options
VueSvgInlinePlugin.install(Vue, {
	attributes: {
		data: ["src"],
		remove: ["alt"]
	}
});
```

## Directives

> Directive keyword can be changed via [options](#configuration).

### v-svg-inline directive

Basic usage with `v-svg-inline` directive:
```html
<img v-svg-inline class="icon" src="./images/example.svg" alt="example svg image" />
```
Replaces into:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="..." class="icon" focusable="false" role="presentation" tabindex="-1">
	<path d="..."></path>
	<!-- ... -->
</svg>
```

### v-svg-inline-sprite directive

Basic usage with `v-svg-inline-sprite` directive:
```html
<img v-svg-inline-sprite class="icon" src="./images/example.svg" alt="example svg image" />
```

Replaces into:
```xml
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="icon" focusable="false" role="presentation" tabindex="-1">
	<use xlink:href="#svg-inline-plugin-sprite-<NUMBER>" href="#svg-inline-plugin-sprite-<NUMBER>"></use>
</svg>
<!-- ... -->
<!-- injected before body closing tag -->
<svg xmlns="http://www.w3.org/2000/svg" style="display: none !important;">
	<symbol id="svg-inline-plugin-sprite-<NUMBER>" xmlns="http://www.w3.org/2000/svg" viewBox="...">
		<path d="..."></path>
		<!-- ... -->
	</symbol>
</svg>
```

## Lazy loading

This plugin supports lazy loading of SVG files. To enable it, rename `src` attribute to `data-src`. Please also provide placeholder image, which should be located in `src` attribute to avoid broken image icons in browsers.

## Configuration

### Default options

```javascript
{
	directives: {
		inline: "v-svg-inline",
		inlineSprite: "v-svg-inline-sprite"
	},
	attributes: {
		merge: ["class", "style"],
		add: [{
			name: "focusable",
			value: false
		}, {
			name: "role",
			value: "presentation"
		}, {
			name: "tabindex",
			value: -1
		}],
		data: [],
		remove: ["alt", "src", "data-src"]
	},
	cache: {
		version: "<PACKAGE_VERSION>",
		persistent: true,
		removeRevisions: true
	},
	intersectionObserverOptions: {},
	xhtml: false
}
```

### Explanation

* **directives.inline:**  
Defines directive keyword (lowercase string), which marks images you want to replace with inline SVGs.

* **directives.inlineSprite**  
Defines directive keyword (lowercase string), which marks images you want to replace with inline SVGs using inline SVG sprites.

* **attributes.merge:**  
Array of attributes (lowercase strings) which should be merged.

* **attributes.add:**  
Array of attributes (objects with name (lowercase string) and value (string) properties), which should be added. If attribute already exists, it will be merged or skipped depending on mergeAttributes option.

* **attributes.data:**  
Array of attributes (lowercase strings) which should be transformed into data-attributes. If data-attribute already exists, it will be merged or skipped depending on mergeAttributes option.

* **attributes.remove:**  
Array of attributes (lowercase strings) which should be removed.

* **cache.version:**  
Defines cache version (lowercase string or number).

* **cache.persistent:**  
Boolean. Cache downloaded SVG files into local storage.

* **cache.removeRevisions:**  
Boolean. Remove previous cache revisions from local storage.

* **intersectionObserverOptions:**  
Intersection observer options object for processing image nodes. This option is not validated. [Official documentation](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#Intersection_observer_options).

* **xhtml:**  
Boolean. In XHTML mode attribute minimization is forbidden. Empty attributes are filled with their names to be XHTML-compliant (e.g.: disabled="disabled").

### Notices

* User-defined options are deep-merged with default options. Arrays are not concatenated.

* Attributes options are executed in this order: **merge** > **add** > **data** > **remove**.

---

## License

[MIT][mit]

[mit]: https://opensource.org/licenses/MIT
[npm]: https://www.npmjs.com/package/vue-svg-inline-plugin
[vue]: https://github.com/vuejs/vue
[vue-cli]: https://github.com/vuejs/vue-cli
[webpack]: https://github.com/webpack/webpack
