import { createApp } from './simple-vue';

createApp({
  data() {
    return {
      message: '你好，世界！',
    };
  },
  methods: {
    sayHello() {
      console.log(this.message);
    }
  },
  mounted() {
    console.log('组件挂载');
  },
  unmounted() {
    console.log('组件卸载');
  },
}).mount('#app');
