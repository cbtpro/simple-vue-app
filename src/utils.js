export function makeReactive(data, bindings = {}) {
  const reactiveData = {};

  Object.keys(data).forEach(key => {
    let internalValue = data[key];

    // 初始化绑定数组
    bindings[key] = [];

    Object.defineProperty(reactiveData, key, {
      get() {
        return internalValue;
      },
      set(newVal) {
        internalValue = newVal;
        bindings[key].forEach(update => update());
      },
      enumerable: true, // 👈 关键点：允许 ... 展开
    });
  });

  return reactiveData;
}