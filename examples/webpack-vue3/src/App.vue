<template>
	<img v-svg-inline class="vue-logo-img" src="@/assets/logo.svg" alt="Vue logo" />
	<HelloWorld message="Hello Vue 3.0 + Webpack" />
</template>

<script>
"use strict";

import HelloWorld from "@/components/HelloWorld.vue";

export default {
	name: "App",
	components: {
		HelloWorld
	}
};
</script>
