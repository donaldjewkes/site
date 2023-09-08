import * as adapter from '@astrojs/netlify/netlify-functions.js';
import React, { createElement } from 'react';
import ReactDOM from 'react-dom/server';
import { escape } from 'html-escaper';
import mime from 'mime';
import sharp$1 from 'sharp';
/* empty css                               */import 'http-cache-semantics';
import 'kleur/colors';
import 'node:fs/promises';
import 'node:os';
import 'node:path';
import 'node:url';
import 'magic-string';
import 'node:stream';
import 'slash';
import 'image-size';
import { jsxs, jsx } from 'react/jsx-runtime';
import 'cookie';
import 'string-width';
import 'path-browserify';
import { compile } from 'path-to-regexp';

/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `div` to render that content as VNodes.
 *
 * As a bonus, we can signal to React that this subtree is
 * entirely static and will never change via `shouldComponentUpdate`.
 */
const StaticHtml = ({ value, name }) => {
	if (!value) return null;
	return createElement('astro-slot', {
		name,
		suppressHydrationWarning: true,
		dangerouslySetInnerHTML: { __html: value },
	});
};

/**
 * This tells React to opt-out of re-rendering this subtree,
 * In addition to being a performance optimization,
 * this also allows other frameworks to attach to `children`.
 *
 * See https://preactjs.com/guide/v8/external-dom-mutations
 */
StaticHtml.shouldComponentUpdate = () => false;

const slotName$1 = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
const reactTypeof = Symbol.for('react.element');

function errorIsComingFromPreactComponent(err) {
	return (
		err.message &&
		(err.message.startsWith("Cannot read property '__H'") ||
			err.message.includes("(reading '__H')"))
	);
}

async function check$1(Component, props, children) {
	// Note: there are packages that do some unholy things to create "components".
	// Checking the $$typeof property catches most of these patterns.
	if (typeof Component === 'object') {
		const $$typeof = Component['$$typeof'];
		return $$typeof && $$typeof.toString().slice('Symbol('.length).startsWith('react');
	}
	if (typeof Component !== 'function') return false;

	if (Component.prototype != null && typeof Component.prototype.render === 'function') {
		return React.Component.isPrototypeOf(Component) || React.PureComponent.isPrototypeOf(Component);
	}

	let error = null;
	let isReactComponent = false;
	function Tester(...args) {
		try {
			const vnode = Component(...args);
			if (vnode && vnode['$$typeof'] === reactTypeof) {
				isReactComponent = true;
			}
		} catch (err) {
			if (!errorIsComingFromPreactComponent(err)) {
				error = err;
			}
		}

		return React.createElement('div');
	}

	await renderToStaticMarkup$1(Tester, props, children, {});

	if (error) {
		throw error;
	}
	return isReactComponent;
}

async function getNodeWritable() {
	let nodeStreamBuiltinModuleName = 'stream';
	let { Writable } = await import(/* @vite-ignore */ nodeStreamBuiltinModuleName);
	return Writable;
}

async function renderToStaticMarkup$1(Component, props, { default: children, ...slotted }, metadata) {
	delete props['class'];
	const slots = {};
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName$1(key);
		slots[name] = React.createElement(StaticHtml, { value, name });
	}
	// Note: create newProps to avoid mutating `props` before they are serialized
	const newProps = {
		...props,
		...slots,
	};
	if (children != null) {
		newProps.children = React.createElement(StaticHtml, { value: children });
	}
	const vnode = React.createElement(Component, newProps);
	let html;
	if (metadata && metadata.hydrate) {
		if ('renderToReadableStream' in ReactDOM) {
			html = await renderToReadableStreamAsync(vnode);
		} else {
			html = await renderToPipeableStreamAsync(vnode);
		}
	} else {
		if ('renderToReadableStream' in ReactDOM) {
			html = await renderToReadableStreamAsync(vnode);
		} else {
			html = await renderToStaticNodeStreamAsync(vnode);
		}
	}
	return { html };
}

async function renderToPipeableStreamAsync(vnode) {
	const Writable = await getNodeWritable();
	let html = '';
	return new Promise((resolve, reject) => {
		let error = undefined;
		let stream = ReactDOM.renderToPipeableStream(vnode, {
			onError(err) {
				error = err;
				reject(error);
			},
			onAllReady() {
				stream.pipe(
					new Writable({
						write(chunk, _encoding, callback) {
							html += chunk.toString('utf-8');
							callback();
						},
						destroy() {
							resolve(html);
						},
					})
				);
			},
		});
	});
}

async function renderToStaticNodeStreamAsync(vnode) {
	const Writable = await getNodeWritable();
	let html = '';
	return new Promise((resolve, reject) => {
		let stream = ReactDOM.renderToStaticNodeStream(vnode);
		stream.on('error', (err) => {
			reject(err);
		});
		stream.pipe(
			new Writable({
				write(chunk, _encoding, callback) {
					html += chunk.toString('utf-8');
					callback();
				},
				destroy() {
					resolve(html);
				},
			})
		);
	});
}

/**
 * Use a while loop instead of "for await" due to cloudflare and Vercel Edge issues
 * See https://github.com/facebook/react/issues/24169
 */
async function readResult(stream) {
	const reader = stream.getReader();
	let result = '';
	const decoder = new TextDecoder('utf-8');
	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			if (value) {
				result += decoder.decode(value);
			} else {
				// This closes the decoder
				decoder.decode(new Uint8Array());
			}

			return result;
		}
		result += decoder.decode(value, { stream: true });
	}
}

async function renderToReadableStreamAsync(vnode) {
	return await readResult(await ReactDOM.renderToReadableStream(vnode));
}

const _renderer1 = {
	check: check$1,
	renderToStaticMarkup: renderToStaticMarkup$1,
};

const ASTRO_VERSION = "1.6.8";

function createDeprecatedFetchContentFn() {
  return () => {
    throw new Error("Deprecated: Astro.fetchContent() has been replaced with Astro.glob().");
  };
}
function createAstroGlobFn() {
  const globHandler = (importMetaGlobResult, globValue) => {
    let allEntries = [...Object.values(importMetaGlobResult)];
    if (allEntries.length === 0) {
      throw new Error(`Astro.glob(${JSON.stringify(globValue())}) - no matches found.`);
    }
    return Promise.all(allEntries.map((fn) => fn()));
  };
  return globHandler;
}
function createAstro(filePathname, _site, projectRootStr) {
  const site = _site ? new URL(_site) : void 0;
  const referenceURL = new URL(filePathname, `http://localhost`);
  const projectRoot = new URL(projectRootStr);
  return {
    site,
    generator: `Astro v${ASTRO_VERSION}`,
    fetchContent: createDeprecatedFetchContentFn(),
    glob: createAstroGlobFn(),
    resolve(...segments) {
      let resolved = segments.reduce((u, segment) => new URL(segment, u), referenceURL).pathname;
      if (resolved.startsWith(projectRoot.pathname)) {
        resolved = "/" + resolved.slice(projectRoot.pathname.length);
      }
      return resolved;
    }
  };
}

const escapeHTML = escape;
class HTMLString extends String {
  get [Symbol.toStringTag]() {
    return "HTMLString";
  }
}
const markHTMLString = (value) => {
  if (value instanceof HTMLString) {
    return value;
  }
  if (typeof value === "string") {
    return new HTMLString(value);
  }
  return value;
};
function isHTMLString(value) {
  return Object.prototype.toString.call(value) === "[object HTMLString]";
}

var idle_prebuilt_default = `(self.Astro=self.Astro||{}).idle=t=>{const e=async()=>{await(await t())()};"requestIdleCallback"in window?window.requestIdleCallback(e):setTimeout(e,200)},window.dispatchEvent(new Event("astro:idle"));`;

var load_prebuilt_default = `(self.Astro=self.Astro||{}).load=a=>{(async()=>await(await a())())()},window.dispatchEvent(new Event("astro:load"));`;

var media_prebuilt_default = `(self.Astro=self.Astro||{}).media=(s,a)=>{const t=async()=>{await(await s())()};if(a.value){const e=matchMedia(a.value);e.matches?t():e.addEventListener("change",t,{once:!0})}},window.dispatchEvent(new Event("astro:media"));`;

var only_prebuilt_default = `(self.Astro=self.Astro||{}).only=t=>{(async()=>await(await t())())()},window.dispatchEvent(new Event("astro:only"));`;

var visible_prebuilt_default = `(self.Astro=self.Astro||{}).visible=(s,c,n)=>{const r=async()=>{await(await s())()};let i=new IntersectionObserver(e=>{for(const t of e)if(!!t.isIntersecting){i.disconnect(),r();break}});for(let e=0;e<n.children.length;e++){const t=n.children[e];i.observe(t)}},window.dispatchEvent(new Event("astro:visible"));`;

var astro_island_prebuilt_default = `var l;{const c={0:t=>t,1:t=>JSON.parse(t,o),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(JSON.parse(t,o)),5:t=>new Set(JSON.parse(t,o)),6:t=>BigInt(t),7:t=>new URL(t),8:t=>new Uint8Array(JSON.parse(t)),9:t=>new Uint16Array(JSON.parse(t)),10:t=>new Uint32Array(JSON.parse(t))},o=(t,s)=>{if(t===""||!Array.isArray(s))return s;const[e,n]=s;return e in c?c[e](n):void 0};customElements.get("astro-island")||customElements.define("astro-island",(l=class extends HTMLElement{constructor(){super(...arguments);this.hydrate=()=>{if(!this.hydrator||this.parentElement&&this.parentElement.closest("astro-island[ssr]"))return;const s=this.querySelectorAll("astro-slot"),e={},n=this.querySelectorAll("template[data-astro-template]");for(const r of n){const i=r.closest(this.tagName);!i||!i.isSameNode(this)||(e[r.getAttribute("data-astro-template")||"default"]=r.innerHTML,r.remove())}for(const r of s){const i=r.closest(this.tagName);!i||!i.isSameNode(this)||(e[r.getAttribute("name")||"default"]=r.innerHTML)}const a=this.hasAttribute("props")?JSON.parse(this.getAttribute("props"),o):{};this.hydrator(this)(this.Component,a,e,{client:this.getAttribute("client")}),this.removeAttribute("ssr"),window.removeEventListener("astro:hydrate",this.hydrate),window.dispatchEvent(new CustomEvent("astro:hydrate"))}}connectedCallback(){!this.hasAttribute("await-children")||this.firstChild?this.childrenConnectedCallback():new MutationObserver((s,e)=>{e.disconnect(),this.childrenConnectedCallback()}).observe(this,{childList:!0})}async childrenConnectedCallback(){window.addEventListener("astro:hydrate",this.hydrate);let s=this.getAttribute("before-hydration-url");s&&await import(s),this.start()}start(){const s=JSON.parse(this.getAttribute("opts")),e=this.getAttribute("client");if(Astro[e]===void 0){window.addEventListener(\`astro:\${e}\`,()=>this.start(),{once:!0});return}Astro[e](async()=>{const n=this.getAttribute("renderer-url"),[a,{default:r}]=await Promise.all([import(this.getAttribute("component-url")),n?import(n):()=>()=>{}]),i=this.getAttribute("component-export")||"default";if(!i.includes("."))this.Component=a[i];else{this.Component=a;for(const d of i.split("."))this.Component=this.Component[d]}return this.hydrator=r,this.hydrate},s,this)}attributeChangedCallback(){this.hydrator&&this.hydrate()}},l.observedAttributes=["props"],l))}`;

function determineIfNeedsHydrationScript(result) {
  if (result._metadata.hasHydrationScript) {
    return false;
  }
  return result._metadata.hasHydrationScript = true;
}
const hydrationScripts = {
  idle: idle_prebuilt_default,
  load: load_prebuilt_default,
  only: only_prebuilt_default,
  media: media_prebuilt_default,
  visible: visible_prebuilt_default
};
function determinesIfNeedsDirectiveScript(result, directive) {
  if (result._metadata.hasDirectives.has(directive)) {
    return false;
  }
  result._metadata.hasDirectives.add(directive);
  return true;
}
function getDirectiveScriptText(directive) {
  if (!(directive in hydrationScripts)) {
    throw new Error(`Unknown directive: ${directive}`);
  }
  const directiveScriptText = hydrationScripts[directive];
  return directiveScriptText;
}
function getPrescripts(type, directive) {
  switch (type) {
    case "both":
      return `<style>astro-island,astro-slot{display:contents}</style><script>${getDirectiveScriptText(directive) + astro_island_prebuilt_default}<\/script>`;
    case "directive":
      return `<script>${getDirectiveScriptText(directive)}<\/script>`;
  }
  return "";
}

const defineErrors = (errs) => errs;
const AstroErrorData = defineErrors({
  UnknownCompilerError: {
    code: 1e3
  },
  StaticRedirectNotAllowed: {
    code: 3001,
    message: "Redirects are only available when using output: 'server'. Update your Astro config if you need SSR features.",
    hint: "See https://docs.astro.build/en/guides/server-side-rendering/#enabling-ssr-in-your-project for more information on how to enable SSR."
  },
  SSRClientAddressNotAvailableInAdapter: {
    code: 3002,
    message: (adapterName) => `Astro.clientAddress is not available in the ${adapterName} adapter. File an issue with the adapter to add support.`
  },
  StaticClientAddressNotAvailable: {
    code: 3003,
    message: "Astro.clientAddress is only available when using output: 'server'. Update your Astro config if you need SSR features.",
    hint: "See https://docs.astro.build/en/guides/server-side-rendering/#enabling-ssr-in-your-project for more information on how to enable SSR."
  },
  NoMatchingStaticPathFound: {
    code: 3004,
    message: (pathName) => `A getStaticPaths route pattern was matched, but no matching static path was found for requested path ${pathName}.`,
    hint: (possibleRoutes) => `Possible dynamic routes being matched: ${possibleRoutes.join(", ")}.`
  },
  OnlyResponseCanBeReturned: {
    code: 3005,
    message: (route, returnedValue) => `Route ${route ? route : ""} returned a ${returnedValue}. Only a Response can be returned from Astro files.`,
    hint: "See https://docs.astro.build/en/guides/server-side-rendering/#response for more information."
  },
  MissingMediaQueryDirective: {
    code: 3006,
    message: (componentName) => `Media query not provided for "client:media" directive. A media query similar to <${componentName} client:media="(max-width: 600px)" /> must be provided`
  },
  NoMatchingRenderer: {
    code: 3007,
    message: (componentName, componentExtension, plural, validRenderersCount) => `Unable to render ${componentName}!

${validRenderersCount > 0 ? `There ${plural ? "are" : "is"} ${validRenderersCount} renderer${plural ? "s" : ""} configured in your \`astro.config.mjs\` file,
but ${plural ? "none were" : "it was not"} able to server-side render ${componentName}.` : `No valid renderer was found ${componentExtension ? `for the .${componentExtension} file extension.` : `for this file extension.`}`}`,
    hint: (probableRenderers) => `Did you mean to enable the ${probableRenderers} integration?

See https://docs.astro.build/en/core-concepts/framework-components/ for more information on how to install and configure integrations.`
  },
  NoClientEntrypoint: {
    code: 3008,
    message: (componentName, clientDirective, rendererName) => `${componentName} component has a \`client:${clientDirective}\` directive, but no client entrypoint was provided by ${rendererName}!`,
    hint: "See https://docs.astro.build/en/reference/integrations-reference/#addrenderer-option for more information on how to configure your renderer."
  },
  NoClientOnlyHint: {
    code: 3009,
    message: (componentName) => `Unable to render ${componentName}! When using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.`,
    hint: (probableRenderers) => `Did you mean to pass client:only="${probableRenderers}"? See https://docs.astro.build/en/reference/directives-reference/#clientonly for more information on client:only`
  },
  InvalidStaticPathParam: {
    code: 3010,
    message: (paramType) => `Invalid params given to getStaticPaths path. Expected an object, got ${paramType}`,
    hint: "See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths."
  },
  InvalidGetStaticPathsReturn: {
    code: 3011,
    message: (returnType) => `Invalid type returned by getStaticPaths. Expected an array, got ${returnType}`,
    hint: "See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths."
  },
  GetStaticPathsDeprecatedRSS: {
    code: 3012,
    message: "The RSS helper has been removed from getStaticPaths! Try the new @astrojs/rss package instead.",
    hint: "See https://docs.astro.build/en/guides/rss/ for more information."
  },
  GetStaticPathsExpectedParams: {
    code: 3013,
    message: "Missing or empty required params property on getStaticPaths route",
    hint: "See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths."
  },
  GetStaticPathsInvalidRouteParam: {
    code: 3014,
    message: (key, value) => `Invalid getStaticPaths route parameter for \`${key}\`. Expected a string or number, received \`${typeof value}\` ("${value}")`,
    hint: "See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths."
  },
  GetStaticPathsRequired: {
    code: 3015,
    message: "getStaticPaths() function is required for dynamic routes. Make sure that you `export` a `getStaticPaths` function from your dynamic route.",
    hint: `See https://docs.astro.build/en/core-concepts/routing/#dynamic-routes for more information on dynamic routes.

Alternatively, set \`output: "server"\` in your Astro config file to switch to a non-static server build.
See https://docs.astro.build/en/guides/server-side-rendering/ for more information on non-static rendering.`
  },
  ReservedSlotName: {
    code: 3016,
    message: (slotName) => `Unable to create a slot named "${slotName}". ${slotName}" is a reserved slot name! Please update the name of this slot.`
  },
  NoAdapterInstalled: {
    code: 3017,
    message: `Cannot use \`output: 'server'\` without an adapter. Please install and configure the appropriate server adapter for your final deployment.`,
    hint: "See https://docs.astro.build/en/guides/server-side-rendering/ for more information."
  },
  NoMatchingImport: {
    code: 3018,
    message: (componentName) => `Could not render ${componentName}. No matching import has been found for ${componentName}.`,
    hint: "Please make sure the component is properly imported."
  },
  UnknownCSSError: {
    code: 4e3
  },
  CSSSyntaxError: {
    code: 4001
  },
  UnknownViteError: {
    code: 5e3
  },
  FailedToLoadModuleSSR: {
    code: 5001,
    message: (importName) => `Could not import "${importName}".`,
    hint: "This is often caused by a typo in the import path. Please make sure the file exists."
  },
  InvalidGlob: {
    code: 5002,
    message: (globPattern) => `Invalid glob pattern: "${globPattern}". Glob patterns must start with './', '../' or '/'.`,
    hint: "See https://docs.astro.build/en/guides/imports/#glob-patterns for more information on supported glob patterns."
  },
  UnknownMarkdownError: {
    code: 6e3
  },
  MarkdownFrontmatterParseError: {
    code: 6001
  },
  UnknownConfigError: {
    code: 7e3
  },
  ConfigNotFound: {
    code: 7001,
    message: (configFile) => `Unable to resolve --config "${configFile}"! Does the file exist?`
  },
  ConfigLegacyKey: {
    code: 7002,
    message: (legacyConfigKey) => `Legacy configuration detected: "${legacyConfigKey}".`,
    hint: "Please update your configuration to the new format!\nSee https://astro.build/config for more information."
  },
  UnknownError: {
    code: 99999
  }
});

