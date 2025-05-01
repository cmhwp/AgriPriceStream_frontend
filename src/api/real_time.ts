import request from '@/utils/request'
import type { ResponseModel, PriceRecordResponse, PriceAlert, PriceOverview } from '@/types'

/**
 * 获取最新价格数据
 * @param vegetable 可选的蔬菜名称过滤
 * @param limit 返回数据限制，默认50条
 * @returns 价格记录列表
 */
export const getLatestPrices = (
  vegetable?: string,
  limit: number = 50,
): Promise<ResponseModel<PriceRecordResponse[]>> => {
  const params: Record<string, string | number> = { limit }
  if (vegetable) {
    params.vegetable = vegetable
  }

  return request.get('/real-time/prices', { params })
}

/**
 * 获取价格预警
 * @returns 价格预警列表
 */
export const getPriceAlerts = (): Promise<ResponseModel<PriceAlert[]>> => {
  return request.get('/real-time/price-alert')
}

/**
 * 获取价格概览信息
 * @param limit 返回数据条数限制，默认10条
 * @returns 价格概览数据
 */
export const getPriceOverview = (limit: number = 10): Promise<ResponseModel<PriceOverview>> => {
  return request.get('/real-time/price-overview', { params: { limit } })
}

/**
 * 创建WebSocket连接以接收实时价格更新
 * @param onMessage 消息处理回调函数
 * @param onError 错误处理回调函数
 * @returns WebSocket实例和关闭连接的函数
 */
export const createPriceUpdateSocket = (
  onMessage: (data: { timestamp: string; data: PriceRecordResponse[] }) => void,
  onError?: (event: Event) => void,
): { socket: WebSocket; close: () => void } => {
  const token = localStorage.getItem('token')
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  // 将http/https转换为ws/wss
  const wsBaseUrl = baseURL.replace(/^http/, 'ws')

  // 创建WebSocket连接，并附带token进行认证
  const socket = new WebSocket(`${wsBaseUrl}/real-time/updates?token=${token}`)

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (e) {
      console.error('解析WebSocket消息失败:', e)
    }
  }

  if (onError) {
    socket.onerror = onError
  } else {
    socket.onerror = (event) => {
      console.error('WebSocket错误:', event)
    }
  }

  socket.onclose = () => {
    console.log('价格更新WebSocket连接已关闭')
  }

  // 返回socket实例和关闭连接的函数
  return {
    socket,
    close: () => {
      socket.close()
    },
  }
}

/**
 * 处理WebSocket重连逻辑
 * @param onMessage 消息处理回调函数
 * @param maxRetries 最大重试次数
 * @returns 带有重连逻辑的WebSocket连接控制器
 */
export const createReconnectingPriceSocket = (
  onMessage: (data: { timestamp: string; data: PriceRecordResponse[] }) => void,
  maxRetries: number = 5,
) => {
  let socket: WebSocket | null = null
  let close: (() => void) | null = null
  let retryCount = 0
  let retryTimeout: number | null = null

  const connect = () => {
    const connection = createPriceUpdateSocket(
      // 消息处理
      onMessage,
      // 错误处理
      () => {
        if (retryCount < maxRetries) {
          const timeout = Math.min(1000 * Math.pow(2, retryCount), 30000)
          console.log(`WebSocket连接错误，${timeout / 1000}秒后重试...`)

          retryTimeout = window.setTimeout(() => {
            retryCount++
            connect()
          }, timeout)
        }
      },
    )

    socket = connection.socket
    close = connection.close

    // 连接成功时重置重试计数
    socket.onopen = () => {
      retryCount = 0
      console.log('实时价格WebSocket连接已建立')
    }
  }

  // 初始连接
  connect()

  return {
    disconnect: () => {
      if (close) close()
      if (retryTimeout) clearTimeout(retryTimeout)
    },
  }
}
