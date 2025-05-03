export interface PriceRecordResponse {
  id: number
  vegetable_id: number
  price: number
  timestamp: string // ISO date string
  top_price?: number
  minimum_price?: number
  average_price?: number
  price_date?: string // ISO date string
  provenance_name?: string
  is_corrected: boolean
  price_change: number
  vegetable?: VegetableInfo
}

export interface PriceRecordCreate {
  vegetable_id: number
  price: number
  price_date: string // ISO date string
  top_price?: number
  minimum_price?: number
  average_price?: number
  provenance_name?: string
  is_corrected?: boolean
}

export interface PriceRecordUpdate {
  price?: number
  top_price?: number
  minimum_price?: number
  average_price?: number
  is_corrected?: boolean
}

export interface HistoricalPrice {
  date: string
  price: number
  top_price?: number
  minimum_price?: number
}

export interface ChartData {
  labels: string[]
  prices: number[]
  top_prices?: number[]
  minimum_prices?: number[]
}

export interface VegetablePriceHistory {
  vegetable_id: number
  vegetable_name: string
  provenance_name?: string
  history: HistoricalPrice[]
  chart_data: ChartData
}

export interface PriceTrend {
  trend: 'up' | 'down' | 'stable'
  percentage: number
}

export interface RealTimePriceResponse {
  vegetable_id: number
  vegetable_name: string
  current_price: number
  last_updated: string // ISO date string
  trend?: PriceTrend
  three_day_comparison?: Record<string, number>
}

export interface PriceOverviewItem {
  product_name: string
  provenance_name: string
  current_price: number
  price_change: number
  price_change_percentage: number
  last_updated: string
}

export interface PriceOverview {
  highest_price_item: PriceOverviewItem
  lowest_price_item: PriceOverviewItem
  items: PriceOverviewItem[]
  total_records: number
}

export interface PaginationResponse<T> {
  items: T[]
  page: number
  size: number
  total: number
  pages: number
}

export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

// This type alias is used for better readability and type safety
export type PriceRecordsPaginationResponse = ApiResponse<PaginationResponse<PriceRecordResponse>>

// Add vegetable information type
export interface VegetableInfo {
  id: number
  description: string
  product_name: string
  top_price: number
  minimum_price: number
  average_price: number
  provenance_name: string
  weight: number
  standard: string
  kind: string
  source_type: string
  price_date: string
}
