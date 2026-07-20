import axios, { type AxiosInstance } from 'axios'

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api',
  timeout: 10_000
})

request.interceptors.request.use((config) => {
  // 预留：注入 token / 通用 header
  return config
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 预留：统一错误处理
    return Promise.reject(error)
  }
)

export default request