/**
 * @author Oliver Findl
 * @version 2.1.4
 * @license MIT
 */

"use strict";

/* import package.json file as PACKAGE_JSON constant */
import PACKAGE_JSON from "../package.json";

/* define PACKAGE_NAME constant */
const PACKAGE_NAME = PACKAGE_JSON.name;

/* define PACKAGE_VERSION constant */
const PACKAGE_VERSION = PACKAGE_JSON.version;

/* import polyfills if requested */
// It is not possible to perform conditional import, so we use require syntax instead.
// if(typeof IMPORT_POLYFILLS !== "undefined" && !!IMPORT_POLYFILLS) import "./polyfills"; // eslint-disable-line no-extra-boolean-cast
if(typeof IMPORT_POLYFILLS !== "undefined" && !!IMPORT_POLYFILLS) require("./polyfills"); // eslint-disable-line no-extra-boolean-cast, no-undef

/* define default options object */
const DEFAULT_OPTIONS = {
	directive: {
		name: "v-svg-inline",
		spriteModifierName: "sprite"
	},
	attributes: {
		clone: [ "viewbox" ],
		merge: [ "class", "style" ],
		add: [ {
			name: "focusable",
			value: false
		}, {
			name: "role",
			value: "presentation"
		}, {
			name: "tabindex",
			value: -1
		} ],
		data: [],
		remove: [ "alt", "src", "data-src" ]
	},
	cache: {
		version: PACKAGE_VERSION,
		persistent: true,
		removeRevisions: true
	},
	intersectionObserverOptions: {},
	axios: null,
	xhtml: false
};

/* define reference id for image node intersection observer */
const OBSERVER_REF_ID = "observer";

/* define reference id for svg symbol container node */
const CONTAINER_REF_ID = "container";

/* define id for cache map local storage key */
// Will be defined dynamically based on supplied options.cache.version value.
// const CACHE_ID = `${PACKAGE_NAME}:${PACKAGE_VERSION}`;

/* define id for image node flags */
const FLAGS_ID = `${PACKAGE_NAME}-flags`;

/* define id for svg symbol node*/
const SYMBOL_ID = `${PACKAGE_NAME}-sprite`; // + `-<NUMBER>` - will be added dynamically

/* define id for svg symbol container node */
const CONTAINER_ID = `${SYMBOL_ID}-${CONTAINER_REF_ID}`;

