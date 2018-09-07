<template>
    <a @click="linkClicked()"><slot></slot></a>
</template>

<script>
    const {shell} = require('electron');

    export default {
        name: "ExternalLink",
        props: {
            href: String,
        },
        methods: {
            linkClicked() {
                shell.openExternal(this.href);
            }
        }
    }
</script>

<style scoped>
    a {
        cursor: pointer;
    }

    a:hover {
        color: teal;
    }
</style>
