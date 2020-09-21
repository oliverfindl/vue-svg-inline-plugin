<template>
	<div id="app" v-cloak>
		<img v-svg-inline class="vue-logo-img" src="@/assets/logo.svg" alt="Vue logo" />
		<HelloWorld message="Welcome to Your Vue.js App" />
	</div>
</template>

<script>
"use strict";

export default {
	name: "App",
	components: {
		HelloWorld: () => import("@/components/HelloWorld.vue")
	}
};
</script>

<style lang="scss">
#app {
	font-family: "Avenir", Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin-top: 60px;

	&[v-cloak] {
		display: none;
	}

	.vue-logo-img {
		max-width: 10rem;
	}
}
</style>
