# axios-example
axios源码分析 - xhr篇

[axios](https://github.com/axios/axios) 是一个基于 promise 的 HTTP 库，可以用在浏览器和 node.js 中

## 分析axios - 目录
备注：每一小节都会从两个方面介绍：如何使用 -> 源码分析

-   [axios项目目录结构](#axios项目目录结构)
-   [工具方法简单介绍](#工具方法简单介绍)
-   [axios为何会有多种使用方式](#axios为何会有多种使用方式)
-   [如何支持promise的](#如何支持promise的)
-   [header设置](#header设置)
-   [如何取消已经发送的请求](#如何取消已经发送的请求)
-   [自动转换json数据](#自动转换json数据)
-   [如何监听进度](#如何监听进度)
-   [超时配置及处理](#超时配置及处理)
-   [请求失败的错误处理](#请求失败的错误处理)
-   [改写验证成功或失败的规则validatestatus](#改写验证成功或失败的规则validatestatus)
-   [如何拦截请求响应并修改请求参数修改响应数据](#如何拦截请求响应并修改请求参数修改响应数据)
-   [转换请求与响应数据](#转换请求与响应数据)
-   [如何支持客户端xsrf攻击防护](#如何支持客户端xsrf攻击防护)

## axios的应用和源码解析

### axios项目目录结构

├── /dist/                     # 项目输出目录
├── /lib/                      # 项目源码目录
│ ├── /cancel/                 # 定义取消功能
│ ├── /core/                   # 一些核心功能
│ │ ├── Axios.js               # axios的核心主类
│ │ ├── dispatchRequest.js     # 用来调用适配器方法发送请求
│ │ ├── InterceptorManager.js  # 拦截器构造函数
│ │ └── settle.js              # 根据http响应状态，改变Promise的状态
│ ├── /helpers/                # 一些辅助方法
│ ├── /adapters/               # 定义请求的适配器 xhr、http
│ │ ├── http.js                # 实现http适配器
│ │ └── xhr.js                 # 实现xhr适配器
│ ├── axios.js                 # 对外暴露接口
│ ├── defaults.js              # 默认配置 
│ └── utils.js                 # 公用工具
├── package.json               # 项目信息
├── index.d.ts                 # 配置TypeScript的声明文件
└── index.js                   # 入口文件

注：因为我们需要要看的代码都是`/lib/`目录下的文件，所以以下所有涉及到文件路径的地方，
我们都会在`/lib/`下进行查找


### 工具方法简单介绍

有一些方法在项目中多处使用，
所以在正式开始看axios核心代码前，我们先来简单介绍下这些常用方法

特别说明：
axios因为要兼容IE8等老版本浏览器，所以我们会看到一些为了兼容老版本浏览器而写的方法，比如`bind`、`isArray`等

1. bind： 给某个函数指定上下文，也就是this指向

```javascript

bind(fn, context); 

```

实现效果同`Function.bind`方法: `fn.bind(context)`

2. forEach：遍历数组或对象

```javascript

var utils = require('./utils');
var forEach = utils.forEach;

// 数组
utils.forEach([], (value, index, array) => {})

// 对象
utils.forEach({}, (value, key, object) => {})

```

3. merge：深度合并多个对象为一个对象

```javascript

var utils = require('./utils');
var merge = utils.merge;

var obj1 = {
  a: 1,
  b: {
    bb: 11,
    bbb: 111,
  }
};
var obj2 = {
  a: 2,
  b: {
    bb: 22,
  }
};
var mergedObj = merge(obj1, obj2); 

```

mergedObj对象是：
`{ 
  a: 2, 
  b: { 
    bb: 22, 
    bbb: 111 
  } 
}`


4. extend：将一个对象的方法和属性扩展到另外一个对象上，并指定上下文

```javascript

var utils = require('./utils');
var extend = utils.extend;

var context = {
  a: 4,
};
var target = {
  k: 'k1',
  fn(){
    console.log(this.a + 1)
  }
};
var source = {
  k: 'k2',
  fn(){
    console.log(this.a - 1)
  }
};
let extendObj = extend(target, source, context);

```

extendObj对象是：
`{
  k: 'k2',
  fn: source.fn.bind(context),
}`
执行`extendObj.fn();`, 打印`3`


### axios为何会有多种使用方式

#### 如何使用

```javascript
// 首先将axios包引进来
import axios from 'axios'
```

第1种使用方式：`axios(option)`
```javascript
axios({
  url,
  method,
  headers,
})
```

第2种使用方式：`axios(url[, option])`
```javascript
axios(url, {
  method,
  headers,
})
```

第3种使用方式（对于`get、delete`等方法）：`axios[method](url[, option])`
```javascript
axios.get(url, {
  headers,
})
```

第4种使用方式（对于`post、put`等方法）：`axios[method](url[, data[, option]])`
```javascript
axios.get(url, {
  headers,
})
```

第5种使用方式：`axios.request(option)`
```javascript
axios.request({
  url,
  method,
  headers,
})
```

#### 源码分析

在开始讲axios为何有这么多种使用方式前，我们先来看下Axios构造函数
Axios是axios包的核心，一个Axios实例就是一个axios应用，其他方法都是对Axios内容的扩展
而Axios构造函数的核心方法是request方法，各种axios的调用方式最终都是通过request方法发xhr或http请求的，
下面讲到axios是[如何支持promise的](#如何支持promise的)、[如何拦截请求响应并修改请求参数修改响应数据](#如何拦截请求响应并修改请求参数修改响应数据)时，会着重看这块代码。

```javascript

function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

Axios.prototype.request = function request(config) {
  // ...省略代码
};

// 为支持的请求方法提供别名
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  Axios.prototype[method] = function(url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  Axios.prototype[method] = function(url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

```

能够实现多种axios使用方式的核心是`createInstance`方法：

```javascript

// /lib/axios.js  -  14行
function createInstance(defaultConfig) {
  // 创建一个Axios实例
  var context = new Axios(defaultConfig);

  // 不考虑老浏览器，以下代码也可以这样实现：var instance = Axios.prototype.request.bind(context);
  // 这样instance就指向了request方法，且上下文指向context，所以可以直接以 instance(option) 方式调用 
  var instance = bind(Axios.prototype.request, context);

  // 把Axios.prototype上的方法扩展到instance对象上，
  // 这样 instance 就有了 get、post、put等方法
  // 并指定上下文为context，这样执行Axios原型链上的方法时，this会指向context
  utils.extend(instance, Axios.prototype, context);

  // 把context对象上的自身属性和方法扩展到instance上
  // 注：因为extend内部使用的forEach方法对对象做for in 遍历时，只遍历对象本身的属性，而不会遍历原型链上的属性
  // 这样，instance 就有了  defaults、interceptors 属性。（这两个属性后面我们会介绍）
  utils.extend(instance, context);

  return instance;
}

// 创建一个Axios实例，最终会被作为对象导出
var axios = createInstance(defaults);

/**
 * 一般情况，项目使用默认导出的axios实例就可以满足需求了，
 * 如果不满足需求需要创建新的axios实例，axios包也预留了接口，
 * 看下面的代码：
 */
// /lib/axios.js  -  31行
axios.Axios = Axios;
axios.create = function create(instanceConfig) {
  return createInstance(utils.merge(defaults, instanceConfig));
};

module.exports = axios;

```


### 如何支持promise的
axios是通过Promise进行异步处理的？

#### 如何使用

#### 源码分析


### header设置

#### 如何使用

``` javascript

// 设置通用header
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'; // xhr标识
axios.defaults.headers.common['withCredentials'] = true; // 跨域携带cookie

// 设置某种请求的header
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8'; // 跨域携带cookie

// 设置某次请求的header
axios.get(url, {
  headers: {
    'Authorization': 'whr1',
  },
})

```

#### 源码分析

``` javascript

// /lib/core/dispatchRequest.js  -  44行

  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers || {}
  );

```


### 如何取消已经发送的请求

#### 如何使用

```javascript

// 第一种取消方法
axios.get(url, {
  cancelToken: new axios.CancelToken(cancel => {
    if (/* 取消条件 */) {
      cancel('取消日志');
    }
  })
});

// 第二种取消方法
const CancelToken = axios.CancelToken;
const source = CancelToken.source();
axios.get(url, {
  cancelToken: source.token
});
source.cancel('取消日志');

```

#### 源码分析

```javascript

// /cancel/CancelToken.js  -  11行
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

// /lib/adapters/xhr.js  -  159行
if (config.cancelToken) {
    config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
            return;
        }
        request.abort();
        reject(cancel);
        request = null;
    });
}

```

取消功能的核心是通过CancelToken内的`this.promise = new Promise(resolve => resolvePromise = resolve)`，
得到实例属性`promise`，此时该`promise`的状态为`pending`
通过这个属性，在`/lib/adapters/xhr.js`文件中继续给这个`promise`实例添加`.then`方法
（`xhr.js`文件的159行`config.cancelToken.promise.then(message => request.abort())`）；

在`CancelToken`外界，通过`executor`参数拿到对`cancel`方法的控制权，
这样当执行`cancel`方法时就可以改变实例的`promise`属性的状态为`fuiled`，
从而执行`request.abort()`方法达到取消请求的目的

##### 发现的问题

1. /lib/adapters/xhr.js文件中，onCanceled方法的参数不应该叫message么，为什么叫cancel？

2. /lib/adapters/xhr.js文件中，onCanceled方法里，reject里应该将config信息也传出来


### 自动转换json数据

在默认情况下，axios将会自动的将传入的data对象序列化为JSON字符串，将响应数据中的JSON字符串转换为JavaScript对象

#### 源码分析

```javascript

// 请求时，将data数据转换为JSON 字符串
// /lib/defaults.js 
transformRequest: [function transformRequest(data, headers) {
  // ...
    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }
    return data;
}]

// 得到响应后，将请求到的数据转换为JSON对象
// /lib/defaults.js
transformResponse: [function transformResponse(data) {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
}]

```


### 如何监听进度

#### 如何使用

#### 源码分析


### 超时配置及处理

#### 如何使用

```javascript

axios.defaults.timeout = 3000;

```

#### 源码分析

```javascript

// /adapters/xhr.js  -  48行
request.timeout = config.timeout;

// /adapters/xhr.js  -  94行
request.ontimeout = function handleTimeout() {
  reject(createError('timeout of ' + config.timeout + 'ms exceeded', 
    config, 'ECONNABORTED', request));
};

```

-   axios库外如何添加超时后的处理

```javascript

axios().catch(error => {
  const { message } = error;
  if (message.indexOf('timeout') > -1){
    // 超时处理
  }
})

```




### 请求失败的错误处理


### 改写验证成功或失败的规则validatestatus
自定义http状态码的成功、失败范围

#### 如何使用

```javascript

axios.defaults.validateStatus = status => status >= 200 && status < 300;

```

#### 源码分析

在默认配置中，定义了默认的http状态码验证规则，
所以自定义validateStatus其实是对此处方法的重写
`/lib/defaults.js`  -  77行

```javascript

var defaults = {
  // ...
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },
  // ...
}

```

`axios`是何时开始验证`http`状态码的？

```javascript

// /lib/adapters/xhr.js  -  20行
var request = new XMLHttpRequest();
var loadEvent = 'onreadystatechange';

// /lib/adapters/xhr.js  -  77行
// 每当 readyState 改变时，就会触发 onreadystatechange 事件
request[loadEvent] = function handleLoad() {
  if (!request || (request.readyState !== 4 && !xDomain)) {
    return;
  }
  // ...省略代码
  var response = {
      // ...
      // IE sends 1223 instead of 204 (https://github.com/axios/axios/issues/201)
      status: request.status === 1223 ? 204 : request.status,
      config: config,
  };
  settle(resolve, reject, response);
  // ...省略代码
}

```

/lib/core/settle.js  -  12行

```javascript

function settle(resolve, reject, response) {
  // 如果我们往上捣一捣就会发现，config对象的validateStatus就是我们自定义的validateStatus方法或默认的validateStatus方法
  var validateStatus = response.config.validateStatus;
  // validateStatus验证通过，就会触发resolve方法
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};

```


### 如何拦截请求响应并修改请求参数修改响应数据

#### 如何使用

#### 源码分析


### 转换请求与响应数据

#### 如何使用

#### 源码分析

-   备注：但拦截器同样可以实现该功能，且拦截器可取消某个拦截，可异步处理，可对错误进行处理等，管理起来更方便


### 如何支持客户端xsrf攻击防护

#### 如何使用

#### 源码分析
