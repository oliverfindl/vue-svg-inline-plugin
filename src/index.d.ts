declare module "vue-svg-inline-plugin" {

	import { VueConstructor as Vue2Constructor } from "vue";
	import { App as Vue3App } from "@vue/runtime-core/dist/runtime-core";
	import { AxiosInstance } from "axios";

	interface Options {
		directive?: {
			name?: string;
			spriteModifierName?: string;
		};
		attributes?: {
			clone?: string[];
			merge?: string[];
			add?: { name: string; value: string | number }[];
			data?: string[];
			remove?: string[];
		};
		cache?: {
			version?: string;
			persistent?: boolean;
			removeRevisions?: boolean;
		};
		intersectionObserverOptions?: any;
		axios?: AxiosInstance;
		xhtml?: boolean;
	}

	type InstallFunction = (app: | Vue2Constructor | Vue3App, options?: Options) => any;

	type VueSvgInlinePlugin = | InstallFunction & { install?: InstallFunction } | { install: InstallFunction };

	// const install: InstallFunction;

	const _default: VueSvgInlinePlugin;

	export { /* install, */ Options };

	export default _default;

}
