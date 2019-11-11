import Vue from "vue";
import App from "@/App.vue";

import VueSvgInlinePlugin from "../../../src";
import "../../../src/polyfills";

VueSvgInlinePlugin.install(Vue, {
	attributes: {
		add: [{
			name: "class",
			value: "class-from-options"
		}],
		data: ["src"],
		remove: ["alt"]
	}
});

Vue.config.productionTip = false;

new Vue({
	render: h => h(App),
}).$mount("#app");