function normalizeLF(code) {
  return code.replace(/\r\n|\r(?!\n)|\n/g, "\n");
}
function getErrorDataByCode(code) {
  const entry = Object.entries(AstroErrorData).find((data) => data[1].code === code);
  if (entry) {
    return {
      name: entry[0],
      data: entry[1]
    };
  }
}

function codeFrame(src, loc) {
  if (!loc || loc.line === void 0 || loc.column === void 0) {
    return "";
  }
  const lines = normalizeLF(src).split("\n").map((ln) => ln.replace(/\t/g, "  "));
  const visibleLines = [];
  for (let n = -2; n <= 2; n++) {
    if (lines[loc.line + n])
      visibleLines.push(loc.line + n);
  }
  let gutterWidth = 0;
  for (const lineNo of visibleLines) {
    let w = `> ${lineNo}`;
    if (w.length > gutterWidth)
      gutterWidth = w.length;
  }
  let output = "";
  for (const lineNo of visibleLines) {
    const isFocusedLine = lineNo === loc.line - 1;
    output += isFocusedLine ? "> " : "  ";
    output += `${lineNo + 1} | ${lines[lineNo]}
`;
    if (isFocusedLine)
      output += `${Array.from({ length: gutterWidth }).join(" ")}  | ${Array.from({
        length: loc.column
      }).join(" ")}^
`;
  }
  return output;
}

class AstroError extends Error {
  constructor(props, ...params) {
    var _a;
    super(...params);
    this.type = "AstroError";
    const { code, name, message, stack, location, hint, frame } = props;
    this.code = code;
    if (name) {
      this.name = name;
    } else {
      this.name = ((_a = getErrorDataByCode(this.code)) == null ? void 0 : _a.name) ?? "UnknownError";
    }
    if (message)
      this.message = message;
    this.stack = stack ? stack : this.stack;
    this.loc = location;
    this.hint = hint;
    this.frame = frame;
  }
  setErrorCode(errorCode) {
    var _a;
    this.code = errorCode;
    this.name = ((_a = getErrorDataByCode(this.code)) == null ? void 0 : _a.name) ?? "UnknownError";
  }
  setLocation(location) {
    this.loc = location;
  }
  setName(name) {
    this.name = name;
  }
  setMessage(message) {
    this.message = message;
  }
  setHint(hint) {
    this.hint = hint;
  }
  setFrame(source, location) {
    this.frame = codeFrame(source, location);
  }
  static is(err) {
    return err.type === "AstroError";
  }
}

const PROP_TYPE = {
  Value: 0,
  JSON: 1,
  RegExp: 2,
  Date: 3,
  Map: 4,
  Set: 5,
  BigInt: 6,
  URL: 7,
  Uint8Array: 8,
  Uint16Array: 9,
  Uint32Array: 10
};
function serializeArray(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = value.map((v) => {
    return convertToSerializedForm(v, metadata, parents);
  });
  parents.delete(value);
  return serialized;
}
function serializeObject(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = Object.fromEntries(
    Object.entries(value).map(([k, v]) => {
      return [k, convertToSerializedForm(v, metadata, parents)];
    })
  );
  parents.delete(value);
  return serialized;
}
function convertToSerializedForm(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  const tag = Object.prototype.toString.call(value);
  switch (tag) {
    case "[object Date]": {
      return [PROP_TYPE.Date, value.toISOString()];
    }
    case "[object RegExp]": {
      return [PROP_TYPE.RegExp, value.source];
    }
    case "[object Map]": {
      return [
        PROP_TYPE.Map,
        JSON.stringify(serializeArray(Array.from(value), metadata, parents))
      ];
    }
    case "[object Set]": {
      return [
        PROP_TYPE.Set,
        JSON.stringify(serializeArray(Array.from(value), metadata, parents))
      ];
    }
    case "[object BigInt]": {
      return [PROP_TYPE.BigInt, value.toString()];
    }
    case "[object URL]": {
      return [PROP_TYPE.URL, value.toString()];
    }
    case "[object Array]": {
      return [PROP_TYPE.JSON, JSON.stringify(serializeArray(value, metadata, parents))];
    }
    case "[object Uint8Array]": {
      return [PROP_TYPE.Uint8Array, JSON.stringify(Array.from(value))];
    }
    case "[object Uint16Array]": {
      return [PROP_TYPE.Uint16Array, JSON.stringify(Array.from(value))];
    }
    case "[object Uint32Array]": {
      return [PROP_TYPE.Uint32Array, JSON.stringify(Array.from(value))];
    }
    default: {
      if (value !== null && typeof value === "object") {
        return [PROP_TYPE.Value, serializeObject(value, metadata, parents)];
      } else {
        return [PROP_TYPE.Value, value];
      }
    }
  }
}
function serializeProps(props, metadata) {
  const serialized = JSON.stringify(serializeObject(props, metadata));
  return serialized;
}

function serializeListValue(value) {
  const hash = {};
  push(value);
  return Object.keys(hash).join(" ");
  function push(item) {
    if (item && typeof item.forEach === "function")
      item.forEach(push);
    else if (item === Object(item))
      Object.keys(item).forEach((name) => {
        if (item[name])
          push(name);
      });
    else {
      item = item === false || item == null ? "" : String(item).trim();
      if (item) {
        item.split(/\s+/).forEach((name) => {
          hash[name] = true;
        });
      }
    }
  }
}

const HydrationDirectivesRaw = ["load", "idle", "media", "visible", "only"];
const HydrationDirectives = new Set(HydrationDirectivesRaw);
const HydrationDirectiveProps = new Set(HydrationDirectivesRaw.map((n) => `client:${n}`));
function extractDirectives(displayName, inputProps) {
  let extracted = {
    isPage: false,
    hydration: null,
    props: {}
  };
  for (const [key, value] of Object.entries(inputProps)) {
    if (key.startsWith("server:")) {
      if (key === "server:root") {
        extracted.isPage = true;
      }
    }
    if (key.startsWith("client:")) {
      if (!extracted.hydration) {
        extracted.hydration = {
          directive: "",
          value: "",
          componentUrl: "",
          componentExport: { value: "" }
        };
      }
      switch (key) {
        case "client:component-path": {
          extracted.hydration.componentUrl = value;
          break;
        }
        case "client:component-export": {
          extracted.hydration.componentExport.value = value;
          break;
        }
        case "client:component-hydration": {
          break;
        }
        case "client:display-name": {
          break;
        }
        default: {
          extracted.hydration.directive = key.split(":")[1];
          extracted.hydration.value = value;
          if (!HydrationDirectives.has(extracted.hydration.directive)) {
            throw new Error(
              `Error: invalid hydration directive "${key}". Supported hydration methods: ${Array.from(
                HydrationDirectiveProps
              ).join(", ")}`
            );
          }
          if (extracted.hydration.directive === "media" && typeof extracted.hydration.value !== "string") {
            throw new AstroError({
              ...AstroErrorData.MissingMediaQueryDirective,
              message: AstroErrorData.MissingMediaQueryDirective.message(displayName)
            });
          }
          break;
        }
      }
    } else if (key === "class:list") {
      if (value) {
        extracted.props[key.slice(0, -5)] = serializeListValue(value);
      }
    } else {
      extracted.props[key] = value;
    }
  }
  for (const sym of Object.getOwnPropertySymbols(inputProps)) {
    extracted.props[sym] = inputProps[sym];
  }
  return extracted;
}
async function generateHydrateScript(scriptOptions, metadata) {
  const { renderer, result, astroId, props, attrs } = scriptOptions;
  const { hydrate, componentUrl, componentExport } = metadata;
  if (!componentExport.value) {
    throw new Error(
      `Unable to resolve a valid export for "${metadata.displayName}"! Please open an issue at https://astro.build/issues!`
    );
  }
  const island = {
    children: "",
    props: {
      uid: astroId
    }
  };
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      island.props[key] = escapeHTML(value);
    }
  }
  island.props["component-url"] = await result.resolve(decodeURI(componentUrl));
  if (renderer.clientEntrypoint) {
    island.props["component-export"] = componentExport.value;
    island.props["renderer-url"] = await result.resolve(decodeURI(renderer.clientEntrypoint));
    island.props["props"] = escapeHTML(serializeProps(props, metadata));
  }
  island.props["ssr"] = "";
  island.props["client"] = hydrate;
  let beforeHydrationUrl = await result.resolve("astro:scripts/before-hydration.js");
  if (beforeHydrationUrl.length) {
    island.props["before-hydration-url"] = beforeHydrationUrl;
  }
  island.props["opts"] = escapeHTML(
    JSON.stringify({
      name: metadata.displayName,
      value: metadata.hydrateArgs || ""
    })
  );
  return island;
}

