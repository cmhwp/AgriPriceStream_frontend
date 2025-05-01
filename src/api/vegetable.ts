import request from '@/utils/request'
import type {
  VegetableCreate,
  VegetableUpdate,
  VegetablesResponse,
  VegetableDetailResponse,
  VegetableKindsResponse,
  VegetableProvenancesResponse,
} from '@/types/vegetable'

/**
 * 获取蔬菜列表
 */
export const getVegetables = async (
  params: {
    page?: number
    page_size?: number
    name?: string
    kind?: string
    sort_by?: string
  } = {},
) => {
  try {
    return await request.get<VegetablesResponse>('/vegetables', { params })
  } catch (error) {
    console.error('获取蔬菜列表失败:', error)
    throw error
  }
}

/**
 * 获取蔬菜详情
 */
export const getVegetableById = async (id: number) => {
  try {
    return await request.get<VegetableDetailResponse>(`/vegetables/${id}`)
  } catch (error) {
    console.error(`获取蔬菜详情失败 (ID: ${id}):`, error)
    throw error
  }
}

/**
 * 获取蔬菜种类列表
 */
export const getVegetableKinds = async () => {
  try {
    return await request.get<VegetableKindsResponse>('/vegetables/kinds')
  } catch (error) {
    console.error('获取蔬菜种类列表失败:', error)
    throw error
  }
}

/**
 * 获取蔬菜产地列表
 */
export const getVegetableProvenances = async () => {
  try {
    return await request.get<VegetableProvenancesResponse>('/vegetables/provenances')
  } catch (error) {
    console.error('获取蔬菜产地列表失败:', error)
    throw error
  }
}

/**
 * 获取最近更新的蔬菜
 */
export const getRecentVegetables = async (
  params: {
    days?: number
    page?: number
    page_size?: number
  } = {},
) => {
  try {
    return await request.get<VegetablesResponse>('/vegetables/recent', { params })
  } catch (error) {
    console.error('获取最近更新的蔬菜失败:', error)
    throw error
  }
}

/**
 * 根据价格范围查询蔬菜
 */
export const getVegetablesByPriceRange = async (
  params: {
    min_price?: number
    max_price?: number
    page?: number
    page_size?: number
  } = {},
) => {
  try {
    return await request.get<VegetablesResponse>('/vegetables/price-range', { params })
  } catch (error) {
    console.error('根据价格范围查询蔬菜失败:', error)
    throw error
  }
}

/**
 * 创建新蔬菜（管理员功能）
 */
export const createVegetable = async (vegetable: VegetableCreate) => {
  try {
    return await request.post<VegetableDetailResponse>('/vegetables', vegetable)
  } catch (error) {
    console.error('创建蔬菜失败:', error)
    throw error
  }
}

/**
 * 更新蔬菜信息（管理员功能）
 */
export const updateVegetable = async (id: number, vegetable: VegetableUpdate) => {
  try {
    return await request.put<VegetableDetailResponse>(`/vegetables/${id}`, vegetable)
  } catch (error) {
    console.error(`更新蔬菜失败 (ID: ${id}):`, error)
    throw error
  }
}

/**
 * 删除蔬菜（管理员功能）
 */
export const deleteVegetable = async (id: number) => {
  try {
    return await request.delete(`/vegetables/${id}`)
  } catch (error) {
    console.error(`删除蔬菜失败 (ID: ${id}):`, error)
    throw error
  }
}
