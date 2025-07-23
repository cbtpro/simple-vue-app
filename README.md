# 手把手来实现一个simple-vue2

vue1(2014年)发展到今天已经有11年了，但估计也有很多人也才刚刚开始学习vue3，今天就手把手来学习实现一个简易的vue，目的是来了解vue的底层原理，掰开了揉碎了，方便用户能更快的入手vue，能更快的和和vue达到人码合一的境界。

代码全部托管在[simple-vue-app](https://github.com/cbtpro/simple-vue-app)
## 搭建脚手架

把时间拉回到2014年，使用webpack搭建脚手架。
```
mkdir simple-vue
cd simple-vue
npm init -y & npm install --save-dev html-webpack-plugin webpack webpack-cli webpack-dev-server
```
新建`webpack.config.js`

```
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  mode: 'development',
  devServer: {
    static: './dist',
    port: 3000,
    hot: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  }
};

```
新建`index.html`

```html
<!DOCTYPE html>
<html lang="zh">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>简单vue实现</title>
</head>

<body>
  <div id="app">
    <input v-model="message" />
    <p>{{ message }}</p>
  </div>
</body>

</html>
```

## 程序入口

新建`src/index.js`作为程序入口

新建`src/simple-vue.js`作为vue的实现

在`src/simple-vue.js`创建一个createApp，作为vue的入口，并返回一个对象，对象中提供一个mounted，参数是一个selector选择器，用来挂载vue渲染的地方。

```js
export function createApp(options) {
  return {
    mount(selector) {}
  }
}
```

## vue组件的定义（约定）

这里的options是vue组件的定义，记住它并理解它，它是vue2的基础，是进阶vue3的基石。

总结一下，vue组件定义就是一个约定的js对象。

```js
{
  data() {
    return {
      message: '你好，世界！',
    }
  },
  methods: {
    sayHello() {
      console.log(this.message);
    }
  },
  mounted() {
    console.log('组件挂载');
    window.setTimeout(() => {
      this.message = '你好，世界！！！';
    }, 2000)
    window.setTimeout(() => {
      this.sayHello();
    });
  },
  unmounted() {
    console.log('组件卸载');
  },
}
```

接下来我们将导出的`createApp`导出在放在`src/index.js`中使用，并传入上面的组件定义。

```js
import { createApp } from './simple-vue';

createApp({
  data() {
    return {
      message: '你好，世界！',
    }
  },
  methods: {
    sayHello() {
      console.log(this.message);
    }
  },
  mounted() {
    console.log('组件挂载');
    window.setTimeout(() => {
      this.message = '你好，世界！！！';
    }, 2000)
    window.setTimeout(() => {
      this.sayHello();
    });
  },
  unmounted() {
    console.log('组件卸载');
  },
}).mount('#app');

```
可以看到已经有基本的vue组件的样子了，有数据状态、方法、挂载、卸载。

这里的`mount('#app')`是往`index.html`的`<div id="app"></div>`上去挂载。

## 启动命令

这时候可以使用`npx webpack serve`来启动项目，观察页面可以看到展示了页面原始的样子。

可以将命令维护到`package.json`中，下次使用`npm run dev`就可以运行了。

```json
{
  "name": "simple-vue",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "dev": "webpack serve",
    "build": "webpack",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "devDependencies": {
    "html-webpack-plugin": "^5.6.3",
    "webpack": "^5.100.2",
    "webpack-cli": "^6.0.1",
    "webpack-dev-server": "^5.2.2"
  }
}

```

## 拆分功能

下面我们的任务分别是

- 创建vue的实例ctx，方便任何时候调用vue的方法和属性。
- 创建状态data的双向数据绑定，使用[`Object.defineProperty`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)的get、set的方式，[Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set)的方式等后续再来重写。
- 实现v-model，简单实现即可，后续再重写成解析AST的方式来绑定
- 实现事件@click绑定
- 将模板语法{{ message }}替换成实际的值
- 实现mounted（mounted）生命周期函数
- 实现unmounted（beforeDestroy）生命周期函数

注意，以上的实现都只是简单的实现，不是一比一的还原vue，那将是一个大工程，目的只是为了方便实现和理解vue的原理。

## 创建vue实例，实现data的双向绑定

```
// 获得挂载的根节点
const el = document.querySelector(selector);
if (!el) {
  return;
}

// 获得状态data
const data = options.data();

// 创建vue实例/上下文，后面的一切都要在ctx上得到具体的应用
// 构建上下文
const ctx = Object.create(reactiveData);
// 将 methods 添加到 ctx，并绑定 this 为 ctx
for (const key in options.methods) {
  ctx[key] = options.methods[key].bind(ctx);
}

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
```
这里reactiveData就是data的双向绑定的对象了，这时候如果更改messaged的值，会调用reactiveData的set函数，如果获取就会调用get函数。

可以在[这里](https://code.juejin.cn/pen/7529905615288827914)练习一下，这个例子简单的实现了当数据发生变更，调用set就可以实时将值渲染到input中。

那相同的，如果input的input事件触发，也可以实时将更改的值应用到data中。
可以在[这里](https://code.juejin.cn/pen/7529909201406001202)练习一下,这个例子简单的实现了文本框是如何触发数据变更的，普通的data.count = ''也是一样的逻辑触发set，set中在触发更新元素内容的逻辑。

reactiveData是实现数据驱动视图更新的核心变量之一，当触发数据变更的重要媒介。

我们在定义个`bindings`来作为触发更新事件的媒介，把所有发生set时的白变更事件都放到bindings中，用v-mode="状态值的字面量"的字面量来当key，就能实现reactiveData和bindings的绑定了，只要具有相同的key就是对应set和get方法。

那么到编写代码了实现了，将这些功能抽象成通用的逻辑吧。


```js
// 将vue实例ctx中的data覆盖掉，这里应该只有ctx和data两个对象，所以可以使用Object.assign来事件，如果是复杂的具有多层级的结构，则不允许使用如此暴力的方法合并，要单独使用迭代的方式去实现
Object.assign(ctx, proxy);

  /**
  * 对页面挂载节点的内容进行解析，
  * 解析v-model、@click事件等
  * @param {*} node 
  */
  function compile(node) {}

  // 将组件的根节点放进来进行解析
  compile(el);
```

## 原理讲解

complie方法稍微有点复杂，我们单独拿出来写，我们要对`index.html`里的`<div id="app"></div>`里的元素进行解析，将data.message的数据绑定到input中，还要在p中显示data.message的数据。vue中使用的是`AST抽象语法数（abstract syntax tree）`,将html解析成可以方便编程的js数据结构，关于js数据结构，推荐阅读[《学习JavaScript数据结构与算法》](https://www.ituring.com.cn/book/1613)这本书。

源码1
```html
<div id="app">
  <input v-model="message" />
  <p>{{ message }}</p>
</div>
```

AST1
```
{
  tag: 'div',
  children: [
    {
      tag: 'p',
      children: ['{{ message }}']
    },
    {
      tag: 'input',
      props: {
        'v-model': 'message'
      }
    },
    {
      tag: 'button',
      props: {
        '@click': 'changeMessage'
      },
      children: ['Change']
    }
  ]
}
```

源码2
```html
<div>
  <p>{{ message }}</p>
  <input v-model="message" />
  <button @click="changeMessage">Change</button>
</div>
```

AST2
```js
{
  tag: 'div',
  children: [
    {
      tag: 'p',
      children: ['{{ message }}']
    },
    {
      tag: 'input',
      props: {
        'v-model': 'message'
      }
    },
    {
      tag: 'button',
      props: {
        '@click': 'changeMessage'
      },
      children: ['Change']
    }
  ]
}

```
编译过程和结果大致是这样的，更细致一点会把@click解析成下面这种更方便的结构

```js
{
  event: 'click',
  fn: 'sayHello',
}
```
社区有很多开源的解析器，但vue是自己开发的解析`@vue/compiler-dom`、`@vue/compiler-core`，感兴趣可以去npm和vue官方源码的packages中阅读。

vue会先使用@vue/compiler-dom解析成下面的结构

```
{
  type: 'Element',
  tag: 'button',
  props: [
    {
      type: 'Directive',
      name: 'on',
      arg: { type: 'Expression', content: 'click' },
      exp: { type: 'Expression', content: 'sayHello()' }
    }
  ],
  children: [...]
}
```

然后使用@vue/compiler-core将上面的VUE专用的AST解析成下的可执行的代码

```
function render(ctx) {
  return h('button', {
    onClick: () => ctx.say(ctx.name)
  }, '说你好');
}

```

原理说到这里，但今天不打算走AST这条路，就简单使用原生的js来实现，通过判断dom是否包含属性`v-model`,将`v-model`绑定的key`message`获取到。

因为`reactiveData.message`是响应式的，赋值set和获取值get都能触发对应的set、get事件。那可以将有v-model="状态值的字面量"的组件绑定到`reactiveData['状态值的字面量']`的get事件，将文本框的input事件绑定到`reactiveData['状态值的字面量']`的set事件。


```
// v-model 绑定输入框
if (node.hasAttribute('v-model')) {
  // 获取v-model的字面量
  const key = node.getAttribute('v-model');
  // 初始化文本框的值
  node.value = reactiveData[key];

  // 绑定input的input事件，文本框的值发生变化就要更新reactiveData的值
  node.addEventListener('input', e => {
    reactiveData[key] = e.target.value;
  });

  // 添加更新页面元素的渲染值的方法
  bindings[key].push(() => {
    node.value = reactiveData[key];
  });
}
```
## 处理绑定事件
接下来处理解析click点击事件，vue在处理点击事件时依然是使用的它的核心两大解析器，这里就先不用了，简单判断属性名称是以`@`字符开头的，不管事件名称是啥字符串，一股脑的给元素绑定事件。
还记得我们在组件结果里定义的methods了吗？我们讲他绑定到ctx上了，`@事件名称`中取到事件名称，然后将有了`addEventListener`的两大重要参数eventName和fn。直接绑定上去即可。这里不对事件名称做校验，合不合法不管。

这里的bind函数是经典的绑定this的方法，将vue实例ctx绑定给事件。这样在methods中的方法就可以使用`this.message = 1`、`this.sayHello()`了。
```
// @click 事件
[...node.attributes].forEach(attr => {
  if (attr.name.startsWith('@')) {
    const eventName = attr.name.slice(1);
    const methodName = attr.value;
    node.addEventListener(eventName, ctx[methodName].bind(ctx));
  }
});
```

## 处理模板语法

接下来还需要将响应更改的值渲染到模板语法`{{ message }}`中，还要将更新事件放到bindings中，我们称之为绑定，和reactiveData一样，使用key来绑定。

这里依然不使用vue的两大核心模板，就简单使用正则来匹配。然后将`{{ message }}`替换成绑定的值替，可以在[这里](https://code.juejin.cn/pen/7530268356943822898)进行练习。

那为了兼容`<div>{{ message }} {{ prefix }}</div>`这种情况，实际上肯定不能这么简单，需要匹配所有的字面量，所以需要修改成数组的形式，对每一个模板`{{ message }}`都进处理。

```
const raw = node.textContent;
const reg = /{{\s*(\w+)\s*}}/g;
const matches = [...raw.matchAll(reg)];

if (matches.length) {
  const update = () => {
    node.textContent = raw.replace(reg, (_, key) => proxy[key]);
  };
  update();
  matches.forEach(match => {
    const key = match[1];
    if (!bindings[key]) {
      bindings[key] = [];
    }
    bindings[key].push(update);
  });
}
```

整个逻辑逻辑理完了，接下来整合在一起。

## 整合逻辑

回到我们的createApp函数中，我们要在mount中将代码的主要逻辑搭建出来。

```js
export function createApp(options) {
  return {
    mount(selector) {
    }
  };
}

```

首先当然是要将前面几部讲过的步骤整合到mount中，再补充一下mounted和unmounted事件，判断下options上有没有mount和unmounted事件，有的话把mounted直接触发一下。有unmounted事件，就在window的beforeunload事件中触发一下，这里使用call和bind一样，是一个经典的函数调用方式，将当前实例传入，这里和bind不一样，并不是为了使用this.message，而是为了给mounted一个回调的参数。
实际上vue2的onMounted和beforeDestroy并没有回调参数，放到这里存储是出现了bind，顺手拿出来用一下。

而为了更准确的判断哪些元素需要处理，这里对类型进行了判断，`node.nodeType === Node.ELEMENT_NODE`判断是p、div、text、input等element元素，不是meta、script这些元素。符合这个条件的，才处理v-bind、@click事件。

node.nodeType === Node.TEXT_NODE则是判断元素是一个文本节点`<div>文本内容</div>`，这是浏览器两大对象之一[DOM](https://developer.mozilla.org/zh-CN/docs/Web/API/Node)里面的[Node](https://developer.mozilla.org/zh-CN/docs/Web/API/Node)的内容。符合文本节点的，才处理`{{ message }}`的替换工作。

知道他们是干嘛的，将对应的事件放到对应的位置。一个简单的vue2就实现了。

```
export function createApp(options) {
  return {
    mount(selector) {
      const el = document.querySelector(selector);
      if (!el) {
        return;
      }

      function compile(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log('处理v-model、input、@click、')

          // 递归处理子节点
          [...node.childNodes].forEach(child => compile(child));
        }

        // 处理{{ message }}
        if (node.nodeType === Node.TEXT_NODE) {
        }
      }

      compile(el);

      if (options.mounted) {
        options.mounted.call(ctx);
      }
      window.addEventListener('beforeunload', () => {
        if (options.unmounted) options.unmounted.call(ctx);
      });
    }
  };
}
```

这里复杂逻辑就在compile中，但我们先把容易的放写进去上去。

```js
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
      const ctx = Object.create(reactiveData);
      // 将 methods 添加到 ctx，并绑定 this 为 ctx
      for (const key in options.methods) {
        ctx[key] = options.methods[key].bind(ctx);
      }


      function compile(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log('处理v-model、input、@click、')

          // 递归处理子节点
          [...node.childNodes].forEach(child => compile(child));
        }

        // 处理{{ message }}
        if (node.nodeType === Node.TEXT_NODE) {
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

```

下面书略了部分代码，但compile函数函数没有省略，这里做的工作就是对html进行解析和绑定，将前面理过的逻辑放进来，
```js
export function createApp(options) {
  return {
    mount(selector) {
      const el = document.querySelector(selector);
      if (!el) return;

      // 省略data

      // 依赖追踪表，负责在数据变化时通知更新 DOM
      const bindings = {};

      // 响应式对象,它就是组件中你访问的 this.message
      const reactiveData = {};

      // 省略使用 Object.defineProperty 创建响应式

      // 构建上下文
      const ctx = Object.create(reactiveData);
      // 将 methods 添加到 ctx，并绑定 this 为 ctx
      for (const key in options.methods) {
        ctx[key] = options.methods[key].bind(ctx);
      }


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

    }
  };
}
```

## 留几个思考题

- 为什么data要定义成函数（import、export的特性）
- 如何更改成Proxy实现双向绑定
- watch、computed如何实现
- 如何绑定keyup、keydown等事件？