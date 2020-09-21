"use strict";

/* import basic Vue app */
import Vue from "vue";
import App from "@/App.vue";

/* import Vue plugin */
import VueSvgInlinePlugin from "../../../src";
import "../../../src/polyfills";

/* use Vue plugin */
VueSvgInlinePlugin.install(Vue, {
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

/* turn off production tip on Vue startup */
Vue.config.productionTip = false;

/* initialize and mount Vue app */
new Vue({
	render: h => h(App),
}).$mount("#app");
