import { VueConstructor } from "vue";
import { App } from "@vue/runtime-core/dist/runtime-core";
import { AxiosInstance } from "axios";

declare namespace VueSvgInlinePlugin {

	type VueOrAppArgument = | VueConstructor | App;

	interface OptionsArgument {
		directive?: {
			name?: string,
			spriteModifierName?: string
		},
		attributes?: {
			merge?: string[],
			add?: { name: string, value: string }[],
			data?: string[],
			remove?: string[]
		},
		cache?: {
			version?: string,
			persistent?: boolean,
			removeRevisions?: boolean
		},
		intersectionObserverOptions?: any,
		axios?: AxiosInstance,
		xhtml?: boolean
	}

	export type InstallFunction = (VueOrApp: VueOrAppArgument, options?: OptionsArgument) => any;

}

type VueSvgInlinePlugin =
	| VueSvgInlinePlugin.InstallFunction & { install?: VueSvgInlinePlugin.InstallFunction }
	| { install: VueSvgInlinePlugin.InstallFunction };

declare const _default: VueSvgInlinePlugin;

export default _default;