function validateComponentProps(props, displayName) {
  var _a;
  if (((_a = (Object.assign({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true},{_:process.env._,}))) == null ? void 0 : _a.DEV) && props != null) {
    for (const prop of Object.keys(props)) {
      if (HydrationDirectiveProps.has(prop)) {
        console.warn(
          `You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
        );
      }
    }
  }
}
class AstroComponent {
  constructor(htmlParts, expressions) {
    this.htmlParts = htmlParts;
    this.expressions = expressions;
  }
  get [Symbol.toStringTag]() {
    return "AstroComponent";
  }
  async *[Symbol.asyncIterator]() {
    const { htmlParts, expressions } = this;
    for (let i = 0; i < htmlParts.length; i++) {
      const html = htmlParts[i];
      const expression = expressions[i];
      yield markHTMLString(html);
      yield* renderChild(expression);
    }
  }
}
function isAstroComponent(obj) {
  return typeof obj === "object" && Object.prototype.toString.call(obj) === "[object AstroComponent]";
}
function isAstroComponentFactory(obj) {
  return obj == null ? false : obj.isAstroComponentFactory === true;
}
async function* renderAstroComponent(component) {
  for await (const value of component) {
    if (value || value === 0) {
      for await (const chunk of renderChild(value)) {
        switch (chunk.type) {
          case "directive": {
            yield chunk;
            break;
          }
          default: {
            yield markHTMLString(chunk);
            break;
          }
        }
      }
    }
  }
}
async function renderToString(result, componentFactory, props, children) {
  const Component = await componentFactory(result, props, children);
  if (!isAstroComponent(Component)) {
    const response = Component;
    throw response;
  }
  let parts = new HTMLParts();
  for await (const chunk of renderAstroComponent(Component)) {
    parts.append(chunk, result);
  }
  return parts.toString();
}
async function renderToIterable(result, componentFactory, displayName, props, children) {
  validateComponentProps(props, displayName);
  const Component = await componentFactory(result, props, children);
  if (!isAstroComponent(Component)) {
    console.warn(
      `Returning a Response is only supported inside of page components. Consider refactoring this logic into something like a function that can be used in the page.`
    );
    const response = Component;
    throw response;
  }
  return renderAstroComponent(Component);
}
async function renderTemplate(htmlParts, ...expressions) {
  return new AstroComponent(htmlParts, expressions);
}

async function* renderChild(child) {
  child = await child;
  if (child instanceof SlotString) {
    if (child.instructions) {
      yield* child.instructions;
    }
    yield child;
  } else if (isHTMLString(child)) {
    yield child;
  } else if (Array.isArray(child)) {
    for (const value of child) {
      yield markHTMLString(await renderChild(value));
    }
  } else if (typeof child === "function") {
    yield* renderChild(child());
  } else if (typeof child === "string") {
    yield markHTMLString(escapeHTML(child));
  } else if (!child && child !== 0) ; else if (child instanceof AstroComponent || Object.prototype.toString.call(child) === "[object AstroComponent]") {
    yield* renderAstroComponent(child);
  } else if (ArrayBuffer.isView(child)) {
    yield child;
  } else if (typeof child === "object" && (Symbol.asyncIterator in child || Symbol.iterator in child)) {
    yield* child;
  } else {
    yield child;
  }
}

const slotString = Symbol.for("astro:slot-string");
class SlotString extends HTMLString {
  constructor(content, instructions) {
    super(content);
    this.instructions = instructions;
    this[slotString] = true;
  }
}
function isSlotString(str) {
  return !!str[slotString];
}
async function renderSlot(_result, slotted, fallback) {
  if (slotted) {
    let iterator = renderChild(slotted);
    let content = "";
    let instructions = null;
    for await (const chunk of iterator) {
      if (chunk.type === "directive") {
        if (instructions === null) {
          instructions = [];
        }
        instructions.push(chunk);
      } else {
        content += chunk;
      }
    }
    return markHTMLString(new SlotString(content, instructions));
  }
  return fallback;
}
async function renderSlots(result, slots = {}) {
  let slotInstructions = null;
  let children = {};
  if (slots) {
    await Promise.all(
      Object.entries(slots).map(
        ([key, value]) => renderSlot(result, value).then((output) => {
          if (output.instructions) {
            if (slotInstructions === null) {
              slotInstructions = [];
            }
            slotInstructions.push(...output.instructions);
          }
          children[key] = output;
        })
      )
    );
  }
  return { slotInstructions, children };
}

const Fragment = Symbol.for("astro:fragment");
const Renderer = Symbol.for("astro:renderer");
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function stringifyChunk(result, chunk) {
  switch (chunk.type) {
    case "directive": {
      const { hydration } = chunk;
      let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
      let needsDirectiveScript = hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);
      let prescriptType = needsHydrationScript ? "both" : needsDirectiveScript ? "directive" : null;
      if (prescriptType) {
        let prescripts = getPrescripts(prescriptType, hydration.directive);
        return markHTMLString(prescripts);
      } else {
        return "";
      }
    }
    default: {
      if (isSlotString(chunk)) {
        let out = "";
        const c = chunk;
        if (c.instructions) {
          for (const instr of c.instructions) {
            out += stringifyChunk(result, instr);
          }
        }
        out += chunk.toString();
        return out;
      }
      return chunk.toString();
    }
  }
}
class HTMLParts {
  constructor() {
    this.parts = "";
  }
  append(part, result) {
    if (ArrayBuffer.isView(part)) {
      this.parts += decoder.decode(part);
    } else {
      this.parts += stringifyChunk(result, part);
    }
  }
  toString() {
    return this.parts;
  }
  toArrayBuffer() {
    return encoder.encode(this.parts);
  }
}

const ClientOnlyPlaceholder = "astro-client-only";
class Skip {
  constructor(vnode) {
    this.vnode = vnode;
    this.count = 0;
  }
  increment() {
    this.count++;
  }
  haveNoTried() {
    return this.count === 0;
  }
  isCompleted() {
    return this.count > 2;
  }
}
Skip.symbol = Symbol("astro:jsx:skip");
let originalConsoleError;
let consoleFilterRefs = 0;
async function renderJSX(result, vnode) {
  switch (true) {
    case vnode instanceof HTMLString:
      if (vnode.toString().trim() === "") {
        return "";
      }
      return vnode;
    case typeof vnode === "string":
      return markHTMLString(escapeHTML(vnode));
    case typeof vnode === "function":
      return vnode;
    case (!vnode && vnode !== 0):
      return "";
    case Array.isArray(vnode):
      return markHTMLString(
        (await Promise.all(vnode.map((v) => renderJSX(result, v)))).join("")
      );
  }
  let skip;
  if (vnode.props) {
    if (vnode.props[Skip.symbol]) {
      skip = vnode.props[Skip.symbol];
    } else {
      skip = new Skip(vnode);
    }
  } else {
    skip = new Skip(vnode);
  }
  return renderJSXVNode(result, vnode, skip);
}
async function renderJSXVNode(result, vnode, skip) {
  if (isVNode(vnode)) {
    switch (true) {
      case !vnode.type: {
        throw new Error(`Unable to render ${result._metadata.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`);
      }
      case vnode.type === Symbol.for("astro:fragment"):
        return renderJSX(result, vnode.props.children);
      case vnode.type.isAstroComponentFactory: {
        let props = {};
        let slots = {};
        for (const [key, value] of Object.entries(vnode.props ?? {})) {
          if (key === "children" || value && typeof value === "object" && value["$$slot"]) {
            slots[key === "children" ? "default" : key] = () => renderJSX(result, value);
          } else {
            props[key] = value;
          }
        }
        return markHTMLString(await renderToString(result, vnode.type, props, slots));
      }
      case (!vnode.type && vnode.type !== 0):
        return "";
      case (typeof vnode.type === "string" && vnode.type !== ClientOnlyPlaceholder):
        return markHTMLString(await renderElement$1(result, vnode.type, vnode.props ?? {}));
    }
    if (vnode.type) {
      let extractSlots2 = function(child) {
        if (Array.isArray(child)) {
          return child.map((c) => extractSlots2(c));
        }
        if (!isVNode(child)) {
          _slots.default.push(child);
          return;
        }
        if ("slot" in child.props) {
          _slots[child.props.slot] = [..._slots[child.props.slot] ?? [], child];
          delete child.props.slot;
          return;
        }
        _slots.default.push(child);
      };
      if (typeof vnode.type === "function" && vnode.type["astro:renderer"]) {
        skip.increment();
      }
      if (typeof vnode.type === "function" && vnode.props["server:root"]) {
        const output2 = await vnode.type(vnode.props ?? {});
        return await renderJSX(result, output2);
      }
      if (typeof vnode.type === "function") {
        if (skip.haveNoTried() || skip.isCompleted()) {
          useConsoleFilter();
          try {
            const output2 = await vnode.type(vnode.props ?? {});
            let renderResult;
            if (output2 && output2[AstroJSX]) {
              renderResult = await renderJSXVNode(result, output2, skip);
              return renderResult;
            } else if (!output2) {
              renderResult = await renderJSXVNode(result, output2, skip);
              return renderResult;
            }
          } catch (e) {
            if (skip.isCompleted()) {
              throw e;
            }
            skip.increment();
          } finally {
            finishUsingConsoleFilter();
          }
        } else {
          skip.increment();
        }
      }
      const { children = null, ...props } = vnode.props ?? {};
      const _slots = {
        default: []
      };
      extractSlots2(children);
      for (const [key, value] of Object.entries(props)) {
        if (value["$$slot"]) {
          _slots[key] = value;
          delete props[key];
        }
      }
      const slotPromises = [];
      const slots = {};
      for (const [key, value] of Object.entries(_slots)) {
        slotPromises.push(
          renderJSX(result, value).then((output2) => {
            if (output2.toString().trim().length === 0)
              return;
            slots[key] = () => output2;
          })
        );
      }
      await Promise.all(slotPromises);
      props[Skip.symbol] = skip;
      let output;
      if (vnode.type === ClientOnlyPlaceholder && vnode.props["client:only"]) {
        output = await renderComponent(
          result,
          vnode.props["client:display-name"] ?? "",
          null,
          props,
          slots
        );
      } else {
        output = await renderComponent(
          result,
          typeof vnode.type === "function" ? vnode.type.name : vnode.type,
          vnode.type,
          props,
          slots
        );
      }
      if (typeof output !== "string" && Symbol.asyncIterator in output) {
        let parts = new HTMLParts();
        for await (const chunk of output) {
          parts.append(chunk, result);
        }
        return markHTMLString(parts.toString());
      } else {
        return markHTMLString(output);
      }
    }
  }
  return markHTMLString(`${vnode}`);
}
async function renderElement$1(result, tag, { children, ...props }) {
  return markHTMLString(
    `<${tag}${spreadAttributes(props)}${markHTMLString(
      (children == null || children == "") && voidElementNames.test(tag) ? `/>` : `>${children == null ? "" : await renderJSX(result, children)}</${tag}>`
    )}`
  );
}
function useConsoleFilter() {
  consoleFilterRefs++;
  if (!originalConsoleError) {
    originalConsoleError = console.error;
    try {
      console.error = filteredConsoleError;
    } catch (error) {
    }
  }
}
function finishUsingConsoleFilter() {
  consoleFilterRefs--;
}
function filteredConsoleError(msg, ...rest) {
  if (consoleFilterRefs > 0 && typeof msg === "string") {
    const isKnownReactHookError = msg.includes("Warning: Invalid hook call.") && msg.includes("https://reactjs.org/link/invalid-hook-call");
    if (isKnownReactHookError)
      return;
  }
  originalConsoleError(msg, ...rest);
}

/**
 * shortdash - https://github.com/bibig/node-shorthash
 *
 * @license
 *
 * (The MIT License)
 *
 * Copyright (c) 2013 Bibig <bibig@me.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
const dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY";
const binary = dictionary.length;
function bitwise(str) {
  let hash = 0;
  if (str.length === 0)
    return hash;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return hash;
}
function shorthash(text) {
  let num;
  let result = "";
  let integer = bitwise(text);
  const sign = integer < 0 ? "Z" : "";
  integer = Math.abs(integer);
  while (integer >= binary) {
    num = integer % binary;
    integer = Math.floor(integer / binary);
    result = dictionary[num] + result;
  }
  if (integer > 0) {
    result = dictionary[integer] + result;
  }
  return sign + result;
}

const voidElementNames = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
const htmlBooleanAttributes = /^(allowfullscreen|async|autofocus|autoplay|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|loop|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|itemscope)$/i;
const htmlEnumAttributes = /^(contenteditable|draggable|spellcheck|value)$/i;
const svgEnumAttributes = /^(autoReverse|externalResourcesRequired|focusable|preserveAlpha)$/i;
const STATIC_DIRECTIVES = /* @__PURE__ */ new Set(["set:html", "set:text"]);
const toIdent = (k) => k.trim().replace(/(?:(?!^)\b\w|\s+|[^\w]+)/g, (match, index) => {
  if (/[^\w]|\s/.test(match))
    return "";
  return index === 0 ? match : match.toUpperCase();
});
const toAttributeString = (value, shouldEscape = true) => shouldEscape ? String(value).replace(/&/g, "&#38;").replace(/"/g, "&#34;") : value;
const kebab = (k) => k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const toStyleString = (obj) => Object.entries(obj).map(([k, v]) => `${kebab(k)}:${v}`).join(";");
function defineScriptVars(vars) {
  let output = "";
  for (const [key, value] of Object.entries(vars)) {
    output += `const ${toIdent(key)} = ${JSON.stringify(value)};
`;
  }
  return markHTMLString(output);
}
function formatList(values) {
  if (values.length === 1) {
    return values[0];
  }
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}
function addAttribute(value, key, shouldEscape = true) {
  if (value == null) {
    return "";
  }
  if (value === false) {
    if (htmlEnumAttributes.test(key) || svgEnumAttributes.test(key)) {
      return markHTMLString(` ${key}="false"`);
    }
    return "";
  }
  if (STATIC_DIRECTIVES.has(key)) {
    console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
    return "";
  }
  if (key === "class:list") {
    const listValue = toAttributeString(serializeListValue(value), shouldEscape);
    if (listValue === "") {
      return "";
    }
    return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
  }
  if (key === "style" && !(value instanceof HTMLString) && typeof value === "object") {
    return markHTMLString(` ${key}="${toAttributeString(toStyleString(value), shouldEscape)}"`);
  }
  if (key === "className") {
    return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);
  }
  if (value === true && (key.startsWith("data-") || htmlBooleanAttributes.test(key))) {
    return markHTMLString(` ${key}`);
  } else {
    return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
  }
}
function internalSpreadAttributes(values, shouldEscape = true) {
  let output = "";
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, shouldEscape);
  }
  return markHTMLString(output);
}
function renderElement(name, { props: _props, children = "" }, shouldEscape = true) {
  const { lang: _, "data-astro-id": astroId, "define:vars": defineVars, ...props } = _props;
  if (defineVars) {
    if (name === "style") {
      delete props["is:global"];
      delete props["is:scoped"];
    }
    if (name === "script") {
      delete props.hoist;
      children = defineScriptVars(defineVars) + "\n" + children;
    }
  }
  if ((children == null || children == "") && voidElementNames.test(name)) {
    return `<${name}${internalSpreadAttributes(props, shouldEscape)} />`;
  }
  return `<${name}${internalSpreadAttributes(props, shouldEscape)}>${children}</${name}>`;
}

function componentIsHTMLElement(Component) {
  return typeof HTMLElement !== "undefined" && HTMLElement.isPrototypeOf(Component);
}
async function renderHTMLElement(result, constructor, props, slots) {
  const name = getHTMLElementName(constructor);
  let attrHTML = "";
  for (const attr in props) {
    attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`;
  }
  return markHTMLString(
    `<${name}${attrHTML}>${await renderSlot(result, slots == null ? void 0 : slots.default)}</${name}>`
  );
}
function getHTMLElementName(constructor) {
  const definedName = customElements.getName(constructor);
  if (definedName)
    return definedName;
  const assignedName = constructor.name.replace(/^HTML|Element$/g, "").replace(/[A-Z]/g, "-$&").toLowerCase().replace(/^-/, "html-");
  return assignedName;
}

const rendererAliases = /* @__PURE__ */ new Map([["solid", "solid-js"]]);
function guessRenderers(componentUrl) {
  const extname = componentUrl == null ? void 0 : componentUrl.split(".").pop();
  switch (extname) {
    case "svelte":
      return ["@astrojs/svelte"];
    case "vue":
      return ["@astrojs/vue"];
    case "jsx":
    case "tsx":
      return ["@astrojs/react", "@astrojs/preact", "@astrojs/solid", "@astrojs/vue (jsx)"];
    default:
      return [
        "@astrojs/react",
        "@astrojs/preact",
        "@astrojs/solid",
        "@astrojs/vue",
        "@astrojs/svelte"
      ];
  }
}
function getComponentType(Component) {
  if (Component === Fragment) {
    return "fragment";
  }
  if (Component && typeof Component === "object" && Component["astro:html"]) {
    return "html";
  }
  if (isAstroComponentFactory(Component)) {
    return "astro-factory";
  }
  return "unknown";
}
async function renderComponent(result, displayName, Component, _props, slots = {}, route) {
  var _a, _b;
  Component = await Component ?? Component;
  switch (getComponentType(Component)) {
    case "fragment": {
      const children2 = await renderSlot(result, slots == null ? void 0 : slots.default);
      if (children2 == null) {
        return children2;
      }
      return markHTMLString(children2);
    }
    case "html": {
      const { slotInstructions: slotInstructions2, children: children2 } = await renderSlots(result, slots);
      const html2 = Component.render({ slots: children2 });
      const hydrationHtml = slotInstructions2 ? slotInstructions2.map((instr) => stringifyChunk(result, instr)).join("") : "";
      return markHTMLString(hydrationHtml + html2);
    }
    case "astro-factory": {
      async function* renderAstroComponentInline() {
        let iterable = await renderToIterable(result, Component, displayName, _props, slots);
        yield* iterable;
      }
      return renderAstroComponentInline();
    }
  }
  if (!Component && !_props["client:only"]) {
    throw new Error(
      `Unable to render ${displayName} because it is ${Component}!
Did you forget to import the component or is it possible there is a typo?`
    );
  }
  const { renderers } = result._metadata;
  const metadata = { displayName };
  const { hydration, isPage, props } = extractDirectives(displayName, _props);
  let html = "";
  let attrs = void 0;
  if (hydration) {
    metadata.hydrate = hydration.directive;
    metadata.hydrateArgs = hydration.value;
    metadata.componentExport = hydration.componentExport;
    metadata.componentUrl = hydration.componentUrl;
  }
  const probableRendererNames = guessRenderers(metadata.componentUrl);
  const validRenderers = renderers.filter((r) => r.name !== "astro:jsx");
  const { children, slotInstructions } = await renderSlots(result, slots);
  let renderer;
  if (metadata.hydrate !== "only") {
    let isTagged = false;
    try {
      isTagged = Component && Component[Renderer];
    } catch {
    }
    if (isTagged) {
      const rendererName = Component[Renderer];
      renderer = renderers.find(({ name }) => name === rendererName);
    }
    if (!renderer) {
      let error;
      for (const r of renderers) {
        try {
          if (await r.ssr.check.call({ result }, Component, props, children)) {
            renderer = r;
            break;
          }
        } catch (e) {
          error ?? (error = e);
        }
      }
      if (!renderer && error) {
        throw error;
      }
    }
    if (!renderer && typeof HTMLElement === "function" && componentIsHTMLElement(Component)) {
      const output = renderHTMLElement(result, Component, _props, slots);
      return output;
    }
  } else {
    if (metadata.hydrateArgs) {
      const passedName = metadata.hydrateArgs;
      const rendererName = rendererAliases.has(passedName) ? rendererAliases.get(passedName) : passedName;
      renderer = renderers.find(
        ({ name }) => name === `@astrojs/${rendererName}` || name === rendererName
      );
    }
    if (!renderer && validRenderers.length === 1) {
      renderer = validRenderers[0];
    }
    if (!renderer) {
      const extname = (_a = metadata.componentUrl) == null ? void 0 : _a.split(".").pop();
      renderer = renderers.filter(
        ({ name }) => name === `@astrojs/${extname}` || name === extname
      )[0];
    }
  }
  if (!renderer) {
    if (metadata.hydrate === "only") {
      throw new AstroError({
        ...AstroErrorData.NoClientOnlyHint,
        message: AstroErrorData.NoClientOnlyHint.message(metadata.displayName),
        hint: AstroErrorData.NoClientOnlyHint.hint(
          probableRendererNames.map((r) => r.replace("@astrojs/", "")).join("|")
        )
      });
    } else if (typeof Component !== "string") {
      const matchingRenderers = validRenderers.filter(
        (r) => probableRendererNames.includes(r.name)
      );
      const plural = validRenderers.length > 1;
      if (matchingRenderers.length === 0) {
        throw new AstroError({
          ...AstroErrorData.NoMatchingRenderer,
          message: AstroErrorData.NoMatchingRenderer.message(
            metadata.displayName,
            (_b = metadata == null ? void 0 : metadata.componentUrl) == null ? void 0 : _b.split(".").pop(),
            plural,
            validRenderers.length
          ),
          hint: AstroErrorData.NoMatchingRenderer.hint(
            formatList(probableRendererNames.map((r) => "`" + r + "`"))
          )
        });
      } else if (matchingRenderers.length === 1) {
        renderer = matchingRenderers[0];
        ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
          { result },
          Component,
          props,
          children,
          metadata
        ));
      } else {
        throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
      }
    }
  } else {
    if (metadata.hydrate === "only") {
      html = await renderSlot(result, slots == null ? void 0 : slots.fallback);
    } else {
      ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
        { result },
        Component,
        props,
        children,
        metadata
      ));
    }
  }
  if (renderer && !renderer.clientEntrypoint && renderer.name !== "@astrojs/lit" && metadata.hydrate) {
    throw new AstroError({
      ...AstroErrorData.NoClientEntrypoint,
      message: AstroErrorData.NoClientEntrypoint.message(
        displayName,
        metadata.hydrate,
        renderer.name
      )
    });
  }
  if (!html && typeof Component === "string") {
    const childSlots = Object.values(children).join("");
    const iterable = renderAstroComponent(
      await renderTemplate`<${Component}${internalSpreadAttributes(props)}${markHTMLString(
        childSlots === "" && voidElementNames.test(Component) ? `/>` : `>${childSlots}</${Component}>`
      )}`
    );
    html = "";
    for await (const chunk of iterable) {
      html += chunk;
    }
  }
  if (!hydration) {
    return async function* () {
      if (slotInstructions) {
        yield* slotInstructions;
      }
      if (isPage || (renderer == null ? void 0 : renderer.name) === "astro:jsx") {
        yield html;
      } else {
        yield markHTMLString(html.replace(/\<\/?astro-slot\>/g, ""));
      }
    }();
  }
  const astroId = shorthash(
    `<!--${metadata.componentExport.value}:${metadata.componentUrl}-->
${html}
${serializeProps(
      props,
      metadata
    )}`
  );
  const island = await generateHydrateScript(
    { renderer, result, astroId, props, attrs },
    metadata
  );
  let unrenderedSlots = [];
  if (html) {
    if (Object.keys(children).length > 0) {
      for (const key of Object.keys(children)) {
        if (!html.includes(key === "default" ? `<astro-slot>` : `<astro-slot name="${key}">`)) {
          unrenderedSlots.push(key);
        }
      }
    }
  } else {
    unrenderedSlots = Object.keys(children);
  }
  const template = unrenderedSlots.length > 0 ? unrenderedSlots.map(
    (key) => `<template data-astro-template${key !== "default" ? `="${key}"` : ""}>${children[key]}</template>`
  ).join("") : "";
  island.children = `${html ?? ""}${template}`;
  if (island.children) {
    island.props["await-children"] = "";
  }
  async function* renderAll() {
    if (slotInstructions) {
      yield* slotInstructions;
    }
    yield { type: "directive", hydration, result };
    yield markHTMLString(renderElement("astro-island", island, false));
  }
  return renderAll();
}

