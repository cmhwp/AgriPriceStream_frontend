// 蔬菜类型统计
export interface VegetableCountByType {
  kind: string
  count: number
}

// 每周蔬菜数据
export interface WeeklyVegetable {
  product_name: string
  count: number
  average_price: number
}

// 价格波动产品
export interface PriceVolatility {
  product: string
  spread: number
}

// 溢价产地
export interface PremiumOrigin {
  origin: string
  avg_price: number
  data_points: number
}

// 价格异常
export interface PriceAnomaly {
  product: string
  expected_price: number
  actual_price: number
  deviation_percent: number
}

// 价格分析数据
export interface PriceAnalytics {
  date: string
  total_products: number
  average_price: number
  highest_price: number
  lowest_price: number
  avg_daily_spread: number

  // 趋势分析
  daily_trend: string // 'up', 'down', 'stable'
  weekly_trend: string // 'up', 'down', 'stable'
  daily_change: number
  weekly_change: number

  // 明细分析
  price_volatility: PriceVolatility[]
  premium_origins: PremiumOrigin[]
  price_anomalies: PriceAnomaly[]
}

// 最低价格蔬菜信息
export interface LowestPricedVegetable {
  vegetable_id: number | null
  product_name: string | null
  price: number | null
  price_date: string | null
  provenance: string | null
  kind: string | null
}

// 产地统计
export interface ProvenanceCount {
  text: string       // 产地名称，用于词云展示文本 (原 provenance)
  value: number      // 产品数量，用于词云大小计算
  weight: number     // 相对权重（1-100范围）
  count: number      // 保留原有count字段以兼容旧代码
}

// 近期活动
export interface RecentActivity {
  timestamp: string // ISO 格式的日期时间字符串
  activity_type: string
  description: string
}

// 爬虫活动响应类型
export interface CrawlerActivityResponse {
  id: number
  title: string
  description: string
  time: string
  status: string
  records_count: number
  duration?: number
}

// 爬虫状态响应类型
export interface CrawlerStatusResponse {
  status: 'running' | 'idle'
  last_run_time: string | null
  daily_data_count: number
  latest_activity: CrawlerActivityResponse | null
}

// 用户仪表盘数据
export interface UserDashboard {
  username: string
  notifications_count: number
  subscribed_vegetables: Array<Record<string, any>>
  vegetable_count_by_type: VegetableCountByType[]
  weekly_vegetables: WeeklyVegetable[]
  recent_price_updates: Array<Record<string, any>>
  provenances: ProvenanceCount[]
  price_analytics?: PriceAnalytics
  lowest_priced_vegetable?: LowestPricedVegetable
}

// 管理员仪表盘数据
export interface AdminDashboard extends UserDashboard {
  total_users: number
  total_vegetables: number
  total_price_records: number
  recent_crawler_activities: RecentActivity[]
  model_training_status: Array<Record<string, any>>
  data_update_frequency: Record<string, any>
}

// API 响应类型
export interface DashboardResponse {
  code: number
  message: string
  data?: UserDashboard | AdminDashboard
}
