<template>
    <div class="popper-window">
        <span class="popper-window-arrow"></span>
        <div class="popper-window-content">
            <slot></slot>
        </div>
    </div>
</template>

<script>
    export default {
        name: "PopperWindow"
    }
</script>

<style lang="scss">
    $arrow-height: 10px;

    .popper-window {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
    }

    .popper-window-content {
        width: 100%;
        height: calc( 100% - #{2*$arrow-height} );
        margin-bottom: $arrow-height;
    }

    .v-modal {
        margin-top: $arrow-height;
        height: calc( 100% - #{2*$arrow-height} ) !important;
        border-radius: 5px;
    }

    .popper-window-arrow {
        width: 0;
        height: 0;
        display: block;
        line-height: 0;
        text-align: center;
        border-bottom: $arrow-height solid white;
        border-left: $arrow-height solid transparent;
        border-right: $arrow-height solid transparent;
        margin-left: calc( 50% - #{$arrow-height} );
    }
</style>
