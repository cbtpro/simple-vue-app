export function createApp(options) {
  return {
    mount(selector) {
      const el = document.querySelector(selector);
      if (!el) return;

      const data = options.data();

      // 依赖追踪表，负责在数据变化时通知更新 DOM
      const bindings = {};

      // 响应式对象,它就是组件中你访问的 this.message
      const reactiveData = {};

      // 使用 Object.defineProperty 创建响应式
      Object.keys(data).forEach(key => {
        let internalValue = data[key];

        bindings[key] = [];

        Object.defineProperty(reactiveData, key, {
          get() {
            return internalValue;
          },
          set(newVal) {
            internalValue = newVal;
            // 触发所有绑定更新
            bindings[key].forEach(updateFn => updateFn());
          }
        });
      });

      // 构建上下文
      const ctx = {
        ...options.methods,
        ...reactiveData,
      };

      function compile(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // v-model
          if (node.hasAttribute('v-model')) {
            const key = node.getAttribute('v-model');
            node.value = reactiveData[key];

            node.addEventListener('input', e => {
              reactiveData[key] = e.target.value;
            });

            bindings[key].push(() => {
              node.value = reactiveData[key];
            });
          }

          // @click
          [...node.attributes].forEach(attr => {
            if (attr.name.startsWith('@')) {
              const eventName = attr.name.slice(1);
              const methodName = attr.value;
              node.addEventListener(eventName, ctx[methodName].bind(ctx));
            }
          });

          [...node.childNodes].forEach(child => compile(child));
        }

        // 插值
        if (node.nodeType === Node.TEXT_NODE) {
          const raw = node.textContent;
          const reg = /{{\s*(\w+)\s*}}/g;
          const matches = [...raw.matchAll(reg)];

          if (matches.length) {
            const update = () => {
              node.textContent = raw.replace(reg, (_, key) => reactiveData[key]);
            };
            update();
            matches.forEach(match => {
              const key = match[1];
              bindings[key].push(update);
            });
          }
        }
      }

      compile(el);

      if (options.mounted) {
        options.mounted.call(ctx);
      }
      if (options.unmounted) {
        window.addEventListener('beforeunload', () => {
          options.unmounted.call(ctx);
        });
      }
    }
  };
}
