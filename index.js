import axios from "axios";

console.log('defaults:', axios.defaults);

// 设置通用头部
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// 跨域携带cookie
axios.defaults.headers.common['withCredentials'] = true;

// 拦截请求
axios.interceptors.request.use(config => {
  config.headers['Authorization'] = 'whr2'
  return config
}, error => {
  console.log(error);
})

// 拦截响应
axios.interceptors.response.use(data => {
  return data
}, error => {
  console.log(error);
})

console.log('interceptors:', axios.interceptors);

axios.get('http://jsonplaceholder.typicode.com/users', {
  params: {
    b: 2
  },
  headers: {
    'Authorization': 'whr',
  }
})
.then(data => {
  // console.log(data);
})
.catch(err => {
  // console.log(err);
})
