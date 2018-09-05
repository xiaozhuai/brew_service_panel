<template>
    <div id="app">
        <PopperWindow>
            <MainContent/>
        </PopperWindow>
    </div>
</template>

<script>
    import PopperWindow from "@/components/PopperWindow";
    import MainContent from "@/components/MainContent";

    export default {
        name: 'BrewServicePanel',
        components: {MainContent, PopperWindow},
    }
</script>

<style>
    #app {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
    }
</style>
