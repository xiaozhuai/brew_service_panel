import Vue from "vue";
import BrewServices from '@/../libs/BrewServices';

Object.defineProperty(Vue.prototype, '$brewServices', {
    value: BrewServices
});
