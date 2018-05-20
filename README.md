# axios-example
axios的例子及分析

[axios](https://github.com/axios/axios) 是一个基于 promise 的 HTTP 库，可以用在浏览器和 node.js 中

## axios库的特性

-   从浏览器创建XMLHttpRequest
-   从node.js创建http请求
-   支持Promise API
-   拦截请求与响应
-   转换请求与响应数据
-   取消请求
-   自动转换JSON数据
-   支持客户端XSRF攻击防护

## axios的应用和源码解析

### 实现各种简便调用

#### 如何简便使用

既能axios(url, option)
又能axios(url, option)
还能axios.get(url, option)

#### 看源码如何实现


### header

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

#### 看源码如何实现

``` javascript

// /lib/core/dispatchRequest.js  -  44行

  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers || {}
  );

```


### 如何支持Promise

-   xhr篇

-   http篇


### 如何取消请求

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

#### 看源码如何实现

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


### 自动转换JSON数据

在默认情况下，axios将会自动的将传入的data对象序列化为JSON字符串，将响应数据中的JSON字符串转换为JavaScript对象

#### 看源码如何实现

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

#### 看源码如何实现


### 超时配置及处理

#### 如何使用

```javascript

axios.defaults.timeout = 3000;

```

#### 看源码如何实现

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


### 改写验证成功或失败的规则 validateStatus

#### 如何使用

#### 看源码如何实现


### 如何 拦截请求、响应，并修改请求参数、修改响应数据

#### 如何使用

#### 看源码如何实现


### 转换请求与响应数据

#### 如何使用

#### 看源码如何实现

-   备注：但拦截器同样可以实现该功能，且拦截器可取消某个拦截，可异步处理，可对错误进行处理等，管理起来更方便


### 如何支持客户端XSRF攻击防护

#### 如何使用

#### 看源码如何实现