const uniqueElements = (item, index, all) => {
  const props = JSON.stringify(item.props);
  const children = item.children;
  return index === all.findIndex((i) => JSON.stringify(i.props) === props && i.children == children);
};
function renderHead(result) {
  result._metadata.hasRenderedHead = true;
  const styles = Array.from(result.styles).filter(uniqueElements).map((style) => renderElement("style", style));
  result.styles.clear();
  const scripts = Array.from(result.scripts).filter(uniqueElements).map((script, i) => {
    return renderElement("script", script, false);
  });
  const links = Array.from(result.links).filter(uniqueElements).map((link) => renderElement("link", link, false));
  return markHTMLString(links.join("\n") + styles.join("\n") + scripts.join("\n"));
}
async function* maybeRenderHead(result) {
  if (result._metadata.hasRenderedHead) {
    return;
  }
  yield renderHead(result);
}

typeof process === "object" && Object.prototype.toString.call(process) === "[object process]";

function createComponent(cb) {
  cb.isAstroComponentFactory = true;
  return cb;
}
function __astro_tag_component__(Component, rendererName) {
  if (!Component)
    return;
  if (typeof Component !== "function")
    return;
  Object.defineProperty(Component, Renderer, {
    value: rendererName,
    enumerable: false,
    writable: false
  });
}
function spreadAttributes(values, _name, { class: scopedClassName } = {}) {
  let output = "";
  if (scopedClassName) {
    if (typeof values.class !== "undefined") {
      values.class += ` ${scopedClassName}`;
    } else if (typeof values["class:list"] !== "undefined") {
      values["class:list"] = [values["class:list"], scopedClassName];
    } else {
      values.class = scopedClassName;
    }
  }
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, true);
  }
  return markHTMLString(output);
}

const AstroJSX = "astro:jsx";
const Empty = Symbol("empty");
const toSlotName = (slotAttr) => slotAttr;
function isVNode(vnode) {
  return vnode && typeof vnode === "object" && vnode[AstroJSX];
}
function transformSlots(vnode) {
  if (typeof vnode.type === "string")
    return vnode;
  const slots = {};
  if (isVNode(vnode.props.children)) {
    const child = vnode.props.children;
    if (!isVNode(child))
      return;
    if (!("slot" in child.props))
      return;
    const name = toSlotName(child.props.slot);
    slots[name] = [child];
    slots[name]["$$slot"] = true;
    delete child.props.slot;
    delete vnode.props.children;
  }
  if (Array.isArray(vnode.props.children)) {
    vnode.props.children = vnode.props.children.map((child) => {
      if (!isVNode(child))
        return child;
      if (!("slot" in child.props))
        return child;
      const name = toSlotName(child.props.slot);
      if (Array.isArray(slots[name])) {
        slots[name].push(child);
      } else {
        slots[name] = [child];
        slots[name]["$$slot"] = true;
      }
      delete child.props.slot;
      return Empty;
    }).filter((v) => v !== Empty);
  }
  Object.assign(vnode.props, slots);
}
function markRawChildren(child) {
  if (typeof child === "string")
    return markHTMLString(child);
  if (Array.isArray(child))
    return child.map((c) => markRawChildren(c));
  return child;
}
function transformSetDirectives(vnode) {
  if (!("set:html" in vnode.props || "set:text" in vnode.props))
    return;
  if ("set:html" in vnode.props) {
    const children = markRawChildren(vnode.props["set:html"]);
    delete vnode.props["set:html"];
    Object.assign(vnode.props, { children });
    return;
  }
  if ("set:text" in vnode.props) {
    const children = vnode.props["set:text"];
    delete vnode.props["set:text"];
    Object.assign(vnode.props, { children });
    return;
  }
}
function createVNode(type, props) {
  const vnode = {
    [Renderer]: "astro:jsx",
    [AstroJSX]: true,
    type,
    props: props ?? {}
  };
  transformSetDirectives(vnode);
  transformSlots(vnode);
  return vnode;
}

const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
async function check(Component, props, { default: children = null, ...slotted } = {}) {
  if (typeof Component !== "function")
    return false;
  const slots = {};
  for (const [key, value] of Object.entries(slotted)) {
    const name = slotName(key);
    slots[name] = value;
  }
  try {
    const result = await Component({ ...props, ...slots, children });
    return result[AstroJSX];
  } catch (e) {
  }
  return false;
}
async function renderToStaticMarkup(Component, props = {}, { default: children = null, ...slotted } = {}) {
  const slots = {};
  for (const [key, value] of Object.entries(slotted)) {
    const name = slotName(key);
    slots[name] = value;
  }
  const { result } = this;
  const html = await renderJSX(result, createVNode(Component, { ...props, ...slots, children }));
  return { html };
}
var server_default = {
  check,
  renderToStaticMarkup
};

function isOutputFormat(value) {
  return ["avif", "jpeg", "jpg", "png", "webp"].includes(value);
}
function isOutputFormatSupportsAlpha(value) {
  return ["avif", "png", "webp"].includes(value);
}
function isAspectRatioString(value) {
  return /^\d*:\d*$/.test(value);
}
function parseAspectRatio(aspectRatio) {
  if (!aspectRatio) {
    return void 0;
  }
  if (typeof aspectRatio === "number") {
    return aspectRatio;
  } else {
    const [width, height] = aspectRatio.split(":");
    return parseInt(width) / parseInt(height);
  }
}
function isSSRService(service) {
  return "transform" in service;
}
class BaseSSRService {
  async getImageAttributes(transform) {
    const { width, height, src, format, quality, aspectRatio, ...rest } = transform;
    return {
      ...rest,
      width,
      height
    };
  }
  serializeTransform(transform) {
    const searchParams = new URLSearchParams();
    if (transform.quality) {
      searchParams.append("q", transform.quality.toString());
    }
    if (transform.format) {
      searchParams.append("f", transform.format);
    }
    if (transform.width) {
      searchParams.append("w", transform.width.toString());
    }
    if (transform.height) {
      searchParams.append("h", transform.height.toString());
    }
    if (transform.aspectRatio) {
      searchParams.append("ar", transform.aspectRatio.toString());
    }
    if (transform.fit) {
      searchParams.append("fit", transform.fit);
    }
    if (transform.background) {
      searchParams.append("bg", transform.background);
    }
    if (transform.position) {
      searchParams.append("p", encodeURI(transform.position));
    }
    searchParams.append("href", transform.src);
    return { searchParams };
  }
  parseTransform(searchParams) {
    if (!searchParams.has("href")) {
      return void 0;
    }
    let transform = { src: searchParams.get("href") };
    if (searchParams.has("q")) {
      transform.quality = parseInt(searchParams.get("q"));
    }
    if (searchParams.has("f")) {
      const format = searchParams.get("f");
      if (isOutputFormat(format)) {
        transform.format = format;
      }
    }
    if (searchParams.has("w")) {
      transform.width = parseInt(searchParams.get("w"));
    }
    if (searchParams.has("h")) {
      transform.height = parseInt(searchParams.get("h"));
    }
    if (searchParams.has("ar")) {
      const ratio = searchParams.get("ar");
      if (isAspectRatioString(ratio)) {
        transform.aspectRatio = ratio;
      } else {
        transform.aspectRatio = parseFloat(ratio);
      }
    }
    if (searchParams.has("fit")) {
      transform.fit = searchParams.get("fit");
    }
    if (searchParams.has("p")) {
      transform.position = decodeURI(searchParams.get("p"));
    }
    if (searchParams.has("bg")) {
      transform.background = searchParams.get("bg");
    }
    return transform;
  }
}

class SharpService extends BaseSSRService {
  async transform(inputBuffer, transform) {
    const sharpImage = sharp$1(inputBuffer, { failOnError: false, pages: -1 });
    sharpImage.rotate();
    if (transform.width || transform.height) {
      const width = transform.width && Math.round(transform.width);
      const height = transform.height && Math.round(transform.height);
      sharpImage.resize({
        width,
        height,
        fit: transform.fit,
        position: transform.position,
        background: transform.background
      });
    }
    if (transform.format) {
      sharpImage.toFormat(transform.format, { quality: transform.quality });
      if (transform.background && !isOutputFormatSupportsAlpha(transform.format)) {
        sharpImage.flatten({ background: transform.background });
      }
    }
    const { data, info } = await sharpImage.toBuffer({ resolveWithObject: true });
    return {
      data,
      format: info.format
    };
  }
}
const service = new SharpService();
var sharp_default = service;

const sharp = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: sharp_default
}, Symbol.toStringTag, { value: 'Module' }));

const fnv1a52 = (str) => {
  const len = str.length;
  let i = 0, t0 = 0, v0 = 8997, t1 = 0, v1 = 33826, t2 = 0, v2 = 40164, t3 = 0, v3 = 52210;
  while (i < len) {
    v0 ^= str.charCodeAt(i++);
    t0 = v0 * 435;
    t1 = v1 * 435;
    t2 = v2 * 435;
    t3 = v3 * 435;
    t2 += v0 << 8;
    t3 += v1 << 8;
    t1 += t0 >>> 16;
    v0 = t0 & 65535;
    t2 += t1 >>> 16;
    v1 = t1 & 65535;
    v3 = t3 + (t2 >>> 16) & 65535;
    v2 = t2 & 65535;
  }
  return (v3 & 15) * 281474976710656 + v2 * 4294967296 + v1 * 65536 + (v0 ^ v3 >> 4);
};
const etag = (payload, weak = false) => {
  const prefix = weak ? 'W/"' : '"';
  return prefix + fnv1a52(payload).toString(36) + payload.length.toString(36) + '"';
};

function isRemoteImage(src) {
  return /^(https?:)?\/\//.test(src);
}
function removeQueryString(src) {
  const index = src.lastIndexOf("?");
  return index > 0 ? src.substring(0, index) : src;
}
function extname(src) {
  const base = basename(src);
  const index = base.lastIndexOf(".");
  if (index <= 0) {
    return "";
  }
  return base.substring(index);
}
function basename(src) {
  return removeQueryString(src.replace(/^.*[\\\/]/, ""));
}

async function loadRemoteImage(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) {
      return void 0;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return void 0;
  }
}
const get = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const transform = sharp_default.parseTransform(url.searchParams);
    let inputBuffer = void 0;
    const sourceUrl = isRemoteImage(transform.src) ? new URL(transform.src) : new URL(transform.src, url.origin);
    inputBuffer = await loadRemoteImage(sourceUrl);
    if (!inputBuffer) {
      return new Response("Not Found", { status: 404 });
    }
    const { data, format } = await sharp_default.transform(inputBuffer, transform);
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": mime.getType(format) || "",
        "Cache-Control": "public, max-age=31536000",
        ETag: etag(data.toString()),
        Date: new Date().toUTCString()
      }
    });
  } catch (err) {
    console.error(err);
    return new Response(`Server Error: ${err}`, { status: 500 });
  }
};

const _page0 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	get
}, Symbol.toStringTag, { value: 'Module' }));

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$Astro$p = createAstro("/home/dol/site/src/components/Base.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Base = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$p, $$props, $$slots);
  Astro2.self = $$Base;
  const { title, description } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width">\n    <title>', '</title>\n    <meta name="description"', `>
<meta name="google-site-verification" content="xEw0P5dx-_SXX7bqTGQomBICE9IIyFSRm2xoNr85ubY"><script type="text/partytown" async src="https://www.googletagmanager.com/gtag/js?id=G-S7FWS6FC94">
    <\/script><script type="text/partytown"> 
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-S7FWS6FC94');
    <\/script>`, '</head>\n    <!-- Google tag (gtag.js) -->\n    \n    \n    \n     \n\n    \n<div class="max-w-xl mx-auto w-full astro-G37H3N6Y">\n    ', "\n</div>\n\n"])), title, addAttribute(description, "content"), renderHead($$result), renderSlot($$result, $$slots["default"]));
});

const $$Astro$o = createAstro("/home/dol/site/src/components/DirHeader.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$DirHeader = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$o, $$props, $$slots);
  Astro2.self = $$DirHeader;
  Astro2.props;
  return renderTemplate`${maybeRenderHead($$result)}<div class="relative w-full mx-auto max-w-2xl mix-blend-multiply border-black flex items-center">
    <a href="/" class="w-full">
        <div class="flex flex-col items-start w-full">
            <!-- <div class="absolute w-full rounded object-bottom object-cover">
                <img class="-z-10 h-16 w-full object-top object-cover rounded" src="/images/pages/hero2.jpg">
            </div> -->
            <div class="pt-4 pb-2 h-12 pl-4 flex flex-row items-center group">
                <div class="flex flex-col items-center justify-center">
                    <div class="absolute  bg-primary border border-zinc-600 group-hover:bg-secondary rounded-full transition-all duration-300 h-10 w-10  "></div>
                    <div class="absolute bg-primary group-hover:bg-secondar rounded-full transition-all duration-300 mb-2 -mr-0.5 h-3 w-4"></div>
                    <img class="relative h-10 w-10" src="/images/icons/dol.png" alt="dol">
                    <!-- <Image width={75} height={75} class="relative h-10 w-10" src={import("../dol.png")} alt="icon"></Image> -->
                </div>
                <div class="relative pl-3">
                    <div class="text-zinc-800 font-bold text-lg grup-hover:underline decoration-double decoration-secondary decoration-2 underline-offset-4 transition-all duration-300">
                        Donald Jewkes
                    </div>
                    <div class="w-0 group-hover:w-full h-0.5 bg-secondary btransition-all duration-300">
                    </div>
                </div>
            </div>
            <div class=" lg:mt-2 mx-auto  w-full border-b border-zinc-300">
            </div>
        </div>
    </a>
</div>`;
});

const $$Astro$n = createAstro("/home/dol/site/src/components/MainDirectory.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$MainDirectory = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$n, $$props, $$slots);
  Astro2.self = $$MainDirectory;
  const { link, image, text, alt } = Astro2.props;
  return renderTemplate`${maybeRenderHead($$result)}<a${addAttribute(link, "href")}>
    <div class="flex flex-row items-center group">
        <div class="flex flex-col items-center justify-center">
            <div class="absolute bg-primary group-hover:bg-secondary transition-all duration-300 rounded h-8 w-8"></div>
            <img class="relative h-10 w-10"${addAttribute(image, "src")}${addAttribute(alt, "alt")}>
            <!-- <Image width={75} class="relative h-10 w-10" src={image} alt="icon"></Image> -->
        </div>
        <!-- <div class="p-2">
            -
        </div> -->
        <div>
            <img class="w-3 h-3 mx-2" src="/images/icons/next.svg" alt="An right-arrow icon.">
        </div>
        <div class="relative flex flex-col">
            <div class="text-zinc-800 grup-hover:underline decoration-double decoration-secondary decoration-2 underline-offset-4 transition-all duration-300">
                ${text}
            </div>
            <div class="w-0 group-hover:w-full h-0.5 bg-secondary btransition-all duration-300">
            </div>
        </div>
        <!-- <div>
            <img class="h-4" src="/images/icons/next.svg">
        </div> -->
    </div>
</a>`;
});

function resolveSize(transform) {
  if (transform.width && transform.height) {
    return transform;
  }
  if (!transform.width && !transform.height) {
    throw new Error(`"width" and "height" cannot both be undefined`);
  }
  if (!transform.aspectRatio) {
    throw new Error(
      `"aspectRatio" must be included if only "${transform.width ? "width" : "height"}" is provided`
    );
  }
  let aspectRatio;
  if (typeof transform.aspectRatio === "number") {
    aspectRatio = transform.aspectRatio;
  } else {
    const [width, height] = transform.aspectRatio.split(":");
    aspectRatio = Number.parseInt(width) / Number.parseInt(height);
  }
  if (transform.width) {
    return {
      ...transform,
      width: transform.width,
      height: Math.round(transform.width / aspectRatio)
    };
  } else if (transform.height) {
    return {
      ...transform,
      width: Math.round(transform.height * aspectRatio),
      height: transform.height
    };
  }
  return transform;
}
async function resolveTransform(input) {
  if (typeof input.src === "string") {
    return resolveSize(input);
  }
  const metadata = "then" in input.src ? (await input.src).default : input.src;
  let { width, height, aspectRatio, background, format = metadata.format, ...rest } = input;
  if (!width && !height) {
    width = metadata.width;
    height = metadata.height;
  } else if (width) {
    let ratio = parseAspectRatio(aspectRatio) || metadata.width / metadata.height;
    height = height || Math.round(width / ratio);
  } else if (height) {
    let ratio = parseAspectRatio(aspectRatio) || metadata.width / metadata.height;
    width = width || Math.round(height * ratio);
  }
  return {
    ...rest,
    src: metadata.src,
    width,
    height,
    aspectRatio,
    format,
    background
  };
}
async function getImage(transform) {
  var _a, _b, _c;
  if (!transform.src) {
    throw new Error("[@astrojs/image] `src` is required");
  }
  let loader = (_a = globalThis.astroImage) == null ? void 0 : _a.loader;
  if (!loader) {
    const { default: mod } = await Promise.resolve().then(() => sharp).catch(() => {
      throw new Error(
        "[@astrojs/image] Builtin image loader not found. (Did you remember to add the integration to your Astro config?)"
      );
    });
    loader = mod;
    globalThis.astroImage = globalThis.astroImage || {};
    globalThis.astroImage.loader = loader;
  }
  const resolved = await resolveTransform(transform);
  const attributes = await loader.getImageAttributes(resolved);
  const isDev = (_b = (Object.assign({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true},{_:process.env._,SSR:true,}))) == null ? void 0 : _b.DEV;
  const isLocalImage = !isRemoteImage(resolved.src);
  const _loader = isDev && isLocalImage ? globalThis.astroImage.defaultLoader : loader;
  if (!_loader) {
    throw new Error("@astrojs/image: loader not found!");
  }
  const { searchParams } = isSSRService(_loader) ? _loader.serializeTransform(resolved) : globalThis.astroImage.defaultLoader.serializeTransform(resolved);
  const imgSrc = !isLocalImage && resolved.src.startsWith("//") ? `https:${resolved.src}` : resolved.src;
  let src;
  if (/^[\/\\]?@astroimage/.test(imgSrc)) {
    src = `${imgSrc}?${searchParams.toString()}`;
  } else {
    searchParams.set("href", imgSrc);
    src = `/_image?${searchParams.toString()}`;
  }
  if ((_c = globalThis.astroImage) == null ? void 0 : _c.addStaticImage) {
    src = globalThis.astroImage.addStaticImage(resolved);
  }
  return {
    ...attributes,
    src
  };
}

async function resolveAspectRatio({ src, aspectRatio }) {
  if (typeof src === "string") {
    return parseAspectRatio(aspectRatio);
  } else {
    const metadata = "then" in src ? (await src).default : src;
    return parseAspectRatio(aspectRatio) || metadata.width / metadata.height;
  }
}
async function resolveFormats({ src, formats }) {
  const unique = new Set(formats);
  if (typeof src === "string") {
    unique.add(extname(src).replace(".", ""));
  } else {
    const metadata = "then" in src ? (await src).default : src;
    unique.add(extname(metadata.src).replace(".", ""));
  }
  return Array.from(unique).filter(Boolean);
}
async function getPicture(params) {
  const { src, widths, fit, position, background } = params;
  if (!src) {
    throw new Error("[@astrojs/image] `src` is required");
  }
  if (!widths || !Array.isArray(widths)) {
    throw new Error("[@astrojs/image] at least one `width` is required");
  }
  const aspectRatio = await resolveAspectRatio(params);
  if (!aspectRatio) {
    throw new Error("`aspectRatio` must be provided for remote images");
  }
  const allFormats = await resolveFormats(params);
  const lastFormat = allFormats[allFormats.length - 1];
  const maxWidth = Math.max(...widths);
  let image;
  async function getSource(format) {
    const imgs = await Promise.all(
      widths.map(async (width) => {
        const img = await getImage({
          src,
          format,
          width,
          fit,
          position,
          background,
          aspectRatio
        });
        if (format === lastFormat && width === maxWidth) {
          image = img;
        }
        return `${img.src} ${width}w`;
      })
    );
    return {
      type: mime.getType(format) || format,
      srcset: imgs.join(",")
    };
  }
  const sources = await Promise.all(allFormats.map((format) => getSource(format)));
  return {
    sources,
    image
  };
}

const $$Astro$m = createAstro("/home/dol/site/node_modules/@astrojs/image/components/Image.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Image = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$m, $$props, $$slots);
  Astro2.self = $$Image;
  const { loading = "lazy", decoding = "async", ...props } = Astro2.props;
  if (props.alt === void 0 || props.alt === null) {
    warnForMissingAlt();
  }
  const attrs = await getImage(props);
  return renderTemplate`${maybeRenderHead($$result)}<img${spreadAttributes(attrs)}${addAttribute(loading, "loading")}${addAttribute(decoding, "decoding")}>`;
});

const $$Astro$l = createAstro("/home/dol/site/node_modules/@astrojs/image/components/Picture.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Picture = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$l, $$props, $$slots);
  Astro2.self = $$Picture;
  const {
    src,
    alt,
    sizes,
    widths,
    aspectRatio,
    fit,
    background,
    position,
    formats = ["avif", "webp"],
    loading = "lazy",
    decoding = "async",
    ...attrs
  } = Astro2.props;
  if (alt === void 0 || alt === null) {
    warnForMissingAlt();
  }
  const { image, sources } = await getPicture({
    src,
    widths,
    formats,
    aspectRatio,
    fit,
    background,
    position
  });
  delete image.width;
  delete image.height;
  return renderTemplate`${maybeRenderHead($$result)}<picture>
	${sources.map((attrs2) => renderTemplate`<source${spreadAttributes(attrs2)}${addAttribute(sizes, "sizes")}>`)}
	<img${spreadAttributes(image)}${addAttribute(loading, "loading")}${addAttribute(decoding, "decoding")}${addAttribute(alt, "alt")}${spreadAttributes(attrs)}>
</picture>`;
});

let altWarningShown = false;
function warnForMissingAlt() {
  if (altWarningShown === true) {
    return;
  }
  altWarningShown = true;
  console.warn(`
[@astrojs/image] "alt" text was not provided for an <Image> or <Picture> component.

A future release of @astrojs/image may throw a build error when "alt" text is missing.

The "alt" attribute holds a text description of the image, which isn't mandatory but is incredibly useful for accessibility. Set to an empty string (alt="") if the image is not a key part of the content (it's decoration or a tracking pixel).
`);
}

const $$Astro$k = createAstro("/home/dol/site/src/pages/index.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$k, $$props, $$slots);
  Astro2.self = $$Index;
  return renderTemplate`<html lang="en">
