export interface PriceRecordResponse {
  id: number
  vegetable_id: number
  price: number
  record_date: string // ISO date string
  source_type?: string
  source_url?: string
  standard?: string
  kind?: string
  created_at: string // ISO date string
  updated_at: string // ISO date string
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

export interface PriceRecordCreate {
  vegetable_id: number
  price: number
  record_date: string
  source_type?: string
  source_url?: string
  standard?: string
  kind?: string
}

export interface PriceRecordUpdate {
  price?: number
  record_date?: string
  source_type?: string
  source_url?: string
  standard?: string
  kind?: string
}
