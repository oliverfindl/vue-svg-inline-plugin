"use strict";

/* import basic Vue app */
import { createApp } from "vue";
import App from "./App.vue";
import "./index.scss";

/* import Vue plugin */
/* ! not working in dev mode ! */
import VueSvgInlinePlugin from "../../../src";
import "../../../src/polyfills";

/* intialize Vue app */
const app = createApp(App);

/* use Vue plugin */
app.use(VueSvgInlinePlugin, {
	attributes: {
		add: [{
			name: "class",
			value: "class-from-options"
		}],
		data: ["src"],
		remove: ["alt"]
	},
	cache: {
		version: "example"
	}
});

/* mount Vue app */
app.mount("#app");
