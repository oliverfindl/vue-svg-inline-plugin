declare module "vue-svg-inline-plugin" {
	
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
		axios?: any;
		xhtml?: boolean;
	}

	type InstallFunction = (app: any, options?: Options) => void;

	type VueSvgInlinePlugin = (InstallFunction & { install?: InstallFunction }) | { install: InstallFunction };

	const _default: VueSvgInlinePlugin;

	export { Options };

	export default _default;

}
