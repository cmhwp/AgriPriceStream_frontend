import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosRequestConfig } from 'axios'
import { useUserStore } from '@/stores/user'
import router from '@/router'
import { message } from 'ant-design-vue'

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// 创建axios实例
const instance: AxiosInstance = axios.create({
  baseURL,
  timeout: 3000000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从Pinia store获取token
    const userStore = useUserStore()
    const token = userStore.token

    // 如果token存在，添加到请求头
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 如果是文件下载响应，直接返回
    if (response.headers['content-type']?.includes('application/octet-stream') ||
        response.headers['content-type']?.includes('application/pdf') ||
        response.headers['content-type']?.includes('image/')) {
      return response
    }

    // 处理业务逻辑成功
    if (res.code === 0 || res.success) {
      return res
    }
    return res
  },
  (error) => {
    const userStore = useUserStore()

    // 处理请求错误
    if (error.response) {
      const { status } = error.response

      // 处理401未授权错误（token无效或过期）
      if (status === 401) {
        // 只有在不是登出请求且不是登录请求时才处理401
        if (!error.config.url?.includes('/auth/logout') && !error.config.url?.includes('/auth/login')) {
          message.error('登录已过期，请重新登录')
          userStore.logout(true) // 添加参数以跳过API调用
          router.push('/auth/login')
        }
      }
      // 处理403禁止访问错误
      else if (status === 403) {
        message.error('无权访问')
        router.push('/403')
      }
      // 处理404不存在错误
      else if (status === 404) {
        message.error('请求的资源不存在')
      }
      // 处理500服务器错误
      else if (status === 500) {
        message.error('服务器错误，请稍后再试')
      }
      // 其他错误
      else {
        message.error(error.response.data?.message || '请求失败')
      }
    } else if (error.request) {
      // 请求已发送但未收到响应
      message.error('网络错误，无法连接到服务器')
    } else {
      // 请求配置错误
      message.error('请求配置错误')
    }

    return Promise.reject(error)
  }
)

// 封装请求方法
export const request = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config)
  },
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config)
  },
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config)
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config)
  },
  // 暴露axios实例，方便扩展
  defaults: instance.defaults
}

export default request