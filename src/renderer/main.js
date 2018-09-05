import Vue from 'vue';
import App from '@/App';
import "@/plugins/Element";
import "@/plugins/BrewServices";
import "@/plugins/Persistence";


if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
    components: {App},
    template: '<App/>'
}).$mount('#app');