<!-- Welcome friend.-->
<!--    ._____. ._____.-->
<!--	| ._. | | ._. |-->
<!--	| !_| |_|_|_! |-->
<!--	!___| |_______!-->
<!--	.___|_|_| |___.-->
<!--	| ._____| |_. |-->
<!--	| !_! | | !_! |-->
<!--	!_____! !_____!-->
<!-- Enjoy your stay.-->
	 
	${renderComponent($$result, "Base", $$Base, { "title": "Donald Jewkes", "description": "I live in Vancouver, Canada and I'm a developer at MotionHall. We are working to accelerate the rate of tech transfer in the life sciences." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, {})}${maybeRenderHead($$result)}<div class="w-full mx-auto">
			<div class="w-full mx-auto p-4">
				<div class=" w-full flex flex-row items-center justify-between space-x-4">
					<div class="flex flex-col space-y-1 items-start justify-center">
						${renderComponent($$result, "MainDirectory", $$MainDirectory, { "link": "/about", "image": "/images/icons/wave.png", "text": "me", "alt": "A waving hand." })}
						${renderComponent($$result, "MainDirectory", $$MainDirectory, { "link": "/bread", "image": "/images/icons/bread.png", "text": "bread", "alt": "A loaf of bread." })}
						${renderComponent($$result, "MainDirectory", $$MainDirectory, { "link": "/photos", "image": "/images/icons/camera.png", "text": "photos", "alt": "An old film camera." })}
						<!-- <MainDirectory link="/thinks" image="/images/icons/thinking.png" text="thinks" alt="A man sitting and thinking.">
						</MainDirectory> -->
						${renderComponent($$result, "MainDirectory", $$MainDirectory, { "link": "/projects", "image": "/images/icons/chisel.png", "text": "projects", "alt": "A chisel and a block." })}
					</div>
					<div class=" rounded">
						${renderComponent($$result, "Image", $$Image, { "width": 300, "class": "relative rounded sm:w-full w-32 h-40 object-cover object-center opacity-90 ", "src": import('./chunks/church.cb9d8179.mjs'), "alt": "Saints Peter and Paul Church" })}
					</div>
				</div>	
				<iframe id="Hey, I'm glad you found me. You should go listen to this song :) if you'd like you can -b checkout the /loft as well" class="hidden mt-4 opacity-10" style="border-radius:12px" src="https://open.spotify.com/embed/track/0S9lwd7JF9878QQ6tuuIQg?utm_source=generator&theme=0" width="100%" height="100" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>		
			</div>
		</div>` })}
</html>`;
});

const $$file$e = "/home/dol/site/src/pages/index.astro";
const $$url$e = "";

const _page1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file$e,
	url: $$url$e
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$j = createAstro("/home/dol/site/src/pages/makesomethingsaturday.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Makesomethingsaturday = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$j, $$props, $$slots);
  Astro2.self = $$Makesomethingsaturday;
  Astro2.props;
  return renderTemplate`<html lang="en">
	${renderComponent($$result, "Base", $$Base, { "title": "Make something Saturday", "description": "What's going on in my brain." }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="p-4">
			<div class="flex flex-col items-start justify-center space-y-2">
				<div class="flex flex-row justify-between items-center w-full">
					<div class=" font-bold text-xl sm:text-2xl text-sky-700">Make something Saturday</div>
					<div class=" font-mono text-sm bg-sky-100 px-1 py-0.5 rounded text-sky-700">June 24</div>

				</div>
				<img class="relative rounded" src="/images/misc/orbitallounge.webp" alt="dol">
			</div>
			<div class="pt-3">
				<div class="pt-3">
					<div class="font-bold">Welcome!</div>
						
					<div class="pt-3 text-neutral-700">I’m Donald, I’ll be hosting you at Orbital Lounge tomorrow. Orbital is at <a class="text-blue-600 underline" target="_blank" rel="noreferrer noopener" href="https://www.google.com/maps/place/58+Keefer+Pl,+Vancouver,+BC+V6B+0B8/@49.2792813,-123.1065474,17z/data=!3m1!4b1!4m6!3m5!1s0x5486717ba9779513:0xeafe1ab3246a54bc!8m2!3d49.2792813!4d-123.1065474!16s%2Fg%2F11c21vlt_2?entry=ttu">58 Keefer Pl</a>, right beside the Stadium Chinatown skytrain station. </div>

					<div class="pt-3 text-neutral-700">We will be getting underway at 9:30. I ask that people don’t arrive after 10:00 unless they have made special arrangements. I need to come down and let people up - dm me on twitter once you have arrived outside the building. I will be wearing a flower shirt!</div>

					<div class="pt-3 text-neutral-700">We will be conducting dedicated working blocks throughout the day. You are encouraged to work on something outside of your main responsibilities - but nothing is off the table. Responding to 100 emails is a totally great outcome.</div>

					<div class="pt-3">
						<div class="font-bold">Schedule:</div>
						<ul class="list-inside list-disc text-neutral-700">
						<li>9:30 - 10:00 arrive, hello, settle</li>
						<li>10:00 - 11:00 work</li>
						<li>11:00 - 11:15 break</li>
						<li>11:15 - 12:15 work</li>
						<li>12:15 - 1:15 lunch</li>
						<li>1:15 - 2:15 work</li>
						<li>2:15 - 4:00 free time (and opt-in showcase)</li>
					</ul>
					</div>

					<div class="pt-3 text-neutral-700">We will be working in 1 hour time blocks with 15 minute breaks. All are encouraged to respect the scheduled time blocks but exercise your agency as you wish. Working hours will be low-interruptions indoors, please be respectful when people are heads down. As the host, I’ll be the exception, feel free to ask me questions anytime.</div>

					<div class="pt-3"><div class="font-bold">Breaks:</div>
						<div class="text-neutral-700">During break time, everything is fair game. I encourage people to congregate on the roof - but you are welcome to stay inside as well.</div></div>

					<div class="pt-3 text-neutral-700"><div class="font-bold text-black">Lunch:</div> For those who are interested, I’ll be placing an order from Nuba. I will collect your orders during break time. If you participate, please etransfer me the amount of your order: donaldjewkes [at] gmail [dot] com</div>

					<div class="pt-3 text-neutral-700"><div class="font-bold text-black">Refreshments:</div>Coffee, bubblys, pu'er tea, and snacks are available. If you're peckish, help yourself to anything in the fridge/cupboards/freezer.</div>


					<div class="pt-3 text-neutral-700"><div class="text-black font-bold">Freetime / Showcase:</div> After our final working block, people have the opportunity to discuss or showcase what they have been working on. There will be a TV and an HDMI available. This is entirely opt-in; you’re not expected to have anything to showcase. For those interested, there will be free time until 4:00, after which we will part ways :)</div>

					<div class="pt-3">
						<div class="font-bold">Notes on spaces:</div>
						<ul class="list-disc list-inside text-neutral-700">
						  <li>The common area: Most of the working space is here. Desks are first come first serve. Use the materials around you to make a suitable working environment. There will be light ambiance music playing.</li>
						  <li>The roof: The roof will be a social environment throughout the day. You are welcome to work here but be open to interruptions. This will be a congregation point for breaks and for lunch.</li>
						  <li>Upstairs: There are two available desks here, one of which is a treadmill desk.</li>
						  <li>Solarium: there is a bed in here that’s good for sitting, laying, and thinking. You are welcome to use it.</li>
						  <li>The bathroom: We have a shared bathroom at the base of the spiral stairs.</li>
						  <li>Closed doors: I ask that you are respectful of privacy, closed doors are off limits.</li>
						</ul>
					  </div>
					</div>

					<div class="pt-3"><div class="font-bold">Misc:</div>
					<ul class="list-inside list-disc"> 
						<li><a class="text-blue-600 underline" target="_blank" rel="noreferrer noopener" href="https://ritual.co/order/nuba-gastown-hastings-cambie-vancouver/bcca?r=NUBA">Nuba's online menu</a></li>
						<li><a class="text-blue-600 underline" target="_blank" rel="noreferrer noopener" href="https://twitter.com/donaldjewkes">Twitter for contact</a></li>

						<img class="pt-3 w-48" src="/images/misc/wifi.png" alt="">
					</ul>
					</div>
					<div class="mt-6 w-full border-neutral-500 border-t"></div>
					<div class="pt-6">
						<div>
							See you soon :)
						</div>	
						<img class="mt-3 rounded" src="/images/misc/footer.jpg" alt=""></div>

			</div>
			
		</div>` })}
</html>`;
});

const $$file$d = "/home/dol/site/src/pages/makesomethingsaturday.astro";
const $$url$d = "/makesomethingsaturday";

const _page2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Makesomethingsaturday,
	file: $$file$d,
	url: $$url$d
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$i = createAstro("/home/dol/site/src/components/BackArrow.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$BackArrow = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$i, $$props, $$slots);
  Astro2.self = $$BackArrow;
  const { link, text } = Astro2.props;
  return renderTemplate`${maybeRenderHead($$result)}<a class="group flex flex-row justify-start items-center mb-2"${addAttribute(link, "href")}>
    <div>
        <img class="h-3 mr-2 rotate-180" src="/images/icons/next.svg" alt="An left-arrow icon.">
    </div>
    <div class="flex flex-col items-start justify-start">
        <div class=" text-zinc-600">${text}</div>
        <div class="w-0 group-hover:w-full h-0.5 bg-secondary btransition-all duration-300"></div>
    </div>