/* define all regular expression patterns */
const PATTERN_SVG_FILENAME = /.+\.svg(?:[?#].*)?$/i;
const PATTERN_SVG_CONTENT = /<svg(\s+[^>]+)?>([\s\S]+)<\/svg>/i;
const PATTERN_ATTRIBUTES = /\s*([^\s=]+)[\s=]+(?:"([^"]*)"|'([^']*)')?\s*/g;
const PATTERN_ATTRIBUTE_NAME = /^[a-z](?:[a-z0-9-:]*[a-z0-9])?$/i;
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
 * @param {Function|Object} VueOrApp - Vue reference (Vue@2) or Vue instance (Vue@3).
 * @param {Object} options - Options object.
 * @returns {*}
 */
const install = (VueOrApp = null, options = {}) => {

	/* store basic types references */
	const _str = "string";
	const _fnc = "function";
	const _obj = "object";

	/* throw error if VueOrApp argument is missing */
	if(!VueOrApp) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [VueOrApp]`);

	/* throw error if VueOrApp argument is not valid */
	if(![ _fnc, _obj ].includes(typeof VueOrApp)) throw new TypeError(`[${PACKAGE_NAME}] Required argument is not valid! [VueOrApp]`);

	/* throw error if VueOrApp argument is missing directive method */
	if(!VueOrApp.directive) throw new Error(`[${PACKAGE_NAME}] Required method is missing! [VueOrApp.directive]`);

	/* throw error if VueOrApp.directive method is not valid */
	if(typeof VueOrApp.directive !== _fnc) throw new TypeError(`[${PACKAGE_NAME}] Required method is not valid! [VueOrApp.directive]`);

	/* throw error if VueOrApp argument is missing version property */
	if(!VueOrApp.version) throw new Error(`[${PACKAGE_NAME}] Required property is missing! [VueOrApp.version]`);

	/* throw error if VueOrApp.version property is not valid */
	if(typeof VueOrApp.version !== _str) throw new TypeError(`[${PACKAGE_NAME}] Required property is not valid! [VueOrApp.version]`);

	/* throw error if Vue@1 is detected */
	if(VueOrApp.version.startsWith("1.")) throw new Error(`[${PACKAGE_NAME}] Vue@1 is not supported!`);

	/* merge default options object with supplied options object */
	["directive", "attributes", "cache", "intersectionObserverOptions"].forEach(option => options[option] = Object.assign({}, DEFAULT_OPTIONS[option], options[option] || {}));
	options = Object.assign({}, DEFAULT_OPTIONS, options);

	/* loop over all directives options */
	for(const option in options.directive) {

		/* cast directive option to string */
		options.directive[option] = options.directive[option].toString().trim().toLowerCase();

		/* throw error if directive option is not valid */
		if(!options.directive[option] || option === "name" && !PATTERN_ATTRIBUTE_NAME.test(options.directive[option])) throw new TypeError(`[${PACKAGE_NAME}] Option is not valid! [options.directives.${option}="${options.directives[option]}"]`);

	}

	/* remove starting `v-` from directive name option */
	options.directive.name = options.directive.name.replace(PATTERN_VUE_DIRECTIVE, "");

	/* loop over all attributes options */
	for(const option in options.attributes) {

		/* throw error if option is not valid */
		if(!Array.isArray(options.attributes[option])) throw new TypeError(`[${PACKAGE_NAME}] Option is not valid! [options.attributes.${option}=${JSON.stringify(options.attributes[option])}]`);

		/* cast option values to strings */
		options.attributes[option] = option === "add" ? options.attributes[option].map(attribute => ({
			name: attribute.name.toString().trim().toLowerCase(),
			value: attribute.value.toString().trim()
		})) : options.attributes[option].map(attribute => attribute.toString().trim().toLowerCase());

		/* cast option from array to set */
		options.attributes[option] = new Set(options.attributes[option]);

	}

	/* loop over all cache options */
	for(const option in options.cache) {

		/* cast option value to string if option is version or boolean otherwise */
		options.cache[option] = option === "version" ? options.cache[option].toString().trim().toLowerCase() : !!options.cache[option];

	}

	/* cast xhtml option to boolean */
	options.xhtml = !!options.xhtml;

	/* store Vue@3 flag */
	const isVue3 = /* !(VueOrApp instanceof Function) && */ VueOrApp.version.startsWith("3.");

	/* check if fetch is available */
	options._fetch = "fetch" in window && typeof fetch === _fnc;

	/* check if axios is available */
	options._axios = "axios" in window && typeof axios === _fnc;

	/**
	 * Validate Axios instance get method.
	 * @param {Axios} axios - Axios instance.
	 * @returns {Boolean} Validation result.
	 */
	const validateAxiosGetMethod = (axios = null) => !!axios && typeof axios === _fnc && "get" in axios && typeof axios.get === _fnc;

	/* axios validation result */
	let axiosIsValid = false;

	/* create new axios instance if not provided or not valid */
	options.axios = ((axiosIsValid = validateAxiosGetMethod(options.axios)) ? options.axios : null) || (options._axios && "create" in axios && typeof axios.create === _fnc ? axios.create() : null); // eslint-disable-line no-cond-assign

	/* check if axios instance exists and is valid */
	options._axios = axiosIsValid || validateAxiosGetMethod(options.axios);

	/* throw error if fetch and axios are not available */
	if(!options._fetch && !options._axios) throw new Error(`[${PACKAGE_NAME}] Feature is not supported by browser! [fetch || axios]`);

	/* check if intersection observer is available */
	options._observer = "IntersectionObserver" in window;

	/* throw error if intersection observer is not available */
	// We log error instead and disable lazy processing of image nodes in processing function - processImageNode().
	// if(!options._observer) throw new Error(`[${PACKAGE_NAME}] Feature is not supported by browser! [IntersectionObserver]`);
	if(!options._observer) console.error(`[${PACKAGE_NAME}] Feature is not supported by browser! Disabling lazy processing of image nodes. [IntersectionObserver]`); // eslint-disable-line no-console

	/* check if local storage is available */
	options._storage = "localStorage" in window;

	/* throw error if local storage is not available */
	// We log error instead and disable caching of SVG files in processing function - fetchSvgFile().
	// if(!options._storage && options.cache.persistent) throw new Error(`[${PACKAGE_NAME}] Feature is not supported by browser! [localStorage]`);
	if(!options._storage && options.cache.persistent) console.error(`[${PACKAGE_NAME}] Feature is not supported by browser! Disabling persistent cache of SVG files. [localStorage]`); // eslint-disable-line no-console

	/* define id for cache map local storage key */
	const CACHE_ID = `${PACKAGE_NAME}:${options.cache.version}`;

	/* remove previous cache map revisions */
	if(options._storage && options.cache.removeRevisions) Object.entries(localStorage).map(item => item.shift()).filter(item => item.startsWith(`${PACKAGE_NAME}:`) && !item.endsWith(`:${options.cache.version}`)).forEach(item => localStorage.removeItem(item));

	/* create empty cache map or restore stored cache map */
	const cache = options._storage && options.cache.persistent ? new Map(JSON.parse(localStorage.getItem(CACHE_ID) || "[]")) : new Map;

	/* create empty symbol set */
	const symbols = new Set;

	/* create empty reference map */
	const refs = new Map;

	/**
	 * Create image node intersection observer.
	 * @returns {IntersectionObserver} Image node intersection observer.
	 */
	const createImageNodeIntersectionObserver = () => {

		/* throw error if intersection observer is not available in browser */
		if(!options._observer) throw new Error(`[${PACKAGE_NAME}] Feature is not supported by browser! [IntersectionObserver]`);

		/* throw error if image node intersection observer already exists */
		if(refs.has(OBSERVER_REF_ID)) throw new Error(`[${PACKAGE_NAME}] Can not create image node intersection observer, intersection observer already exists!`);

		/* create image node intersection observer */
		const observer = new IntersectionObserver((entries, observer) => {

			/* loop over all observer entries */
			for(const entry of entries) {

				/* skip if entry is not intersecting */
				if(!entry.isIntersecting) continue;

				/* store image node reference */
				const node = entry.target;

				/* process image node */
				processImageNode(node);

				/* stop observing image node */
				observer.unobserve(node);

			}

		}, options.intersectionObserverOptions);

		/* set image node intersection observer reference into reference map */
		refs.set(OBSERVER_REF_ID, observer);

		/* return image node intersection observer reference */
		return observer;

	};

	/**
	 * Return image node intersection observer reference.
	 * @returns {IntersectionObserver} Image node intersection observer reference.
	 */
	const getImageNodeIntersectionObserver = () => {

		/* return image node intersection observer reference */
		return refs.has(OBSERVER_REF_ID) ? refs.get(OBSERVER_REF_ID) : createImageNodeIntersectionObserver();

	};

	/**
	 * Create and append SVG symbol container node into document body.
	 * @returns {SVGSVGElement} SVG symbol container node reference.
	 */
	const createSvgSymbolContainer = () => {

		/* throw error if SVG symbol container node already exists */
		if(refs.has(CONTAINER_REF_ID)) throw new Error(`[${PACKAGE_NAME}] Can not create SVG symbol container node, container node already exists!`);

		/* create svg symbol container node */
		let container = createNode(`<svg xmlns="http://www.w3.org/2000/svg" id="${CONTAINER_ID}" style="display: none !important;"></svg>`);

		/* append svg symbol container node into document body */
		document.body.appendChild(container);

		/* set svg symbol container node reference into reference map */
		refs.set(CONTAINER_REF_ID, container = document.getElementById(CONTAINER_ID));

		/* return svg symbol container node reference */
		return container;

	};

	/**
	 * Return SVG symbol container node reference.
	 * @returns {SVGSVGElement} SVG symbol container node reference.
	 */
	const getSvgSymbolContainer = () => {

		/* return svg symbol container node reference */
		return refs.has(CONTAINER_REF_ID) ? refs.get(CONTAINER_REF_ID) : createSvgSymbolContainer();

	};

	/**
	 * Create document fragment from string representation of node.
	 * @param {String} string - String representation of node.
	 * @returns {DocumentFragment} Document fragment created from string representation of node.
	 */
	const createNode = (string = "") => {

		/* throw error if string argument is missing */
		if(!string) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [string]`);

		/* cast string argument to string */
		string = string.toString().trim();

		/* throw error if string argument is not valid */
		if(!string.startsWith("<") || !string.endsWith(">")) throw new TypeError(`[${PACKAGE_NAME}] Argument is not valid! [string="${string}"]`);

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
		if(!node) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [node]`);

		/* throw error if newNode argument is missing */
		if(!newNode) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [newNode]`);

		/* throw error if node argument is missing parentNode property */
		if(!node.parentNode) throw new Error(`[${PACKAGE_NAME}] Required property is missing! [node.parentNode]`);

		/* replace node with new node */
		node.parentNode.replaceChild(newNode, node);

	};

	/**
	 * Create attribute map from string representation of node.
	 * @param {String} string - String representation of node.
	 * @returns {Map} Attribute map.
	 */
	const createAttributeMapFromString = (string = "") => {

		/* throw error if string argument is missing */
		if(!string) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [string]`);

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
			if(!PATTERN_ATTRIBUTE_NAME.test(name)) throw new TypeError(`[${PACKAGE_NAME}] Attribute name is not valid! [attribute="${name}"]`);

			/* store attribute value reference */
			const value = (attribute[2] || attribute[3] || "").trim();

			/* store attribute in attribute map and handle xhtml transformation if xhtml option is enabled */
			attributes.set(name, value ? value : (options.xhtml ? name : ""));

		}

		/* return attribute map */
		return attributes;

	};

	/**
	 * Create attribute map from named node attribute map.
	 * @param {NamedNodeMap} namedNodeAttributeMap - Named node attribute map.
	 * @returns {Map} Attribute map.
	 */
	const createAttributeMapFromNamedNodeMap = (namedNodeAttributeMap = null) => {
		
		/* throw error if namedNodeAttributeMap argument is missing */
		if(!namedNodeAttributeMap) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [namedNodeAttributeMap]`);

		/* throw error if path argument is not valid */
		if(!(namedNodeAttributeMap instanceof NamedNodeMap)) throw new TypeError(`[${PACKAGE_NAME}] Argument is not valid! [namedNodeAttributeMap]`);

		/* transform named node attribute map into attribute map */
		const attributes = new Map([ ...namedNodeAttributeMap ].map(({ name, value }) => {

			/* parse attribute name */
			name = (name || "").trim().toLowerCase();

			/* throw error if attribute name is not valid */
			if(!PATTERN_ATTRIBUTE_NAME.test(name)) throw new TypeError(`[${PACKAGE_NAME}] Attribute name is not valid! [attribute="${name}"]`);

			/* parse attribute value */
			value = (value || "").trim();

			/* return array of attribute name and attribute value and handle xhtml transformation if xhtml option is enabled */
			return [ name, value ? value : (options.xhtml ? name : "") ];

		}));

		/* return attribute map */
		return attributes;

	};

	/**
	 * Fetch SVG file and create SVG file object.
	 * @param {String} path - Path to SVG file.
	 * @returns {Promise<Object>} SVG file object.
	 */
	const fetchSvgFile = (path = "") => {

		/* throw error if fetch and axios are not available */
		if(!options._fetch && !options._axios) throw new Error(`[${PACKAGE_NAME}] Feature is not supported by browser! [fetch || axios]`);

		/* throw error if path argument is missing */
		if(!path) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [path]`);

		/* cast path argument to string */
		path = path.toString().trim();

		/* throw error if path argument is not valid */
		if(!PATTERN_SVG_FILENAME.test(path)) throw new TypeError(`[${PACKAGE_NAME}] Argument is not valid! [path="${path}"]`);

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
			(options._axios ? options.axios.get : fetch)(file.path)

				/* validate response status and return response data as string */
				.then(response => {

					/* throw error if response status is wrong */
					if(!CORRECT_RESPONSE_STATUSES.has(response.status | 0)) throw new Error(`Wrong response status! [response.status=${response.status}]`); // PACKAGE_NAME prefix is not required here, it will be added in reject handler.

					/* return response data as string */
					return options._axios ? response.data.toString() : response.text();

				})

				/* store and resolve svg file object */
				.then(content => {

					/* store svg file content in svg file object */
					file.content = content.trim();

					/* store svg file object in cache map */
					cache.set(file.path, file.content);

					/* store cache map in local storage */
					if(options._storage && options.cache.persistent) localStorage.setItem(CACHE_ID, JSON.stringify([ ...cache ]));

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
		if(!file) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [file]`);

		/* throw error if node argument is missing */
		if(!node) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [node]`);

		/* throw error if file argument is missing path property */
		if(!file.path) throw new Error(`[${PACKAGE_NAME}] Required property is missing! [file.path]`);

		/* cast path property of file argument to string */
		file.path = file.path.toString().trim();

		/* throw error if path property of file argument is not valid */
		if(!PATTERN_SVG_FILENAME.test(file.path)) throw new TypeError(`[${PACKAGE_NAME}] Argument property is not valid! [file.path="${file.path}"]`);

		/* throw error if file argument is missing content property */
		if(!file.content) throw new Error(`[${PACKAGE_NAME}] Required property is missing! [file.content]`);

		/* cast content property of file argument to string */
		file.content = file.content.toString().trim();

		/* throw error if content property of file argument is not valid */
		if(!PATTERN_SVG_CONTENT.test(file.content)) throw new TypeError(`[${PACKAGE_NAME}] Argument property is not valid! [file.content="${file.content}"]`);

		/* throw error if node argument is missing outerHTML property */
		if(!node.outerHTML) throw new Error(`[${PACKAGE_NAME}] Required property is missing! [node.outerHTML]`);

		/* check if image node should be handled as svg inline sprite */
		if(node[FLAGS_ID].has("sprite")) {

			/* replace svg file content with symbol usage reference, which will be defined in svg symbol container node */
			file.content = file.content.replace(PATTERN_SVG_CONTENT, (svg, attributes, symbol) => { // eslint-disable-line no-unused-vars

				/* check if requested svg file path is already defined in symbol set */
				const symbolAlreadyDefined = symbols.has(file.path);

				/* generate id for symbol */
				const id = `${SYMBOL_ID}-${symbolAlreadyDefined ? [ ...symbols ].indexOf(file.path) : symbols.size}`;

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

					/* add new symbol node into svg symbol container node */
					getSvgSymbolContainer().appendChild(symbolNode.firstChild.firstChild);

					/* store svg file path in symbol set */
					symbols.add(file.path);

				}

				/* return symbol node usage reference */
				return `
					<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"${options.attributes.clone.size && (attributes = createAttributeMapFromString(attributes)) ? ` ${[ ...options.attributes.clone ].filter(attribute => !!attribute && attributes.has(attribute)).map(attribute => `${attribute}="${attributes.get(attribute)}"`).join(" ")}` : "" }>
						<use xlink:href="#${id}" href="#${id}"></use>
					</svg>
				`;

			});

		}

		/* inject attributes from attribute map into svg file content */
		return file.content.replace(PATTERN_SVG_CONTENT, (svg, attributes, symbol) => { // eslint-disable-line no-unused-vars

			/* extract attribute maps */
			const fileAttributes = createAttributeMapFromString(attributes); // svg
			const nodeAttributes = createAttributeMapFromNamedNodeMap(node.attributes); // img

			/* merge attribute maps */
			attributes = new Map([ ...fileAttributes, ...nodeAttributes ]);

			/* store attribute names reference for attributes that should have unique values */
			const uniqueAttributeValues = new Set([ "class" ]);

			/* loop over all attributes to merge */
			for(const attribute of options.attributes.merge) {

				/* extract attribute values */
				const fileValues = fileAttributes.has(attribute) ? fileAttributes.get(attribute).split(PATTERN_WHITESPACE).filter(value => !!value) : []; // svg
				const nodeValues = nodeAttributes.has(attribute) ? nodeAttributes.get(attribute).split(PATTERN_WHITESPACE).filter(value => !!value) : []; // img

				/* skip loop if xhtml option is enabled and there are not any values */
				if(options.xhtml && !fileValues.length && !nodeValues.length) continue;

				/* merge attribute values */
				const values = [ ...fileValues, ...nodeValues ];

				/* set attribute values into attribute map */
				attributes.set(attribute, (uniqueAttributeValues.has(attribute) ? [ ...new Set(values) ] : values).join(" ").trim());

			}

			/* loop over all attributes to add */
			for(const attribute of options.attributes.add) {

				/* extract attribute values */
				let values = attribute.value.split(PATTERN_WHITESPACE).filter(value => !!value);

				/* check if attribute is already defined in attribute map */
				if(attributes.has(attribute.name)) {

					/* throw error if attribute to add already exists and can not be merged */
					if(!options.attributes.merge.has(attribute.name)) throw new Error(`[${PACKAGE_NAME}] Can not add attribute, attribute already exists. [${attribute.name}]`);

					/* extract attribute values */
					const oldValues = attributes.get(attribute.name).split(PATTERN_WHITESPACE).filter(value => !!value);

					/* skip loop if xhtml option is enabled and there are not any values */
					if(options.xhtml && !values.length && !oldValues.length) continue;

					/* merge attribute values */
					values = [ ...oldValues, ...values ];

				}

				/* set attribute values into attribute map */
				attributes.set(attribute.name, (uniqueAttributeValues.has(attribute.name) ? [ ...new Set(values) ] : values).join(" ").trim());

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
					if(!options.attributes.merge.has(dataAttribute)) throw new Error(`[${PACKAGE_NAME}] Can not transform attribute to data-attribute, data-attribute already exists. [${attribute}]`);

					/* extract data-attribute values */
					const oldValues = attributes.get(dataAttribute).split(PATTERN_WHITESPACE).filter(value => !!value);

					/* skip loop if xhtml option is enabled and there are not any values */
					if(options.xhtml && !values.length && !oldValues.length) continue;

					/* merge attribute values */
					values = [ ...oldValues, ...values ];

				}

				/* set data-attribute values into attribute map */
				attributes.set(dataAttribute, (uniqueAttributeValues.has(attribute) ? [ ...new Set(values) ] : values).join(" ").trim());

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
				<svg${attributes.size ? ` ${[ ...attributes.keys() ].filter(attribute => !!attribute).map(attribute => `${attribute}="${attributes.get(attribute)}"`).join(" ")}` : ""}>
					${symbol}
				</svg>
			`;

		});

	};

	/**
	 * Process image node - replace image node with SVG node.
	 * @param {HTMLImageElement} node - Image node.
	 * @returns {*}
	 */
	const processImageNode = (node = null) => {

		/* throw error if node argument is missing */
		if(!node) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [node]`);

		/* throw error if node argument is missing data-src and src property */
		if(!node.dataset.src && !node.src) throw new Error(`[${PACKAGE_NAME}] Required property is missing! [node.data-src || node.src]`);

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
			.catch(error => console.error(`[${PACKAGE_NAME}] ${error.toString()}`)); // eslint-disable-line no-console

	};

	/**
	 * BeforeMount hook function for Vue directive.
	 * @param {HTMLImageElement} node - Node that is binded with directive.
	 * @param {Object} binding - Object containing directive properties.
	 * @param {VNode} vnode - Virtual node created by Vue compiler.
	 * @returns {*}
	 */
	const beforeMount = (node = null, binding = null, vnode = null) => { // eslint-disable-line no-unused-vars

		/* throw error if node argument is missing */
		if(!node) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [node]`);

		/* throw error if vnode argument is missing */
		if(!vnode) throw new Error(`[${PACKAGE_NAME}] Required argument is missing! [vnode]`);

		/* create empty image node flag set if it is not already defined */
		if(!node[FLAGS_ID]) node[FLAGS_ID] = new Set;

		/* skip if image node is already processed */
		if(node[FLAGS_ID].has("processed")) return;

		/* set internal processed flag to image node */
		node[FLAGS_ID].add("processed");

		/* store vnode directives reference based on Vue version */
		const directives = isVue3 ? vnode.dirs : vnode.data.directives;

		/* throw error if image node has more than 1 directive */
		if(directives.length > 1) throw new Error(`[${PACKAGE_NAME}] Node has more than 1 directive! [${isVue3 ? "vnode.dirs" : "vnode.data.directives"}]`);

		/* set internal sprite flag to image node */
		if(!!directives[0].modifiers[options.directive.spriteModifierName]) node[FLAGS_ID].add("sprite"); // eslint-disable-line no-extra-boolean-cast

		/* disable lazy processing of image node if intersection observer is not available */
		if(!options._observer && node.dataset.src) {

			/* transform data-src attribute to src attribute of image node */
			node.src = node.dataset.src;
			delete node.dataset.src;

		}

		/* process image node */
		if(node.dataset.src) getImageNodeIntersectionObserver().observe(node);
		else processImageNode(node);

	};

	/* define vue svg inline directive */
	VueOrApp.directive(options.directive.name, isVue3 ? { beforeMount } : { bind: beforeMount });

};

/* export Vue plugin */
export default { install };
