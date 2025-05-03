import request from '@/utils/request'
import type {
  PriceRecordCreate,
  PriceRecordUpdate,
  PriceRecordsPaginationResponse,
} from '@/types/price'

/**
 * 获取价格记录列表
 * @param vegetable_id 蔬菜ID
 * @param page 页码
 * @param page_size 每页记录数
 */
export const getPriceRecords = async (
  vegetable_id?: number,
  page: number = 1,
  page_size: number = 10,
) => {
  try {
    const params: Record<string, number> = { page, page_size }
    if (vegetable_id) {
      params.vegetable_id = vegetable_id
    }
    return await request.get<PriceRecordsPaginationResponse>('/prices/records', { params })
  } catch (error) {
    console.error('获取价格记录列表失败:', error)
    throw error
  }
}

/**
 * 获取特定价格记录
 * @param recordId 价格记录ID
 * @returns Promise 包含价格记录的响应
 */
export const getPriceRecord = async (recordId: number) => {
  return request.get(`/prices/records/${recordId}`)
}

/**
 * 创建价格记录（仅管理员）
 * @param priceRecord 价格记录数据
 * @returns Promise 包含创建的价格记录响应
 */
export const createPriceRecord = async (priceRecord: PriceRecordCreate) => {
  return request.post('/prices/records', priceRecord)
}

/**
 * 更新价格记录（仅管理员）
 * @param recordId 价格记录ID
 * @param priceUpdate 更新的价格数据
 * @returns Promise 包含更新后的价格记录响应
 */
export const updatePriceRecord = async (recordId: number, priceUpdate: PriceRecordUpdate) => {
  return request.put(`/prices/records/${recordId}`, priceUpdate)
}

/**
 * 删除价格记录（仅管理员）
 * @param recordId 价格记录ID
 * @returns Promise 包含删除操作结果
 */
export const deletePriceRecord = async (recordId: number) => {
  return request.delete(`/prices/records/${recordId}`)
}

/**
 * 获取蔬菜历史价格
 * @param vegetableId 蔬菜ID
 * @param days 天数 (1-365)
 * @returns Promise 包含蔬菜历史价格数据的响应
 */
export const getPriceHistory = async (vegetableId: number, days: number = 30) => {
  return request.get('/prices/history', {
    params: {
      vegetable_id: vegetableId,
      days,
    },
  })
}

/**
 * 获取蔬菜价格图表数据
 * @param vegetableId 蔬菜ID
 * @param days 天数 (1-90)
 * @returns Promise 包含图表数据的响应
 */
export const getChartData = async (vegetableId: number, days: number = 7) => {
  return request.get('/prices/chart-data', {
    params: {
      vegetable_id: vegetableId,
      days,
    },
  })
}

/**
 * 获取蔬菜实时价格
 * @param vegetableId 蔬菜ID
 * @returns Promise 包含实时价格数据的响应
 */
export const getRealTimePrice = async (vegetableId: number) => {
  return request.get('/prices/real-time', {
    params: {
      vegetable_id: vegetableId,
    },
  })
}

/**
 * 分析蔬菜价格季节性变化
 * @param vegetableId 蔬菜ID
 * @returns Promise 包含价格季节性数据的响应
 */
export const analyzePriceSeasonality = async (vegetableId: number) => {
  return request.get('/prices/seasonality', {
    params: {
      vegetable_id: vegetableId,
    },
  })
}
