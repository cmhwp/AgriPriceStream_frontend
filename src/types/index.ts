// 枚举定义
export enum UserType {
  ADMIN = 'admin',
  USER = 'user',
}

export enum PredictionAlgorithm {
  LSTM = 'LSTM',
}

// 通用响应格式
export interface ResponseModel<T = any> {
  code: number
  data: T | null
  msg: string
}

// User 相关接口
export interface UserBase {
  username: string
}

export interface UserCreate extends UserBase {
  password: string
  user_type?: UserType
}

export interface UserUpdate {
  username?: string
  password?: string
  user_type?: UserType
}

export interface UserLogin {
  username: string
  password: string
}

export interface UserInfo extends UserBase {
  id: number
  user_type: UserType
  created_at: string
  updated_at?: string
}

export interface Token {
  access_token: string
  token_type: string
  user_type: UserType
}

// 价格概览相关接口
export interface PriceOverviewItem {
  product_name: string
  provenance_name?: string
  current_price: number
  price_change: number
  price_change_percentage: number
  last_updated: string
}

export interface PriceOverview {
  items: PriceOverviewItem[]
  total_count: number
  highest_price_item?: PriceOverviewItem
  lowest_price_item?: PriceOverviewItem
  highest_increase_item?: PriceOverviewItem
  highest_decrease_item?: PriceOverviewItem
}

// Vegetable 相关接口
export interface VegetableBase {
  product_name: string
  description?: string
}

export interface VegetableCreate extends VegetableBase {
  provenance_name?: string
  standard?: string
  kind?: string
  source_type?: string
}

export interface VegetableUpdate {
  description?: string
  product_name?: string
  provenance_name?: string
  standard?: string
  kind?: string
  source_type?: string
  top_price?: number
  minimum_price?: number
  average_price?: number
  weight?: number
  price_date?: string
}

export interface VegetableResponse {
  id: number
  product_name: string
  description?: string
  top_price?: number
  minimum_price?: number
  average_price?: number
  provenance_name?: string
  weight?: number
  standard?: string
  kind?: string
  source_type?: string
  price_date?: string
}

// Price record 相关接口
export interface PriceRecordBase {
  vegetable_id: number
  price: number
  timestamp?: string
  top_price?: number
  minimum_price?: number
  average_price?: number
  price_date?: string
  provenance_name?: string
}

export type PriceRecordCreate = PriceRecordBase

export interface PriceRecordCorrection {
  record_id: number
  corrected_price: number
}

export interface PriceRecordResponse {
  id: number
  vegetable: string
  price: number
  timestamp: string
  top_price?: number
  minimum_price?: number
  average_price?: number
  price_date?: string
  provenance_name?: string
}

// Alert 相关接口
export interface PriceAlert {
  vegetable: string
  change_rate: number
  previous_price: number
  current_price: number
}

// Prediction 相关接口
export interface TrainModelRequest {
  algorithm: PredictionAlgorithm
}

export interface PredictionResponse {
  date: string
  vegetable: string
  predicted_price: number
}

// Chart 相关接口
export interface ChartData {
  xAxis: string[]
  series: Record<string, any>[]
}

// Notification 相关接口
export interface NotificationSubscribe {
  vegetable: string
  threshold: number
}

// Trend analysis 相关接口
export interface TrendAnalysis {
  top_rising: Record<string, any>[]
  top_falling: Record<string, any>[]
}

// Password 相关接口
export interface PasswordChange {
  current_password: string
  new_password: string
  confirm_password: string
}
