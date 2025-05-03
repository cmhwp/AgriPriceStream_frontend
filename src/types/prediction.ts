import type { ApiResponse } from './price'

export interface PredictionBase {
  vegetable_id: number
}

export interface PredictionCreate extends PredictionBase {
  predicted_date: string
  predicted_price: number
  algorithm: string
}

export interface PredictionResponse extends PredictionBase {
  id: number
  predicted_date: string
  predicted_price: number
  algorithm: string
  created_at: string
}

export interface PredictionDay {
  date: string
  price: number
}

export interface PredictionRequest {
  vegetable_id: number
  days?: number
  algorithm?: string
}

export interface PredictionResult {
  vegetable_id: number
  vegetable_name: string
  current_price: number
  predictions: PredictionDay[]
  algorithm?: string
  success?: boolean
  error?: string
}

export interface ModelTrainingBase {
  algorithm: string
  status: string
}

export interface ModelTrainingCreate extends ModelTrainingBase {
  start_time?: string
  log?: string
  vegetable_id?: number
  product_name?: string
  history_days?: number
  prediction_days?: number
  smoothing?: boolean
  seasonality?: boolean
  sequence_length?: number
}

export interface ModelTrainingResponse extends ModelTrainingBase {
  id: number
  start_time: string
  end_time?: string
  log?: string
  vegetable_id?: number
  product_name?: string
  history_days?: number
  prediction_days?: number
  smoothing?: boolean
  seasonality?: boolean
  sequence_length?: number
}

export interface BestPurchaseDay {
  vegetable_id: number
  vegetable_name: string
  best_purchase_date: string
  predicted_price: number
  current_price?: number
  savings?: number
  savings_percent?: number
  success?: boolean
  error?: string
}

// 模型训练配置
export interface TrainingConfig {
  algorithm: string
  history_days?: number
  prediction_days?: number
  smoothing?: boolean
  seasonality?: boolean
  auto_optimize?: boolean
  sequence_length?: number
  custom_params?: Record<string, any>
}

// 模型评估
export interface ModelEvaluation {
  id: number
  model_id: number
  algorithm: string
  mean_absolute_error: number
  mean_squared_error: number
  r_squared: number
  prediction_accuracy: number
  evaluation_date: string
  vegetable_id?: number
  product_name?: string
  training_status?: string
  training_date?: string
}

// 模型评估过滤条件
export interface ModelEvaluationFilter {
  algorithm?: string
  vegetable_id?: number
  product_name?: string
  min_accuracy?: number
  max_error?: number
  page?: number
  limit?: number
}

// 分页响应
export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// API响应类型
export type PredictionResultResponse = ApiResponse<PredictionResult>
export type ModelTrainingHistoryResponse = ApiResponse<ModelTrainingResponse[]>
export type BestPurchaseDayResponse = ApiResponse<BestPurchaseDay>
export type ModelEvaluationListResponse = ApiResponse<PaginatedData<ModelEvaluation>>
export type ModelEvaluationDetailResponse = ApiResponse<ModelEvaluation>
