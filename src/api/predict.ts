import request from '@/utils/request'
import type { ResponseModel } from '@/types'

/**
 * 启动LSTM模型训练（仅管理员）
 * @returns 训练任务信息
 */
export const trainModel = (): Promise<
  ResponseModel<{
    training_id: number
    algorithm: string
    status: string
  }>
> => {
  return request.post('/predict/train-model')
}

/**
 * 获取价格预测结果
 * @param vegetable 可选的蔬菜名称过滤
 * @returns 价格预测列表
 */
export const getPredictionResults = (
  vegetable?: string,
): Promise<
  ResponseModel<
    Array<{
      date: string
      vegetable: string
      predicted_price: number
    }>
  >
> => {
  const params: Record<string, string> = {}
  if (vegetable) {
    params.vegetable = vegetable
  }

  return request.get('/predict/results', { params })
}
