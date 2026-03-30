import axios from 'axios'
import { ElMessage } from 'element-plus'

const defaultBaseURL = process.env.VUE_APP_BASE_API
  || (process.env.NODE_ENV === 'development' ? 'http://localhost:9090/api' : '/api')

const request = axios.create({
  baseURL: defaultBaseURL,
  timeout: 5000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('admin-token')

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`
    }

    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const payload = response.data

    if (payload && typeof payload.code !== 'undefined') {
      if (payload.code === 200) {
        return payload.data
      }

      ElMessage.error(payload.message || '请求失败')
      return Promise.reject(new Error(payload.message || '请求失败'))
    }

    return payload
  },
  error => {
    const message = error.response?.data?.message || error.message || '网络异常，请稍后重试'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default request