</a>`;
});

const $$Astro$h = createAstro("/home/dol/site/src/components/Link.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Link = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$h, $$props, $$slots);
  Astro2.self = $$Link;
  const { href, text, nt } = Astro2.props;
  return renderTemplate`${nt ? renderTemplate`${maybeRenderHead($$result)}<a class="text-secondary underline hover:text-primary"${addAttribute(href, "href")} target="_blank" rel="noreferrer noopener">${text}</a>` : renderTemplate`<a class="text-secondary underline hover:text-primary"${addAttribute(href, "href")}>${text}</a>`}`;
});

const $$Astro$g = createAstro("/home/dol/site/src/pages/projects/liven.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Liven = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$g, $$props, $$slots);
  Astro2.self = $$Liven;
  Astro2.props;
  import('./chunks/van1.27d0cea1.mjs');
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": "Liven Protein Kefir", "description": "Liven Protein Kefir - Canada's first post-workout probiotic." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, { "id": "top" })}${maybeRenderHead($$result)}<div class="p-4 max-w-2xl">
			<!-- build into component -->
			<!-- <Image width={500} class="rounded relative w-full h-44 object-cover object-bottom" src={import("/public/images/pages/wtwmposter.png")} alt="icon"></Image> -->
 
			<div class="flex flex-row items-center">
				<h1 class="text-xl font-bold text-zinc-800">Liven Protein Kefir</h1>
				<a href="https://livenprotein.ca/" target="_blank" rel="noreferrer noopener"><img class="ml-2 h-6 w-6" src="/images/icons/livenlogo.png"></a>
			</div>
			<div class="text-zinc-600 pt-3 space-y-3">
				I co-founded ${renderComponent($$result, "Link", $$Link, { "href": "https://livenprotein.ca/", "text": "Liven" })} with my friend ${renderComponent($$result, "Link", $$Link, { "href": "https://www.linkedin.com/in/richard-grant-2b4003253/", "text": "Richard" })}. 
				We made a post-workout probiotic that combines the recovery benefits of protein with traditionally fermented milk Kefir.
				<div class="">We bootstrapped a small scale production facility to meet dairy processing regulation and yield consistent 10L batches.</div>
				<div>Liven won first place and $45000 of non dilutive funding at ${renderComponent($$result, "Link", $$Link, { "href": "https://www.stfx.ca/about/news/liven", "text": "Spark Nova Scotia 2021", "nt": "t" })}.</div>
				
			</div>
			<div class="pt-3 text-zinc-600">
				
			</div>
			<img class="rounded" src="/images/pages/spark.jpg">
			
			<div class="pt-6 flex flex-col items-start justify-center">
				<div class="my-2 w-48 border-b border-zinc-300">
				</div>
				${renderComponent($$result, "BackArrow", $$BackArrow, { "class": "", "text": "projects", "link": "/projects" })}
			</div>
		</div>` })}`;
});

const $$file$c = "/home/dol/site/src/pages/projects/liven.astro";
const $$url$c = "/projects/liven";

const _page3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Liven,
	file: $$file$c,
	url: $$url$c
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$f = createAstro("/home/dol/site/src/pages/projects/wtwm.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Wtwm = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$f, $$props, $$slots);
  Astro2.self = $$Wtwm;
  Astro2.props;
  import('./chunks/van1.27d0cea1.mjs');
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": "Where the Waters Meet", "description": "Where the Waters Meet - a film by Donald Jewkes and Evan Perry." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, { "id": "top" })}${maybeRenderHead($$result)}<div class="p-4 max-w-2xl">
			<!-- build into component -->
			<!-- <Image width={500} class="rounded relative w-full h-44 object-cover object-bottom" src={import("/public/images/pages/wtwmposter.png")} alt="icon"></Image> -->
 
			<div class="flex flex-row items-center">
				<h1 class="text-xl font-bold text-zinc-800">Where the Waters Meet</h1>
				<a href="https://youtu.be/EcSrf1C7smA" target="_blank" rel="noreferrer noopener">
					<img class="ml-2 h-6 w-6" src="/images/icons/WTWM_LOGO.svg">
				</a>
			</div>
			
			<div class="text-zinc-600 space-y-3">
				<div class="pt-3">
					In January 2020 there was an application submitted by ${renderComponent($$result, "Link", $$Link, { "href": "https://www.townpointoysters.com/", "text": "Town Point Oysters", "nt": "t" })} to develop an oyster aquaculture farm in Antigonish Harbour.
					Shortly after, the community group ${renderComponent($$result, "Link", $$Link, { "href": "https://friendsofantigonishharbour.com/home", "text": "Friends of Antigonish Harbour", "nt": "t" })} was formed to oppose the application.
				</div>
				<div class="py-3"><iframe class="w-full rounded " height="306px" src="https://www.youtube.com/embed/eblw6X22_m4?modestbranding=1&rel=0&showinfo=0" title="YouTube video player" frameborder="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope;" allowfullscreen></iframe></div>
				<div>
					My friend ${renderComponent($$result, "Link", $$Link, { "href": "https://www.instagram.com/evanperry11/", "text": "Evan", "nt": "t" })} and I created ${renderComponent($$result, "Link", $$Link, { "href": "https://youtu.be/EcSrf1C7smA", "text": "Where the Waters Meet", "nt": "t" })}, a feature length documentary that aims to distill truth by exploring a diverse set of perspectives on the farm.
						Our goal was to have a more informed public on an important community issue.
				</div>
				<div>
					We interviewed involved community members to capture their opinions on the environmental, sociological, and economic implications. Some of the topics of conversation were:
					<ul class="py-4 pl-10 list-[disc] space-y-2">
						<li>The politics of development</li>
						<li>${renderComponent($$result, "Link", $$Link, { "href": "https://en.wikipedia.org/wiki/NIMBY#Nova_Scotia", "text": "NIMBY", "nt": "t" })}ism</li>
						<li>${renderComponent($$result, "Link", $$Link, { "href": "https://en.wikipedia.org/wiki/Tragedy_of_the_commons", "text": "The Tragedy of the Commons", "nt": "t" })}</li>
						<li>${renderComponent($$result, "Link", $$Link, { "href": "https://www.onens.ca/about-onens", "text": "The Ivany Report", "nt": "t" })}</li>
						<li>Environmental concerns
							<ul class="pl-4 py-1 list-[circle] space-y-2">
									<li>${renderComponent($$result, "Link", $$Link, { "href": "https://en.wikipedia.org/wiki/Nutrient_pollution", "text": "Nutrient loading", "nt": "t" })}</li>
									<li>${renderComponent($$result, "Link", $$Link, { "href": "https://www.dfo-mpo.gc.ca/videos/oyster-farming-ostreiculture-eng.html", "text": "Eelgrass shading", "nt": "t" })}</li>
									<li>${renderComponent($$result, "Link", $$Link, { "href": "https://en.wikipedia.org/wiki/Carbon_sequestration", "text": "Carbon sequestration", "nt": "t" })}</li>
							</ul>
						</li>
						<li>${renderComponent($$result, "Link", $$Link, { "href": "https://novascotia.ca/fish/aquaculture/licensing-leasing/", "text": "NSDFA regulation", "nt": "t" })}</li>
					</ul>
				</div>
				<div>
					In the early stages of filming, Evan and I focused on mitigating personal bias. As we progressed, we realized that our attempts to entirely remove bias would be in vain. Through our creative decisions, we would inevitably be reflected in the project. 
				</div>
				<div>
					Pursuing something negatively defined like <i>trying to be unbiased</i> intuitively made less sense to us than pursuing truth. Our job as filmmakers became determining <i>what is real</i>. There's overlap between mitigating bias and pursuing truth, but we found that focusing on the pursuit of truth was a useful reframing of objectives.
				</div>
				<div>
					In a lot of cases, dialogue in interviews veered away from what was empirically falsifiable. In those cases, we became curators of opinions. We aimed to be comprehensive and fair in our representation of perspectives. It became up to the public to discern the truth.
				</div>
				<div>
					In March of 2022 Where the Waters Meet was screened for the community in the Barrick auditorium at StFX University. There was an additional screening done in lab for the aquatic resources department. The full film is available to watch ${renderComponent($$result, "Link", $$Link, { "href": "https://youtu.be/EcSrf1C7smA", "text": "here", "nt": "t" })}.
				</div>
				<div>
					We're thankful to the following for making this project possible:
					<div class="flex flex-col sm:flex-row justify-around items-center pt-6  space-y-6 sm:space-y-0">
						<div>
							<img src="/images/icons/stfx.png" class=" h-14 object-cover object-center">
						</div>
						<div class="text-xl font-bold">
							Kingsley Brown
						</div>
						<div>
							<img src="/images/icons/onenfb.svg" class=" h-10 object-cover object-center">
						</div>
					</div>
				</div>
			</div>
			
			<div class="pt-6 flex flex-col items-start justify-center">
				<div class="my-2 w-48 border-b border-zinc-300">
				</div>
				${renderComponent($$result, "BackArrow", $$BackArrow, { "class": "", "text": "projects", "link": "/projects" })}
			</div>
		</div>` })}`;
});

const $$file$b = "/home/dol/site/src/pages/projects/wtwm.astro";
const $$url$b = "/projects/wtwm";

const _page4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Wtwm,
	file: $$file$b,
	url: $$url$b
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$e = createAstro("/home/dol/site/src/components/ProjectDirectory.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$ProjectDirectory = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$e, $$props, $$slots);
  Astro2.self = $$ProjectDirectory;
  const { link, image, text, sub, alt, wtwm } = Astro2.props;
  return renderTemplate`${maybeRenderHead($$result)}<a${addAttribute(link, "href")}>
    <div class="py-1 flex flex-row items-center group">
        <div class="flex flex-col items-center justify-center">
            ${wtwm == "true" ? renderTemplate`<div class="absolute bg-primary group-hover:bg-secondary transition-all duration-300 rounded-full h-6 w-6 "></div><div class="absolute bg-zinc-100 transition-all duration-300  h-8 w-5 mr-3 "></div><div class="absolute bg-zinc-100 transition-all duration-300  h-8 w-5 ml-1 mt-4 rotate-90"></div><div class="absolute bg-white transition-all duration-300 rounded h-6 w-4 mr-12 mb-7 rotate-45"></div>` : renderTemplate`<div class="absolute bg-primary group-hover:bg-secondary transition-all duration-300 rounded  h-8 w-8 rotate-45"></div>`}
            <!-- <img class="relative h-10 w-10" src={image} alt={alt}> -->
            <!-- <Image width={75} class="rounded relative h-10 w-10 object-cover object-center" src={image} alt={alt}></Image> -->
            <img class="rounded relative h-10 w-10 object-cover object-center"${addAttribute(image, "src")}${addAttribute(alt, "alt")}>
        </div>
        <div>
            <img class="h-3 mx-2" src="/images/icons/next.svg" alt="An right-arrow icon.">
        </div>
        <div class="relative flex flex-col">
            <div class="grup-hover:underline font-bold decoration-double decoration-secondary decoration-2 underline-offset-4 transition-all duration-300">
                ${text}
            </div>
            <div class="w-0 group-hover:w-full h-0.5 bg-secondary btransition-all duration-300">
            </div>
            <div class="text-sm text-zinc-600">
                ${sub}
            </div>
        </div>
        <!-- <div>
            <img class="h-4" src="/images/icons/next.svg">
        </div> -->
    </div>
</a>`;
});

const $$Astro$d = createAstro("/home/dol/site/src/pages/projects.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Projects = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$d, $$props, $$slots);
  Astro2.self = $$Projects;
  Astro2.props;
  return renderTemplate`<html lang="en">
	${renderComponent($$result, "Base", $$Base, { "title": "Donald Jewkes - Projects", "description": "Some of the things that I've done in the past" }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, { "id": "top" })}${maybeRenderHead($$result)}<div class="p-4">
			<div>
				My quality working hours are spent building <a class="text-secondary underline hover:text-primary" target="_blank" rel="noreferrer noopener" href="http://www.motionhall.com">MotionHall</a>. 
				Here are some of the projects I've taken on in the past:
			</div>
			<div class="pt-4 ">
				${renderComponent($$result, "ProjectDirectory", $$ProjectDirectory, { "class": "relative py-10", "link": "/projects/wtwm", "image": "/images/icons/WTWM_LOGO.svg", "text": "Where the Waters Meet", "sub": "A feature length documentary.", "alt": "Where the Waters Meet logo", "wtwm": "true" })}
				${renderComponent($$result, "ProjectDirectory", $$ProjectDirectory, { "class": "relative py-10", "link": "/projects/liven", "image": "/images/icons/livenlogo.png", "text": "Liven Protein Kefir", "sub": "A post-workout probiotic.", "alt": "Liven Protein Kefir logo", "wtwm": "false" })}

				<!-- <PhotoDirectory class="relative py-1" link="/photos/sf" image={import("/public/images/sf/sfp8.jpg")} text="Liven" alt="San Fransisco House."></PhotoDirectory> -->
				<div class=""></div>
			</div>

		</div>` })}
</html>`;
});

const $$file$a = "/home/dol/site/src/pages/projects.astro";
const $$url$a = "/projects";

const _page5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Projects,
	file: $$file$a,
	url: $$url$a
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$c = createAstro("/home/dol/site/src/pages/photos/vancouver.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Vancouver = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$c, $$props, $$slots);
  Astro2.self = $$Vancouver;
  Astro2.props;
  import('./chunks/van1.27d0cea1.mjs');
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": "Photos of Vancouver and surrounding areas.", "description": "Vancouver nature photos by Donald Jewkes." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, { "id": "top" })}${maybeRenderHead($$result)}<div class="p-4 max-w-2xl">
		<!-- build into component -->
		<a class="group flex flex-row justify-start items-center mb-2" href="/photos">
			<div>
				<img class="h-3 mr-2 rotate-180" src="/images/icons/next.svg" alt="An left-arrow icon.">
			</div>
			<div class="flex flex-col items-start justify-start">
				<div class=" text-zinc-600">photos</div>
				<div class="w-0 group-hover:w-full h-0.5 bg-secondary btransition-all duration-300"></div>
			</div>
		</a>
		<div class="flex flex-col w-full items-center justify-center space-y-4">
			${renderComponent($$result, "Image", $$Image, { "width": 500, "class": "relative  w-full", "src": import('./chunks/van4.e6a259e4.mjs'), "alt": "An orca swimming." })}
			${renderComponent($$result, "Image", $$Image, { "width": 700, "class": "relative  w-full", "src": import('./chunks/van3.5e7c8c98.mjs'), "alt": "A grizzly bear eating muscles on the beach." })}
			${renderComponent($$result, "Image", $$Image, { "width": 700, "class": "relative  w-full", "src": import('./chunks/van1.27d0cea1.mjs'), "alt": "Kristian fishing for a Salmon" })}
			${renderComponent($$result, "Image", $$Image, { "width": 500, "class": "relative  w-full", "src": import('./chunks/van2.616916f5.mjs'), "alt": "An eagle flying through the Knight inlet." })}
		</div>

		<a class="group flex flex-row justify-start items-center my-2" href="#top">
			<div>
				<img class="h-3 mr-2 -rotate-90" src="/images/icons/next.svg" alt="An up-arrow icon.">
			</div>
			<div class="flex flex-col items-start justify-start">
				<div class=" text-zinc-600">top</div>
				<div class="w-0 group-hover:w-full h-0.5 bg-secondary btransition-all duration-300"></div>
			</div>
		</a>
	</div>` })}`;
});

const $$file$9 = "/home/dol/site/src/pages/photos/vancouver.astro";
const $$url$9 = "/photos/vancouver";

const _page6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Vancouver,
	file: $$file$9,
	url: $$url$9
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$b = createAstro("/home/dol/site/src/pages/photos/sf.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Sf = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$b, $$props, $$slots);
  Astro2.self = $$Sf;
  Astro2.props;
  import('./chunks/van1.27d0cea1.mjs');
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": "Photos of San Fransisco and surrounding areas.", "description": "Photos from walks in SF by Donald Jewkes." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, { "id": "top" })}${maybeRenderHead($$result)}<div class="p-4">
			<!-- build into component -->
			${renderComponent($$result, "BackArrow", $$BackArrow, { "text": "photos", "link": "/photos" })}
			<div class=" rounded">
				<div class=" flex flex-col items-center justify-center space-y-4">
					${renderComponent($$result, "Image", $$Image, { "width": 700, "class": "relative w-full", "src": import('./chunks/sfp8.8fb405ce.mjs'), "alt": "A bright house in San Fransisco." })}
					${renderComponent($$result, "Image", $$Image, { "width": 700, "class": "relative w-full", "src": import('./chunks/sfp2.4c0afa01.mjs'), "alt": "A man talking to someone in a car." })}
					${renderComponent($$result, "Image", $$Image, { "width": 700, "class": "relative w-full", "src": import('./chunks/sfp3.f5155697.mjs'), "alt": "Someone walking quickly in San Fransisco." })}
					${renderComponent($$result, "Image", $$Image, { "width": 700, "class": "relative w-full", "src": import('./chunks/sfp4.46cc0938.mjs'), "alt": "An old man holding flowers by a cathedral." })}
					${renderComponent($$result, "Image", $$Image, { "width": 700, "class": "relative w-full", "src": import('./chunks/sfp6.baf06399.mjs'), "alt": "A man leaning against a building and thinking." })}
					${renderComponent($$result, "Image", $$Image, { "width": 700, "class": "relative w-full", "src": import('./chunks/sfp9.e2bcc3c1.mjs'), "alt": "Roman architecture." })}
				</div>
			</div>
			<a class="group flex flex-row justify-start items-center my-2" href="#top">
				<div>
					<img class="h-3 mr-2 -rotate-90" src="/images/icons/next.svg" alt="An up-arrow icon.">
				</div>
				<div class="flex flex-col items-start justify-start">
					<div class=" text-zinc-600">top</div>
					<div class="w-0 group-hover:w-full h-0.5 bg-secondary btransition-all duration-300"></div>
				</div>
			</a>
		</div>` })}`;
});

const $$file$8 = "/home/dol/site/src/pages/photos/sf.astro";
const $$url$8 = "/photos/sf";

const _page7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Sf,
	file: $$file$8,
	url: $$url$8
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$a = createAstro("/home/dol/site/src/components/PhotoDirectory.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$PhotoDirectory = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$a, $$props, $$slots);
  Astro2.self = $$PhotoDirectory;
  const { link, image, text, alt } = Astro2.props;
  return renderTemplate`${maybeRenderHead($$result)}<a${addAttribute(link, "href")}>
    <div class="py-1 flex flex-row items-center group">
        <div class="flex flex-col items-center justify-center">
            <div class="absolute bg-amber-400 group-hover:bg-secondary transition-all duration-300 rounded h-8 w-8"></div>
            <!-- <img class="relative h-10 w-10" src={image} alt={alt}> -->
            ${renderComponent($$result, "Image", $$Image, { "width": 75, "class": "rounded relative h-10 w-10 object-cover object-center", "src": image, "alt": "icon" })}
        </div>
        <div>
            <img class="h-3 mx-2" src="/images/icons/next.svg" alt="An right-arrow icon.">
        </div>
        <div class="relative flex flex-col">
            <div class="grup-hover:underline decoration-double decoration-secondary decoration-2 underline-offset-4 transition-all duration-300">
                ${text}
            </div>
            <div class="w-0 group-hover:w-full h-0.5 bg-secondary btransition-all duration-300">
            </div>
        </div>
        <!-- <div>
            <img class="h-4" src="/images/icons/next.svg">
        </div> -->
    </div>
</a>`;
});

