import type { PriceRecordResponse } from '@/types/price'

export interface VegetableBase {
  product_name: string
  description?: string
  provenance_name?: string
}

export interface VegetableCreate extends VegetableBase {
  product_name: string
  provenance_name: string
  top_price?: number
  minimum_price?: number
  average_price?: number
  standard?: string
  kind?: string
  weight?: number
}

export interface VegetableUpdate {
  product_name?: string
  description?: string
  provenance_name?: string
  top_price?: number
  minimum_price?: number
  average_price?: number
  standard?: string
  kind?: string
  weight?: number
}

export interface VegetableResponse extends VegetableBase {
  id: number
  top_price?: number
  minimum_price?: number
  average_price?: number
  standard?: string
  kind?: string
  weight?: number
  source_type?: string
  price_date?: string // ISO date string
}

export interface VegetableDetail extends VegetableResponse {
  price_records: PriceRecordResponse[]
}

// API response types
export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
  has_more: boolean
}

export interface VegetablesResponse {
  data: PaginatedData<VegetableResponse>
  code: number
  msg: string
}

export interface VegetableDetailResponse {
  data: VegetableDetail
  code: number
  msg: string
}

export interface VegetableKindsResponse {
  data: string[]
  code: number
  msg: string
}

export interface VegetableProvenancesResponse {
  data: string[]
  code: number
  msg: string
}
