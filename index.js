import axios from "axios";
import _ from "lodash";

const write = function (name, value, expires) {
  let cookie = [];
  cookie.push(name + '=' + encodeURIComponent(value));

  if (expires) {
    cookie.push('expires=' + new Date(expires).toGMTString());
  }

  document.cookie = cookie.join('; ');
};

write('whr', '333')

console.log('默认配置:', axios.defaults);

// 超时设置
axios.defaults.timeout = 10000;

// 设置通用头部
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// 跨域携带cookie
axios.defaults.withCredentials = true;

// 拦截请求
axios.interceptors.request.use(config => {
  console.log(1)
  config.headers['Authorization'] = 'whr2'
  return config
}, error => {
  // 提问：什么时候会提交请求失败？
  console.log(error);
})

axios.interceptors.request.use(config => new Promise(res => {
  setTimeout(() => {
    console.log(2);
    config.headers['Authorization'] = 'whr3'
    res(config);
  }, 1000);
}), error => error)


// 拦截响应
axios.interceptors.response.use(response => {
  console.log(4, 's');
  response.code = 1;
  return response
}, error => {
  console.log(4, 'e');
  const { response, config = {} } = error;
  const { url } = config;
  let status, message;
  if (response && _.isPlainObject(response)) {
    const { data, statusText } = response;
    status = response.status;
    message = data.message || statusText;
  } else {
      status = 600
      message = error.message || 'Network Error'
  }
  return Promise.reject({
    code: 0,
    url,
    message,
    status,
  })
})

// axios.interceptors.response.use(response => {
//   console.log(3, 's');
  
//   response.code = 1;
//   return response
// }, error => {
//   console.log(3, 'e');

// })

console.log('拦截器:', axios.interceptors);

let d = +new Date();

axios.get('http://jsonplaceholder.typicode.com/users', {
// axios.get('http://localhost:3000', {
  params: {
    b: 2
  },

  headers: {
    'Authorization': 'whr1',
  },
  cancelToken: new axios.CancelToken(cancel => {
    let s = setInterval(() => {
      if (+new Date() - d > 20000) {
        clearInterval(s);
        console.log('cancel');
        cancel('就是想取消了');
      }
    }, 100);
  }),
  // transformResponse: [
  //   ...axios.defaults.transformResponse,
  //   (data) => {
  //     // debugger
  //     return data.toString();
  //   }
  // ]
  
})
.then(data => {
  console.log('请求成功的数据:', data);
})
.catch(err => {
  console.log('请求失败:', err);
})