const $$Astro$9 = createAstro("/home/dol/site/src/pages/photos.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Photos = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
  Astro2.self = $$Photos;
  import('./chunks/van1.27d0cea1.mjs');
  Astro2.props;
  return renderTemplate`<html lang="en">
	${renderComponent($$result, "Base", $$Base, { "title": "Donald Jewkes - Photos", "description": "Photos provide the illusion of permenance. I like that about them." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, { "id": "top" })}${maybeRenderHead($$result)}<div class="p-4 max-w-md ">
			${renderComponent($$result, "PhotoDirectory", $$PhotoDirectory, { "class": "relative py-10", "link": "/photos/vancouver", "image": import('./chunks/vanicon.c6192cde.mjs'), "text": "Vancouver", "alt": "Vancouver bear." })}
			${renderComponent($$result, "PhotoDirectory", $$PhotoDirectory, { "class": "relative py-1", "link": "/photos/sf", "image": import('./chunks/sficon.65175630.mjs'), "text": "SF", "alt": "San Fransisco House." })}
			<div class=""></div>

		</div>` })}
</html>`;
});

const $$file$7 = "/home/dol/site/src/pages/photos.astro";
const $$url$7 = "/photos";

const _page8 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Photos,
	file: $$file$7,
	url: $$url$7
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$8 = createAstro("/home/dol/site/src/pages/thinks.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Thinks = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$Thinks;
  Astro2.props;
  return renderTemplate`<html lang="en">
	${renderComponent($$result, "Base", $$Base, { "title": "Donald Jewkes - Thinks", "description": "What's going on in my brain." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, {})}${maybeRenderHead($$result)}<div class="p-4">
			<div class="">Brain empty.</div>
			<div class="font-light text-zinc-600 text-sm ">Check back tomorrow.</div>
		</div>` })}
</html>`;
});

const $$file$6 = "/home/dol/site/src/pages/thinks.astro";
const $$url$6 = "/thinks";

const _page9 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Thinks,
	file: $$file$6,
	url: $$url$6
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$7 = createAstro("/home/dol/site/src/pages/about.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$About = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$About;
  Astro2.props;
  return renderTemplate`<html lang="en">
	${renderComponent($$result, "Base", $$Base, { "title": "Donald Jewkes - About", "description": "I live in Vancouver, Canada and I'm a developer at MotionHall. We are working to accelerate the rate of tech transfer in the life sciences." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, {})}${maybeRenderHead($$result)}<div class="p-4 lg:py-6 max-w-2x text-zinc-800">
			<div class="flex flex-row items-center ">
				<img class="relative rounded h-24 w-24	" src="/images/icons/donaldicon.jpg">
				<!-- <Image width={200} height={200} class="relative rounded h-16 w-16" src={import("/public/images/icons/dol_icosm.jpg")} alt="icon"></Image> -->
				<!-- <div class="absolute mt-2 ml-1 -z-10 rounded h-16 w-16 bg-primary"></div> -->
				<div class="pl-4">
					<div class="font-bold ">Hey, I'm Donald.</div>
					<div class="">I live in Vancouver, Canada.</div>
				</div>
			</div>
			
			<div class="pt-4 text-zinc-600 space-y-2">
				<div>
					<span>I'm a developer at </span>
					${renderComponent($$result, "Link", $$Link, { "href": "http://www.motionhall.com", "text": "MotionHall", "nt": "1" })}.
					<span>We are working to accelerate tech transfer in the life sciences. Recently I've been building infrastructure to track intellectual property across the pharmaceutical industry.</span>
				</div>
				<div class="">I've also been learning about biotech R&D, transactions, and regulatory pathways.</div>
				<div>You can see some of the projects I've worked on in the past ${renderComponent($$result, "Link", $$Link, { "href": "/projects", "text": "here" })}. Sometimes I write about ${renderComponent($$result, "Link", $$Link, { "href": "/bread", "text": "bread" })} or shoot ${renderComponent($$result, "Link", $$Link, { "href": "/photos", "text": "photos" })}</div>
			</div>
			<div class="pt-6 text-neutral-800 font-bold " id="contact">Get in touch</div>
			<div class="text-zinc-600">donaldjewkes [at] gmail [dot] com</div>
		</div>` })}

</html>`;
});

const $$file$5 = "/home/dol/site/src/pages/about.astro";
const $$url$5 = "/about";

const _page10 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$About,
	file: $$file$5,
	url: $$url$5
}, Symbol.toStringTag, { value: 'Module' }));

React.props;
function Toasters(props) {
  return /* @__PURE__ */ jsxs("div", {
    class: "pt-2",
    children: [/* @__PURE__ */ jsxs("div", {
      class: " text-lg",
      children: ["Rating: ", /* @__PURE__ */ jsxs("span", {
        class: "font-bold",
        children: [props.numToasters, "/10 Toasters"]
      })]
    }), /* @__PURE__ */ jsxs("div", {
      class: "p-1.5 bg-primary inline-flex rounded space-x-1",
      children: [[...Array(props.numToasters)].map((star) => {
        return /* @__PURE__ */ jsx("div", {
          children: /* @__PURE__ */ jsx("img", {
            class: "h-6",
            src: "/images/icons/btoaster.png"
          })
        });
      }), [...Array(10 - props.numToasters)].map((star) => {
        return /* @__PURE__ */ jsx("div", {
          children: /* @__PURE__ */ jsx("img", {
            class: "h-6 grayscale opacity-50",
            src: "/images/icons/btoaster.png"
          })
        });
      })]
    })]
  });
}
__astro_tag_component__(Toasters, "@astrojs/react");

const $$Astro$6 = createAstro("/home/dol/site/src/components/BreadPage.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$BreadPage = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$BreadPage;
  const { bread, bakery, image, toasters, alt, bakeryLink } = Astro2.props;
  return renderTemplate`${maybeRenderHead($$result)}<div class="p-6">
    <h1 class="text-xl font-bold text-zinc-800">${bread}</h1>
    <h2 class="font-light text-zinc-600"><span class="text-xs italic">from</span> <a class="underline"${addAttribute(bakeryLink, "href")}>${bakery}</a></h2>
    <div class="py-4 space-y-2 flex flex-col">
        ${renderSlot($$result, $$slots["pre-image"])}
        <div class="py-6 relative flex flex-col items-center sm:items-start">
            ${renderComponent($$result, "Image", $$Image, { "width": 500, "height": 500, "class": "w-80 object-cover object-center rounded", "src": image, "alt": alt })}
            ${renderComponent($$result, "Toasters", Toasters, { "numToasters": toasters })}
        </div>
        ${renderSlot($$result, $$slots["post-image"])}

    </div>
</div>`;
});

const $$Astro$5 = createAstro("/home/dol/site/src/pages/bread/nelson-chocolate.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$NelsonChocolate = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$NelsonChocolate;
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": "Dark Chocolate Sourdough from Nelson the Seagull - Vancouver Bread Reviews", "description": "Dark Chocolate Sourdough bread review from Nelson the Seagull in Vancouver, Canada." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, {})}${renderComponent($$result, "BreadPage", $$BreadPage, { "bread": "Dark Chocolate Sourdough", "bakery": "Nelson the Seagull", "image": import('./chunks/nelson-chocolate2.31977f62.mjs'), "link": "https://www.nelsontheseagull.com/", "toasters": 7, "alt": "A dark chocolate sourdough." }, { "post-image": () => renderTemplate`${maybeRenderHead($$result)}<div class="space-y-2">
			<div>This sourdough was particularly pretty. It was reminiscent of a dark rye but there were visible pockets of chocolate throughout.</div>
			<div class="">There is a nutty bitterness that will appease dark chocolate enthusiasts. I found the chocolate gave the crumb a nice moisture. 
			</div>
			<div class="">
				I enjoyed this bread most toasted with a light coating of warm peanut butter.
			</div>
		</div>`, "pre-image": () => renderTemplate`<div class="space-y-3">
			<span>This loaf came recommended from a friend. I picked it up on a rainy Thursday morning before work.
				The bread was still warm which made the walk home pleasant.
			</span>
			
		</div>` })}` })}`;
});

const $$file$4 = "/home/dol/site/src/pages/bread/nelson-chocolate.astro";
const $$url$4 = "/bread/nelson-chocolate";

const _page11 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$NelsonChocolate,
	file: $$file$4,
	url: $$url$4
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$4 = createAstro("/home/dol/site/src/pages/bread/purebread-olive.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$PurebreadOlive = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$PurebreadOlive;
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": "Rosemary Olive - Vancouver Bread Reviews", "description": "Rosemary Olive bread review from Purebread in Vancouver, Canada." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, {})}${maybeRenderHead($$result)}<div class="p-4 max-w-xl">
		<h1 class="text-xl font-bold">Rosemary Olive</h1>
		<h2 class="font-light text-zinc-600"><span class="text-xs italic">from</span> <a class="underline" href="https://www.purebread.ca/">Purebread</a></h2>
		<div class="py-4 space-y-2 flex flex-col">
			<span>I got this loaf of Rosemary Olive from Purebread last Saturday. This is what's left of it after a day and a half:</span>			
			<div class="py-2 relative flex flex-col items-center sm:items-start">
				<img class="w-80 h-80 object-cover rounded" src="/images/bread/purebread-ro.jpg">
				${renderComponent($$result, "Toasters", Toasters, { "numToasters": 5 })}

			</div>
			<div>Despite eating this quickly, I was a little disappointed with this loaf.</div>
			<div class="">The flavour was poorly dispersed. The olives were the only dominant pockets, rosemary was an afterthought. The crumb was very white and leaned dry. The crust had a satisfying crunch factor but was difficult to cut.
			</div>
			<div class="">
				I enjoyed this bread most lightly toasted with generous butter.
			</div>

			<div>It's clear the staff at Purebread enjoy being there. Plus one toaster for the excellent service.</div>
			<div class="inline-flex">
				<div class="font-bold pr-1">Bonus Toaster +1</div>
				<img class="h-6" src="/images/icons/btoaster.png">

			</div>
		</div>
	</div>` })}`;
});

const $$file$3 = "/home/dol/site/src/pages/bread/purebread-olive.astro";
const $$url$3 = "/bread/purebread-olive";

const _page12 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$PurebreadOlive,
	file: $$file$3,
	url: $$url$3
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$3 = createAstro("/home/dol/site/src/pages/bread/fife-cinnamon.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$FifeCinnamon = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$FifeCinnamon;
  return renderTemplate`${renderComponent($$result, "Base", $$Base, { "title": "Cinnamon Raisin from Fife - Vancouver Bread Reviews", "description": "Cinnamon Raisin bread review from Fife in Vancouver, Canada." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, {})}${renderComponent($$result, "BreadPage", $$BreadPage, { "bread": "Cinnamon Raisin", "bakery": "Fife Bakery", "image": import('./chunks/fife-frenchtoast.d44a8728.mjs'), "toasters": 8, "alt": "A dark chocolate sourdough.", "link": "https://fifebakery.square.site/" }, { "post-image": () => renderTemplate`${maybeRenderHead($$result)}<div class="space-y-3">
			<div>I tore off some chunks of this on the walk home. The crumb was warm, doughy and delicious. I made french toast with it the next morning. This was definitely denser than French toast that you would make with a brioche, but I found the raisins made up for it.
			</div>
			<div>
				I will be going back to Fife. I'm sure their line will be shorter on a weekday morning.
			</div>
		</div>`, "pre-image": () => renderTemplate`<div class="space-y-3">
			<div>I went to Fife twice before actually getting in. Notably, Fife is a bakery that doesn't open before 9am. After trying their bread I realized <i>they don't need</i> to open before 9am.</div>			
			<div>This mid November saturday morning the low fall light fell through my blinds. I owed it to myself to experience this pocket of sun as it was preceeded by a week of Vancouver gray.</div>
			<div>I saw multiple bright puffers tucked under arms as I made my way towards Mount Pleasant. I delayered as well. Today was reminiscent of late september warmth.</div>
			<div>There was a line outside of Fife when I landed around 9:30am. After a short wait I made my way into the cozy interior. 
				Regulars occupied the limited seating areas and chatted with the barista. When I inquired, she recommended that I try the cinnamon raisin loaf, one of their seasonal offerings.</div>
		</div>` })}` })}`;
});

const $$file$2 = "/home/dol/site/src/pages/bread/fife-cinnamon.astro";
const $$url$2 = "/bread/fife-cinnamon";

const _page13 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$FifeCinnamon,
	file: $$file$2,
	url: $$url$2
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro$2 = createAstro("/home/dol/site/src/components/BreadLink.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$BreadLink = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$BreadLink;
  const { link, image, alt, breadName, bakery } = Astro2.props;
  return renderTemplate`${maybeRenderHead($$result)}<a class="group"${addAttribute(link, "href")}>
    <div class="inline-flex flex-row ">
        <div class="inline-flex flex-row items-center p-3">
            <img class="ring-1 rounded-sm ring-lime-800 group-hover:ring-amber-400 transition-all duration-300 ring-offset-2 ring-offset-neutral-100 w-12 h-12 object-cover"${addAttribute(image, "src")}${addAttribute(breadName, "alt")}>
            <div class="px-4 text-zinc-800 flex flex-col">
                <div class="font-bold text-zinc-800">${breadName}</div> 
                <div class="font-light text-zinc-600 text-sm"><span class="text-xs italic">from </span>${bakery}</div>
            </div>
        </div>
    </div>
</a>`;
});

const $$Astro$1 = createAstro("/home/dol/site/src/pages/bread.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$Bread = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Bread;
  return renderTemplate`<html lang="en">
	${renderComponent($$result, "Base", $$Base, { "title": "Donald Jewkes - Vancouver Bread Reviews", "description": "Trying to find the best bread in Vancouver." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, {})}${maybeRenderHead($$result)}<div class="p-4">
			<h1 class="text-xl text-zinc-800 font-bold">Vancouver Bread Reviews</h1>
			<h2 class="text-zinc-600">
				I try bread and tell you what I think.
			</h2>
			<div class="py-4 grid grid-cols-1 ">
				<div>
					${renderComponent($$result, "BreadLink", $$BreadLink, { "link": "/bread/purebread-olive", "image": "/images/bread/purebread-ro-icon.jpg", "breadName": "Rosemary Olive", "bakery": "Purebread" })}
				</div>
				<div class="ml-2 w-40 border-t border-1 border-lime-800/50 my-2"></div>
				<div>
					${renderComponent($$result, "BreadLink", $$BreadLink, { "link": "/bread/nelson-chocolate", "image": "/images/bread/nelson-icon.jpg", "breadName": "Dark Chocolate Sourdough", "bakery": "Nelson the Seagull" })}
				</div>
				<div class="ml-2 w-40 border-t border-1 border-lime-800/50 my-2"></div>
				<div>
					${renderComponent($$result, "BreadLink", $$BreadLink, { "link": "/bread/fife-cinnamon", "image": "/images/bread/fife-ft-icon.jpg", "breadName": "Cinnamon Raisin", "bakery": "Fife" })}
				</div>
				
			</div>
			
			<div class="">
				<div class="font-bold text-lg text-zinc-800 ">Future Reviews:</div>
				<div class="pt-2 text-neutral-600">
					<ul class="ml-4 list-disc">
						<li class="line-through">Dark Chocolate Sourdough from Nelson the Seagull</li>
						<li>Terra Breads</li>
						<li>Birds and the Beets</li>
						<li>Bâtard Bakery</li>
						<li>Fratlli's</li>
						<li>Cob's</li>
						<li>Safeway $1.99 loaf</li>
					</ul>
				</div>
			</div>

		</div>` })}
