/**
 * @author Oliver Findl
 * @version 1.0.0
 * @license MIT
 */

"use strict";

/* import polyfills if requested */
// It is not possible to perform conditional import, so we use require syntax instead.
// if(typeof IMPORT_POLYFILLS !== "undefined" && !!IMPORT_POLYFILLS) import "./polyfills"; // eslint-disable-line no-extra-boolean-cast

/* require polyfills if requested */
if(typeof IMPORT_POLYFILLS !== "undefined" && !!IMPORT_POLYFILLS) require("./polyfills"); // eslint-disable-line no-extra-boolean-cast

/* define default options object */
const DEFAULT_OPTIONS = {
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
	xhtml: false
};

/* define id for svg symbol */
const SYMBOL_ID = "vue-svg-inline-plugin-sprite"; // + `-<NUMBER>` - will be added dynamically

/* define id for svg symbol container */
const CONTAINER_ID = `${SYMBOL_ID}-container`;

/* define all regular expression patterns */
const PATTERN_SVG_FILENAME = /.+\.svg(?:[?#].*)?$/i;
const PATTERN_SVG_CONTENT = /<svg(\s+[^>]+)?>([\s\S]+)<\/svg>/i;
const PATTERN_ATTRIBUTES = /\s*([:@]?[^\s=]+)[\s=]+(?:"([^"]*)"|'([^']*)')?\s*/g;
const PATTERN_ATTRIBUTE_NAME = /^[:@]?[a-z](?:[a-z0-9-:]*[a-z0-9])?$/i;
const PATTERN_VUE_DIRECTIVE = /^v-/i;
const PATTERN_WHITESPACE = /\s+/g;
const PATTERN_TEMPLATE_LITERALS_WHITESPACE = /[\n\t]+/g;

/* define correct response statuses */
const CORRECT_RESPONSE_STATUSES = new Set([
	200, // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200
	304 // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304
]);

/**
 * Install method for Vue plugin.
 * @param {Function} Vue - Vue library reference.
 * @param {Object} options - Options object.
 * @returns {*}
 */
const install = (Vue = null, options = {}) => {

	/* merge default options object with supplied options object */
	for(const option of ["directives", "attributes"]) options[option] = Object.assign({}, DEFAULT_OPTIONS[option], options[option] || {});
	options = Object.assign({}, DEFAULT_OPTIONS, options);

	/* loop over all directives options */
	for(const option in options.directives) {

		/* cast directive option to string */
		options.directives[option] = options.directives[option].toString().trim().toLowerCase();

		/* throw error if directive option is not valid */
		if(!PATTERN_ATTRIBUTE_NAME.test(options.directives[option])) throw new TypeError(`Option is not valid! [options.directives.${option}="${options.directives[option]}"]`);

		/* remove starting `v-` from directive option */
		options.directives[option] = options.directives[option].replace(PATTERN_VUE_DIRECTIVE, "");

	}

	/* loop over all attributes options */
	for(const option in options.attributes) {

		/* throw error if option is not valid */
		if(!Array.isArray(options.attributes[option])) throw new TypeError(`Option is not valid! [options.attributes.${option}=${JSON.stringify(options.attributes[option])}]`);

		/* cast option values to strings */
		options.attributes[option] = option === "add" ? options.attributes[option].map(attribute => ({
			name: attribute.name.toString().trim().toLowerCase(),
			value: attribute.value.toString().trim()
		})) : options.attributes[option].map(attribute => attribute.toString().trim().toLowerCase());

		/* cast option from array to set */
		options.attributes[option] = new Set(options.attributes[option]);

	}

	/* cast xhtml option to boolean */
	options.xhtml = !!options.xhtml;

	/* check if fetch is available */
	options._fetch = "fetch" in window;

	/* check if axios is available */
	options._axios = "axios" in window;

	/* throw error if fetch and axios are not available */
	if(!options._fetch && !options._axios) throw new Error("Feature is not supported by browser! [fetch || axios]");

	/* create empty cache map */
	const cache = new Map;

	/* create empty symbol set */
	const symbols = new Set;

	/* create intersection observer */
	const observer = new IntersectionObserver((entries, observer) => {

		/* loop over all observer entries */
		for(const entry of entries) {

			/* skip if entry is not intersecting */
			if(!entry.isIntersecting) continue;

			/* store node reference */
			const node = entry.target;

			/* process node */
			processNode(node);

			/* stop observing node */
			observer.unobserve(node);

		}

	});

	/* reference for svg symbol container node */
	let containerRef;

	/**
	 * Create and append SVG symbol container node into document body.
	 * @returns {SVGSVGElement} SVG symbol container node reference.
	 */
	const createSvgSymbolContainer = () => {

		/* throw error if SVG symbol container node already exists */
		if(containerRef) throw new Error("Can not create SVG symbol container node, node already exists!");

		/* create svg symbol container node */
		const container = createNode(`<svg xmlns="http://www.w3.org/2000/svg" id="${CONTAINER_ID}" style="display: none !important;"></svg>`);

		/* append svg symbol container node into document body */
		document.body.appendChild(container);

		/* return svg symbol container node reference */
		return getSvgSymbolContainer();

	};

	/**
	 * Return SVG symbol container node reference.
	 * @returns {SVGSVGElement} SVG symbol container node reference.
	 */
	const getSvgSymbolContainer = () => {

		/* return svg symbol container node reference */
		return containerRef ? containerRef : (containerRef = document.getElementById(CONTAINER_ID)); // eslint-disable-line no-cond-assign

	};

	/**
	 * Create document fragment from string representation of node.
	 * @param {String} string - String representation of node.
	 * @returns {DocumentFragment} Document fragment created from string representation of node.
	 */
	const createNode = (string = "") => {

		/* throw error if string argument is missing */
		if(!string) throw new Error("Missing required argument! [string]");

		/* cast string argument to string */
		string = string.toString().trim();

		/* throw error if string argument is not valid */
		if(!string.startsWith("<") || !string.endsWith(">")) throw new TypeError(`Argument is not valid! [string="${string}"]`);

		/* remove unncessary whitespace from string argument */
		string = string.replace(PATTERN_TEMPLATE_LITERALS_WHITESPACE, "");

		/* return document fragment created from string argument */
		return document.createRange().createContextualFragment(string);

	};

	/**
	 * Replace node with new node.
	 * @param {HTMLElement} node - Node.
	 * @param {HTMLElement|DocumentFragment} newNode - New node.
	 * @returns {*}
	 */
	const replaceNode = (node = null, newNode = null) => {

		/* throw error if node argument is missing */
		if(!node) throw new Error("Missing required argument! [node]");

		/* throw error if newNode argument is missing */
		if(!newNode) throw new Error("Missing required argument! [newNode]");

		/* throw error if node argument is missing parentNode property */
		if(!node.parentNode) throw new Error("Missing required argument property! [node.parentNode]");

		/* replace node with new node */
		node.parentNode.replaceChild(newNode, node);

	};

	/**
	 * Create attribute map from string representation of node.
	 * @param {String} string - String representation of node.
	 * @returns {Map} Attribute map.
	 */
	const createAttributeMap = (string = "") => {

		/* throw error if string argument is missing */
		if(!string) throw new Error("Missing required argument! [string]");

		/* cast string argument to string */
		string = string.toString().trim();

		/* create empty attribute map */
		const attributes = new Map;

		/* set last index of regexp */
		PATTERN_ATTRIBUTES.lastIndex = 0;

		/* parse attributes into attribute map */
		let attribute;
		while(attribute = PATTERN_ATTRIBUTES.exec(string)) { // eslint-disable-line no-cond-assign

			/* check and fix last index of regexp */
			if(attribute.index === PATTERN_ATTRIBUTES.lastIndex) PATTERN_ATTRIBUTES.lastIndex++;

			/* store attribute name reference */
			const name = (attribute[1] || "").trim().toLowerCase();

			/* skip loop if attribute name is not set or if it is tag */
			if(!name || name.startsWith("<") || name.endsWith(">")) continue;

			/* throw error if attribute name is not valid */
			if(!PATTERN_ATTRIBUTE_NAME.test(name)) throw new TypeError(`Attribute name is not valid! [attribute="${name}"]`);

			/* store attribute value reference */
			const value = (attribute[2] || attribute[3] || "").trim();

			/* store attribute in attribute map and handle xhtml transformation if xhtml option is enabled */
			attributes.set(name, value ? value : (options.xhtml ? name : ""));

		}

		/* return attribute map */
		return attributes;

	};

	/**
	 * Fetch SVG file and create SVG file object.
	 * @param {String} path - Path to SVG file.
	 * @returns {Promise<Object>} SVG file object.
	 */
	const fetchSvgFile = (path = "") => {

		/* throw error if path argument is missing */
		if(!path) throw new Error("Missing required argument! [path]");

		/* cast path argument to string */
		path = path.toString().trim();

		/* throw error if path argument is not valid */
		if(!PATTERN_SVG_FILENAME.test(path)) throw new TypeError(`Argument is not valid! [path="${path}"]`);

		/* return promise */
		return new Promise((resolve, reject) => {

			/* create svg file object and store svg file path in it */
			const file = { path };

			/* resolve svg file object if it is already defined in cache map */
			if(cache.has(file.path)) {
				file.content = cache.get(file.path);
				return resolve(file);
			}

			/* fetch svg file */
			(options._axios ? axios.get : fetch).bind(window)(file.path)

				/* validate response status and return response data as string */
				.then(response => {

					/* throw error if response status is wrong */
					if(!CORRECT_RESPONSE_STATUSES.has(response.status | 0)) throw new Error(`Wrong response status! [response.status=${response.status}]`);

					/* return response data as string */
					return options._axios ? response.data.toString() : response.text();

				})

				/* store and resolve svg file object */
				.then(content => {

					/* store svg file content in svg file object */
					file.content = content.trim();

					/* store svg file object in cache map */
					cache.set(file.path, file.content);

					/* resolve svg file object */
					return resolve(file);

				})

				/* catch errors */
				.catch(reject);

		});

	};

	/**
	 * Parse SVG file object according to image node.
	 * @param {Object} file - SVG file object.
	 * @param {HTMLImageElement} node - Image node.
	 * @returns {String} String representation of SVG node.
	 */
	const parseSvgFile = (file = null, node = null) => {

		/* throw error if file argument is missing */
		if(!file) throw new Error("Missing required argument! [file]");

		/* throw error if node argument is missing */
		if(!node) throw new Error("Missing required argument! [node]");

		/* throw error if file argument is missing path property */
		if(!file.path) throw new Error("Missing required argument property! [file.path]");

		/* cast path property of file argument to string */
		file.path = file.path.toString().trim();

		/* throw error if path property of file argument is not valid */
		if(!PATTERN_SVG_FILENAME.test(file.path)) throw new TypeError(`Argument property is not valid! [file.path="${file.path}"]`);

		/* throw error if file argument is missing content property */
		if(!file.content) throw new Error("Missing required argument property! [file.content]");

		/* cast content property of file argument to string */
		file.content = file.content.toString().trim();

		/* throw error if content property of file argument is not valid */
		if(!PATTERN_SVG_CONTENT.test(file.content)) throw new TypeError(`Argument property is not valid! [file.content="${file.content}"]`);

		/* throw error if node argument is missing outerHTML property */
		if(!node.outerHTML) throw new Error("Missing required argument property! [node.outerHTML]");

		/* handle svg inline sprites */
		if(!!node._sprite) { // eslint-disable-line no-extra-boolean-cast

			/* replace svg file content with symbol usage reference, which will be defined in svg symbol container node */
			file.content = file.content.replace(PATTERN_SVG_CONTENT, (svg, attributes, symbol) => { // eslint-disable-line no-unused-vars

				/* check if requested svg file path is already defined in symbol set */
				const symbolAlreadyDefined = symbols.has(file.path);

				/* generate id for symbol */
				const id = `${SYMBOL_ID}-${symbolAlreadyDefined ? [...symbols].indexOf(file.path) : symbols.size}`;

				/* create new symbol if symbol is not defined in symbol set */
				if(!symbolAlreadyDefined) {

					/* create new symbol node */
					const symbolNode = createNode(`
						<svg xmlns="http://www.w3.org/2000/svg">
							<symbol id="${id}"${attributes}>
								${symbol}
							</symbol>
						</svg>
					`);

					/* store svg symbol container node reference */
					const container = getSvgSymbolContainer() || createSvgSymbolContainer();

					/* add new symbol node into svg symbol container node */
					container.appendChild(symbolNode.firstChild.firstChild);

					/* store svg file path in symbol set */
					symbols.add(file.path);

				}

				/* return symbol node usage reference */
				return `
					<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
						<use xlink:href="#${id}" href="#${id}"></use>
					</svg>
				`;

			});

		}

		/* inject attributes from attribute map into svg file content */
		return file.content.replace(PATTERN_SVG_CONTENT, (svg, attributes, symbol) => { // eslint-disable-line no-unused-vars

			/* transform matched attributes to attribute map */
			// attributes = createAttributeMap(attributes);

			/* store string representation of node reference and cast it to string */
			const nodeHtml = node.outerHTML.toString().trim();

			/* extract attribute maps */
			const fileAttributes = createAttributeMap(attributes); // svg
			const nodeAttributes = createAttributeMap(nodeHtml); // img

			/* merge attribute maps */
			attributes = new Map([...fileAttributes, ...nodeAttributes]);

			/* store attribute names reference for attributes that should have unique values */
			const uniqueAttributeValues = new Set(["class"]);

			/* loop over all attributes to merge */
			for(const attribute of options.attributes.merge) {

				/* extract attribute values */
				const fileValues = fileAttributes.has(attribute) ? fileAttributes.get(attribute).split(PATTERN_WHITESPACE).filter(value => !!value) : []; // svg
				const nodeValues = nodeAttributes.has(attribute) ? nodeAttributes.get(attribute).split(PATTERN_WHITESPACE).filter(value => !!value) : []; // img

				/* skip loop if xhtml option is enabled and there are not any values */
				if(options.xhtml && !fileValues.length && !nodeValues.length) continue;

				/* merge attribute values */
				const values = [...fileValues, ...nodeValues];

				/* set attribute values to attribute map */
				attributes.set(attribute, (uniqueAttributeValues.has(attribute) ? [...new Set(values)] : values).join(" ").trim());

			}

			/* loop over all attributes to add */
			for(const attribute of options.attributes.add) {

				/* extract attribute values */
				let values = attribute.value.split(PATTERN_WHITESPACE).filter(value => !!value);

				/* check if attribute is already defined in attribute map */
				if(attributes.has(attribute.name)) {

					/* throw error if attribute to add already exists and can not be merged */
					if(!options.attributes.merge.has(attribute.name)) throw new Error(`Can not add attribute, attribute already exists. [${attribute.name}]`);

					/* extract attribute values */
					const oldValues = attributes.get(attribute.name).split(PATTERN_WHITESPACE).filter(value => !!value);

					/* skip loop if xhtml option is enabled and there are not any values */
					if(options.xhtml && !values.length && !oldValues.length) continue;

					/* merge attribute values */
					values = [...oldValues, ...values];

				}

				/* set attribute values to attribute map */
				attributes.set(attribute.name, (uniqueAttributeValues.has(attribute.name) ? [...new Set(values)] : values).join(" ").trim());

			}

			/* loop over all attributes to transform into data-attributes */
			for(const attribute of options.attributes.data) {

				/* skip if attribute is not defined in attribute map */
				if(!attributes.has(attribute)) continue;

				/* extract attribute values */
				let values = attributes.get(attribute).split(PATTERN_WHITESPACE).filter(value => !!value);

				/* store data-attribute name reference */
				const dataAttribute = `data-${attribute}`;

				/* check if data-attribute is already defined in attribute map */
				if(attributes.has(dataAttribute)) {

					/* throw error if data-attribute already exists and can not be merged */
					if(!options.attributes.merge.has(dataAttribute)) throw new Error(`Can not transform attribute to data-attribute, data-attribute already exists. [${attribute}]`);

					/* extract data-attribute values */
					const oldValues = attributes.get(dataAttribute).split(PATTERN_WHITESPACE).filter(value => !!value);

					/* skip loop if xhtml option is enabled and there are not any values */
					if(options.xhtml && !values.length && !oldValues.length) continue;

					/* merge attribute values */
					values = [...oldValues, ...values];

				}

				/* set data-attribute values to attribute map */
				attributes.set(dataAttribute, (uniqueAttributeValues.has(attribute) ? [...new Set(values)] : values).join(" ").trim());

				/* add attribute to remove from attribute map into options.attributes.remove set if there is not already present */
				if(!options.attributes.remove.has(attribute)) options.attributes.remove.add(attribute);

			}

			/* loop over all attributes to remove */
			for(const attribute of options.attributes.remove) {

				/* skip if attribute is not defined in attribute map */
				if(!attributes.has(attribute)) continue;

				/* remove attribute from attribute map */
				attributes.delete(attribute);

			}

			/* return string representation of svg node with injected attributes */
			return `
				<svg${attributes.size ? ` ${[...attributes.keys()].filter(attribute => !!attribute).map(attribute => `${attribute}="${attributes.get(attribute)}"`).join(" ")}` : ""}>
					${symbol}
				</svg>
			`;

		});

	};

	/**
	 * Replace image node with SVG node.
	 * @param {HTMLImageElement} node - Image node.
	 * @returns {*}
	 */
	const processNode = (node = null) => {

		/* throw error if node argument is missing */
		if(!node) throw new Error("Missing required argument! [node]");

		/* throw error if node argument is missing data-src or src property */
		if(!node.dataset.src && !node.src) throw new Error("Missing required argument property! [node.data-src || node.src]");

		/* cast data-src and src properties of node argument argument to strings if defined */
		if(node.dataset.src) node.dataset.src = node.dataset.src.toString().trim();
		if(node.src) node.src = node.src.toString().trim();

		/* fetch svg file */
		fetchSvgFile(node.dataset.src || node.src)

			/* process svg file object */
			.then(file => {

				/* parse svg file object */
				const svgString = parseSvgFile(file, node);

				/* create svg node */
				const svgNode = createNode(svgString);

				/* replace image node with svg node */
				replaceNode(node, svgNode);

			})

			/* catch errors */
			.catch(console.error); // eslint-disable-line no-console

	};

	/**
	 * Bind hook for Vue directive.
	 * @param {HTMLImageElement} node - Node that is binded with directive.
	 * @param {Object} binding - Object containing directive properties.
	 * @param {VNode} vnode - Virtual node created by Vue compiler.
	 * @returns {*}
	 */
	const bind = (node = null, binding = null, vnode = null) => { // eslint-disable-line no-unused-vars

		/* throw error if node argument is missing */
		if(!node) throw new Error("Missing required argument! [node]");

		/* throw error if vnode argument is missing */
		if(!vnode) throw new Error("Missing required argument! [vnode]");

		/* skip if node is already processed */
		if(!!node._processed) return; // eslint-disable-line no-extra-boolean-cast

		/* throw error if node has more than 1 directive */
		if(vnode.data.directives.length > 1) throw new Error(`Node has more than 1 directive! [vnode.data.directives=${JSON.stringify(vnode.data.directives.map(directive => directive.name))}]`);

		/* set internal _sprite flag */
		node._sprite = vnode.data.directives.pop().name === options.directives.inlineSprite;

		/* observe node if data-src is defined otherwise process node */
		if(node.dataset.src) observer.observe(node);
		else processNode(node);

		/* update internal _processed flag */
		node._processed = true;

	};

	/* define svg inline directive */
	Vue.directive(options.directives.inline, { bind });

	/* define svg inline sprite directive */
	Vue.directive(options.directives.inlineSprite, { bind });
};

/* export Vue plugin */
export default { install };
