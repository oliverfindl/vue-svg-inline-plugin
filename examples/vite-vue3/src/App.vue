<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import HelloWorld from "./components/HelloWorld.vue";
</script>

<template>
	<img v-svg-inline class="vue-logo-img" src="./assets/logo.svg" alt="Vue logo" />
	<HelloWorld message="Hello Vue 3 + Vite" />
</template>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin-top: 60px;
}

#app .vue-logo-img {
	max-width: 10rem;
}
</style>