</html>`;
});

const $$file$1 = "/home/dol/site/src/pages/bread.astro";
const $$url$1 = "/bread";

const _page14 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Bread,
	file: $$file$1,
	url: $$url$1
}, Symbol.toStringTag, { value: 'Module' }));

const $$Astro = createAstro("/home/dol/site/src/pages/404.astro", "https://www.donaldjewkes.com/", "file:///home/dol/site/");
const $$404 = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$404;
  Astro2.props;
  return renderTemplate`<html lang="en">
	${renderComponent($$result, "Base", $$Base, { "title": "Donald Jewkes - About", "description": "I live in Vancouver, Canada and I'm a developer at MotionHall. We are working to accelerate the rate of tech transfer in the life sciences." }, { "default": () => renderTemplate`${renderComponent($$result, "DirHeader", $$DirHeader, {})}${maybeRenderHead($$result)}<div class="p-4 lg:py-6 max-w-2x text-zinc-800">
			<div class="flex flex-col items-start ">
				<div class="text-lg font-bold pb-4">Hey, welcome to the loft.</div>
				${renderComponent($$result, "Image", $$Image, { "width": 600, "class": "relative rounded w-full h-52 sm:h-96 object-cover", "src": import('./chunks/loft2.7e82ffd9.mjs'), "alt": "icon" })}
				<!-- <div class="absolute mt-2 ml-1 -z-10 rounded h-16 w-16 bg-primary"></div> -->
				
			</div>
			
			<div class="pt-4 text-zinc-600 space-y-2">
					<div>Make yourself at home.</div>
					<div>I'll put the kettle on for tea.</div>
					<div>Feel free to grab something to read while you wait:</div>
					<ul class="py-2 pl-10 list-[disc] space-y-2">
						<li>${renderComponent($$result, "Link", $$Link, { "href": "https://www.schneier.com/blog/archives/2013/11/surveillance_as_1.html", "text": "Surveillance as a Business Model", "nt": "t" })}</li>
						<li>${renderComponent($$result, "Link", $$Link, { "href": "https://danluu.com/cocktail-ideas/", "text": "Cocktail Party Ideas", "nt": "t" })}</li>
						<li>${renderComponent($$result, "Link", $$Link, { "href": "https://www.celinehh.com/regulatory", "text": "Basics of Regulatory Affairs", "nt": "t" })}</li>
						<li>${renderComponent($$result, "Link", $$Link, { "href": "https://devonzuegel.com/post/we-should-be-building-cities-for-people-not-cars", "text": "We Should Be Building Cities for People, Not Cars", "nt": "t" })}</li>
						<li>${renderComponent($$result, "Link", $$Link, { "href": "https://guzey.com/how-life-sciences-actually-work/", "text": "How Life Sciences Actually Work", "nt": "t" })}</li>
					</ul>
					<div class="pt-3">Here are some records, if you'd like to throw one on:</div>
					<div class="py-3 flex flex-row w-full justify-around max-w-sm">
						<iframe class="hover:animate-spin ease-in-out opacity-75 transition-all" style="border-radius:100px" src="https://open.spotify.com/embed/album/4h5av08hHhOyyINApKfnEE?utm_source=generator" width="80" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
						<iframe class=" hover:animate-spin ease-in-out opacity-75 transition-all" style="border-radius:100px" src="https://open.spotify.com/embed/album/07KJ48Y7pbXvz3Q4H44GZl?utm_source=generator" width="80" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
						<!-- <div class=""><iframe class="hover:animate-spin ease-in-out opacity-75 transition-all" style="border-radius:100px" src="https://open.spotify.com/embed/album/2BRedpXNmL3NkN2eutmXZ2?utm_source=generator" width="80" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>
						<iframe class=" hover:animate-spin ease-in-out opacity-75 transition-all" style="border-radius:100px" src="https://open.spotify.com/embed/album/6H9lWC3gxOefkRfDrxmlaB?utm_source=generator" width="80" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe> -->
						<iframe class="hover:animate-spin ease-in-out opacity-75 transition-all" style="border-radius:100px" src="https://open.spotify.com/embed/album/07bQPrG1jSRCkd9SvBXsy4?utm_source=generator" width="80" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
					</div>
					<div class="py-3">Just let me know when you want to ${renderComponent($$result, "Link", $$Link, { "href": "/", "text": "head out", "nt": "t" })}.</div>
			</div>
		</div>` })}

</html>`;
});

const $$file = "/home/dol/site/src/pages/404.astro";
const $$url = "/404";

const _page15 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$404,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const pageMap = new Map([['node_modules/@astrojs/image/dist/endpoint.js', _page0],['src/pages/index.astro', _page1],['src/pages/makesomethingsaturday.astro', _page2],['src/pages/projects/liven.astro', _page3],['src/pages/projects/wtwm.astro', _page4],['src/pages/projects.astro', _page5],['src/pages/photos/vancouver.astro', _page6],['src/pages/photos/sf.astro', _page7],['src/pages/photos.astro', _page8],['src/pages/thinks.astro', _page9],['src/pages/about.astro', _page10],['src/pages/bread/nelson-chocolate.astro', _page11],['src/pages/bread/purebread-olive.astro', _page12],['src/pages/bread/fife-cinnamon.astro', _page13],['src/pages/bread.astro', _page14],['src/pages/404.astro', _page15],]);
const renderers = [Object.assign({"name":"astro:jsx","serverEntrypoint":"astro/jsx/server.js","jsxImportSource":"astro"}, { ssr: server_default }),Object.assign({"name":"@astrojs/react","clientEntrypoint":"@astrojs/react/client.js","serverEntrypoint":"@astrojs/react/server.js","jsxImportSource":"react"}, { ssr: _renderer1 }),];

if (typeof process !== "undefined") {
  if (process.argv.includes("--verbose")) ; else if (process.argv.includes("--silent")) ; else ;
}

const SCRIPT_EXTENSIONS = /* @__PURE__ */ new Set([".js", ".ts"]);
new RegExp(
  `\\.(${Array.from(SCRIPT_EXTENSIONS).map((s) => s.slice(1)).join("|")})($|\\?)`
);

const STYLE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".css",
  ".pcss",
  ".postcss",
  ".scss",
  ".sass",
  ".styl",
  ".stylus",
  ".less"
]);
new RegExp(
  `\\.(${Array.from(STYLE_EXTENSIONS).map((s) => s.slice(1)).join("|")})($|\\?)`
);

function getRouteGenerator(segments, addTrailingSlash) {
  const template = segments.map((segment) => {
    return "/" + segment.map((part) => {
      if (part.spread) {
        return `:${part.content.slice(3)}(.*)?`;
      } else if (part.dynamic) {
        return `:${part.content}`;
      } else {
        return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    }).join("");
  }).join("");
  let trailing = "";
  if (addTrailingSlash === "always" && segments.length) {
    trailing = "/";
  }
  const toPath = compile(template + trailing);
  return toPath;
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  return {
    ...serializedManifest,
    assets,
    routes
  };
}

const _manifest = Object.assign(deserializeManifest({"adapterName":"@astrojs/netlify/functions","routes":[{"file":"","links":[],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"type":"endpoint","route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/@astrojs/image/dist/endpoint.js","pathname":"/_image","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/","type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/makesomethingsaturday","type":"page","pattern":"^\\/makesomethingsaturday\\/?$","segments":[[{"content":"makesomethingsaturday","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/makesomethingsaturday.astro","pathname":"/makesomethingsaturday","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/projects/liven","type":"page","pattern":"^\\/projects\\/liven\\/?$","segments":[[{"content":"projects","dynamic":false,"spread":false}],[{"content":"liven","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/projects/liven.astro","pathname":"/projects/liven","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/projects/wtwm","type":"page","pattern":"^\\/projects\\/wtwm\\/?$","segments":[[{"content":"projects","dynamic":false,"spread":false}],[{"content":"wtwm","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/projects/wtwm.astro","pathname":"/projects/wtwm","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/projects","type":"page","pattern":"^\\/projects\\/?$","segments":[[{"content":"projects","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/projects.astro","pathname":"/projects","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/photos/vancouver","type":"page","pattern":"^\\/photos\\/vancouver\\/?$","segments":[[{"content":"photos","dynamic":false,"spread":false}],[{"content":"vancouver","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/photos/vancouver.astro","pathname":"/photos/vancouver","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/photos/sf","type":"page","pattern":"^\\/photos\\/sf\\/?$","segments":[[{"content":"photos","dynamic":false,"spread":false}],[{"content":"sf","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/photos/sf.astro","pathname":"/photos/sf","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/photos","type":"page","pattern":"^\\/photos\\/?$","segments":[[{"content":"photos","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/photos.astro","pathname":"/photos","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/thinks","type":"page","pattern":"^\\/thinks\\/?$","segments":[[{"content":"thinks","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/thinks.astro","pathname":"/thinks","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/about","type":"page","pattern":"^\\/about\\/?$","segments":[[{"content":"about","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/about.astro","pathname":"/about","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/bread/nelson-chocolate","type":"page","pattern":"^\\/bread\\/nelson-chocolate\\/?$","segments":[[{"content":"bread","dynamic":false,"spread":false}],[{"content":"nelson-chocolate","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/bread/nelson-chocolate.astro","pathname":"/bread/nelson-chocolate","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/bread/purebread-olive","type":"page","pattern":"^\\/bread\\/purebread-olive\\/?$","segments":[[{"content":"bread","dynamic":false,"spread":false}],[{"content":"purebread-olive","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/bread/purebread-olive.astro","pathname":"/bread/purebread-olive","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/bread/fife-cinnamon","type":"page","pattern":"^\\/bread\\/fife-cinnamon\\/?$","segments":[[{"content":"bread","dynamic":false,"spread":false}],[{"content":"fife-cinnamon","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/bread/fife-cinnamon.astro","pathname":"/bread/fife-cinnamon","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/bread","type":"page","pattern":"^\\/bread\\/?$","segments":[[{"content":"bread","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/bread.astro","pathname":"/bread","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/404.6e29153d.css"],"scripts":[{"stage":"head-inline","children":"!(function(w,p,f,c){c=w[p]=Object.assign(w[p]||{},{\"lib\":\"/~partytown/\",\"debug\":false});c[f]=(c[f]||[]).concat([\"dataLayer.push\"])})(window,'partytown','forward');/* Partytown 0.7.2 - MIT builder.io */\n!function(t,e,n,i,r,o,a,d,s,c,p,l){function u(){l||(l=1,\"/\"==(a=(o.lib||\"/~partytown/\")+(o.debug?\"debug/\":\"\"))[0]&&(s=e.querySelectorAll('script[type=\"text/partytown\"]'),i!=t?i.dispatchEvent(new CustomEvent(\"pt1\",{detail:t})):(d=setTimeout(w,1e4),e.addEventListener(\"pt0\",f),r?h(1):n.serviceWorker?n.serviceWorker.register(a+(o.swPath||\"partytown-sw.js\"),{scope:a}).then((function(t){t.active?h():t.installing&&t.installing.addEventListener(\"statechange\",(function(t){\"activated\"==t.target.state&&h()}))}),console.error):w())))}function h(t){c=e.createElement(t?\"script\":\"iframe\"),t||(c.setAttribute(\"style\",\"display:block;width:0;height:0;border:0;visibility:hidden\"),c.setAttribute(\"aria-hidden\",!0)),c.src=a+\"partytown-\"+(t?\"atomics.js?v=0.7.2\":\"sandbox-sw.html?\"+Date.now()),e.body.appendChild(c)}function w(t,n){for(f(),t=0;t<s.length;t++)(n=e.createElement(\"script\")).innerHTML=s[t].innerHTML,e.head.appendChild(n);c&&c.parentNode.removeChild(c)}function f(){clearTimeout(d)}o=t.partytown||{},i==t&&(o.forward||[]).map((function(e){p=t,e.split(\".\").map((function(e,n,i){p=p[i[n]]=n+1<i.length?\"push\"==i[n+1]?[]:p[i[n]]||{}:function(){(t._ptf=t._ptf||[]).push(i,arguments)}}))})),\"complete\"==e.readyState?u():(t.addEventListener(\"DOMContentLoaded\",u),t.addEventListener(\"load\",u))}(window,document,navigator,top,window.crossOriginIsolated);"}],"routeData":{"route":"/404","type":"page","pattern":"^\\/404\\/?$","segments":[[{"content":"404","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/404.astro","pathname":"/404","_meta":{"trailingSlash":"ignore"}}}],"site":"https://www.donaldjewkes.com/","base":"/","markdown":{"drafts":false,"syntaxHighlight":"shiki","shikiConfig":{"langs":[],"theme":"github-dark","wrap":false},"remarkPlugins":[],"rehypePlugins":[],"remarkRehype":{},"extendDefaultPlugins":false,"isAstroFlavoredMd":false},"pageMap":null,"renderers":[],"entryModules":{"\u0000@astrojs-ssr-virtual-entry":"entry.mjs","/home/dol/site/public/images/pages/church.jpg":"chunks/church.cb9d8179.mjs","/home/dol/site/public/images/vancouver/van1.jpg":"chunks/van1.27d0cea1.mjs","/home/dol/site/public/images/vancouver/van4.jpg":"chunks/van4.e6a259e4.mjs","/home/dol/site/public/images/vancouver/van3.jpg":"chunks/van3.5e7c8c98.mjs","/home/dol/site/public/images/vancouver/van2.jpg":"chunks/van2.616916f5.mjs","/home/dol/site/public/images/sf/sfp8.jpg":"chunks/sfp8.8fb405ce.mjs","/home/dol/site/public/images/sf/sfp2.jpg":"chunks/sfp2.4c0afa01.mjs","/home/dol/site/public/images/sf/sfp3.jpg":"chunks/sfp3.f5155697.mjs","/home/dol/site/public/images/sf/sfp4.jpg":"chunks/sfp4.46cc0938.mjs","/home/dol/site/public/images/sf/sfp6.jpg":"chunks/sfp6.baf06399.mjs","/home/dol/site/public/images/sf/sfp9.jpg":"chunks/sfp9.e2bcc3c1.mjs","/home/dol/site/public/images/vancouver/vanicon.jpg":"chunks/vanicon.c6192cde.mjs","/home/dol/site/public/images/sf/sficon.jpg":"chunks/sficon.65175630.mjs","/home/dol/site/public/images/bread/nelson-chocolate2.jpg":"chunks/nelson-chocolate2.31977f62.mjs","/home/dol/site/public/images/bread/fife-frenchtoast.jpg":"chunks/fife-frenchtoast.d44a8728.mjs","/home/dol/site/public/images/pages/loft2.png":"chunks/loft2.7e82ffd9.mjs","@astrojs/react/client.js":"client.bf4f0f8e.js","astro:scripts/before-hydration.js":""},"assets":["/assets/nelson-chocolate2.345a1696.jpg","/assets/sfp2.ad420bd3.jpg","/assets/sfp6.4ae588a3.jpg","/assets/sfp3.887e5139.jpg","/assets/loft2.56936b10.png","/assets/vanicon.57f97265.jpg","/assets/sficon.a0de6801.jpg","/assets/fife-frenchtoast.11c5e205.jpg","/assets/van2.7b26182c.jpg","/assets/sfp4.ac484455.jpg","/assets/van1.c38430cd.jpg","/assets/van4.48d9d1d1.jpg","/assets/sfp9.b60a5b83.jpg","/assets/church.aa6fa51d.jpg","/assets/sfp8.d77f593e.jpg","/assets/van3.baa7f6e4.jpg","/assets/404.6e29153d.css","/client.bf4f0f8e.js","/favicon.ico","/favicon[old].ico","/images/headericon.png","/images/bread/fife-frenchtoast.jpg","/images/bread/fife-ft-icon.jpg","/images/bread/nelson-chocolate1.jpg","/images/bread/nelson-chocolate2.jpg","/images/bread/nelson-icon.jpg","/images/bread/neoclassicalbread.jpg","/images/bread/purebread-ro-icon.jpg","/images/bread/purebread-ro.jpg","/images/bread/toaster.png","/images/icons/WTWM_LOGO.svg","/images/icons/bread-lg.png","/images/icons/bread.png","/images/icons/btoaster.png","/images/icons/camera-lg.png","/images/icons/camera.png","/images/icons/camera[old].png","/images/icons/chisel.png","/images/icons/dico.jpg","/images/icons/dol-lg.png","/images/icons/dol.png","/images/icons/dol_cropped.jpg","/images/icons/dol_ico.jpg","/images/icons/dol_icosm.jpg","/images/icons/dolyellow.png","/images/icons/donaldicon.jpg","/images/icons/fulltoast.png","/images/icons/gtoaster.png","/images/icons/livenlogo.png","/images/icons/neuronicon.png","/images/icons/next.svg","/images/icons/onenfb.svg","/images/icons/stfx.png","/images/icons/thinking-lg.png","/images/icons/thinking.png","/images/icons/thinking[old].png","/images/icons/toaster.png","/images/icons/wave-lg.png","/images/icons/wave.png","/images/misc/footer.jpg","/images/misc/orbitallounge.webp","/images/misc/wifi.png","/images/pages/church.jpg","/images/pages/hero.jpg","/images/pages/hero2.jpg","/images/pages/loft.jpg","/images/pages/loft2.png","/images/pages/searanch.jpg","/images/pages/searanch2.jpg","/images/pages/spark.jpg","/images/pages/wtwmposter.png","/images/sf/DSCF4326.jpg","/images/sf/sficon.jpg","/images/sf/sfl1.jpg","/images/sf/sfp1.jpg","/images/sf/sfp2.jpg","/images/sf/sfp3.jpg","/images/sf/sfp4.jpg","/images/sf/sfp5.jpg","/images/sf/sfp6.jpg","/images/sf/sfp7.jpg","/images/sf/sfp8.jpg","/images/sf/sfp9.jpg","/images/vancouver/van1.jpg","/images/vancouver/van2.jpg","/images/vancouver/van3.jpg","/images/vancouver/van4.jpg","/images/vancouver/vanicon.jpg","/~partytown/partytown-atomics.js","/~partytown/partytown-media.js","/~partytown/partytown-sw.js","/~partytown/partytown.js"]}), {
	pageMap: pageMap,
	renderers: renderers
});
const _args = {};

const _exports = adapter.createExports(_manifest, _args);
const handler = _exports['handler'];

const _start = 'start';
if(_start in adapter) {
	adapter[_start](_manifest, _args);
}

export { handler };
