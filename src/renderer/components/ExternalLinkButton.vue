<template>
    <el-button size="mini" @click="linkClicked()" type="text"><slot></slot></el-button>
</template>

<script>
    const {shell} = require('electron');

    export default {
        name: "ExternalLinkButton",
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

</style>
