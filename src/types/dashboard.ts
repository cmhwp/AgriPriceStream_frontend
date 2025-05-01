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

// 价格分析数据
export interface PriceAnalytics {
  average_price: number
  highest_price: number
  lowest_price: number
  price_trend: string // 'up', 'down', 'stable'
  price_change_percentage: number
}

// 产地统计
export interface ProvenanceCount {
  provenance: string
  count: number
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
