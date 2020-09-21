<template>
	<h1>{{ message }}</h1>
	<button @click="count++">count is: {{ count }}</button>
	<p>Edit <code>components/HelloWorld.vue</code> to test hot module replacement.</p>
</template>

<script>
"use strict";

export default {
	name: "HelloWorld",
	props: {
		message: String
	},
	data: () => ({
		count: 0
	})
};
</script>
