import Vue from "vue";
import Persistence from '@/../libs/Persistence';

Object.defineProperty(Vue.prototype, '$persistence', {
    value: Persistence
});
