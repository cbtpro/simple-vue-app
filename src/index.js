import { createApp } from './simple-vue';

createApp({
  data() {
    return {
      message: '你好，世界！',
    };
  },
  methods: {
    sayHello() {
      alert(this.message);
    }
  },
  mounted() {
    alert('组件挂载');
  },
  unmounted() {
    alert('组件卸载');
  },
}).mount('#app');
