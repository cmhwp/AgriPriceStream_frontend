import request from '@/utils/request'
import type {
  PredictionResultResponse,
  ModelTrainingHistoryResponse,
  BestPurchaseDayResponse,
  TrainingConfig,
  ModelEvaluationListResponse,
  ModelEvaluationDetailResponse,
  ModelEvaluationFilter
} from '@/types/prediction'

/**
 * 训练蔬菜价格预测模型
 * @param vegetableId 蔬菜ID
 * @param config 训练配置
 * @returns 训练任务ID和状态
 */
export function trainPredictionModel(vegetableId: number, config?: TrainingConfig) {
  return request.post<any>('/predictions/train-model', config, {
    params: { vegetable_id: vegetableId },
  })
}

/**
 * 训练所有蔬菜的LSTM模型
 * @param config 训练配置
 * @returns 训练任务结果
 */
export function trainAllVegetableModels(config?: TrainingConfig) {
  return request.post<any>('/predictions/train-all-models', config)
}

/**
 * 预测蔬菜价格
 * @param vegetableId 蔬菜ID
 * @param days 预测天数
 * @param algorithm 使用的算法名称
 * @returns 预测结果
 */
export function predictVegetablePrice(vegetableId: number, days: number = 7, algorithm?: string) {
  return request.post<PredictionResultResponse>('/predictions/predict', {
    vegetable_id: vegetableId,
    days,
    algorithm,
  })
}

/**
 * 获取指定蔬菜的价格预测
 * @param vegetableId 蔬菜ID
 * @param days 预测天数
 * @param algorithm 算法名称
 * @returns 预测结果
 */
export function getVegetablePrediction(vegetableId: number, days: number = 7, algorithm?: string) {
  return request.get<PredictionResultResponse>(`/predictions/vegetable/${vegetableId}`, {
    params: { days, algorithm },
  })
}

/**
 * 获取最佳购买日建议
 * @param vegetableId 蔬菜ID
 * @returns 最佳购买日建议
 */
export function getBestPurchaseDay(vegetableId: number) {
  return request.get<BestPurchaseDayResponse>(`/predictions/best-purchase-day/${vegetableId}`)
}

/**
 * 获取训练历史记录
 * @param params 查询参数
 * @returns 训练历史记录
 */
export function getTrainingHistory(params?: {
  status?: string
  algorithm?: string
  vegetable_id?: number
  limit?: number
}) {
  return request.get<ModelTrainingHistoryResponse>('/predictions/training/history', {
    params,
  })
}

/**
 * 获取训练详情
 * @param trainingId 训练ID
 * @returns 训练详情
 */
export function getTrainingDetails(trainingId: number) {
  return request.get<any>(`/predictions/training/${trainingId}`)
}

/**
 * 获取模型评估列表（分页）
 * @param params 过滤和分页参数
 * @returns 模型评估分页列表
 */
export function getModelEvaluations(params?: ModelEvaluationFilter) {
  return request.get<ModelEvaluationListResponse>('/predictions/evaluations', {
    params,
  })
}

/**
 * 获取模型评估详情
 * @param evaluationId 评估ID
 * @returns 模型评估详情
 */
export function getModelEvaluationDetail(evaluationId: number) {
  return request.get<ModelEvaluationDetailResponse>(`/predictions/evaluations/${evaluationId}`)
}
