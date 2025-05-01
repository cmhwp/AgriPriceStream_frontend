import request from '@/utils/request'
import type { UserAdminUpdateParams } from '@/types/user'
import type { CrawlerActivityResponse } from '@/types/dashboard'
/**
 * 管理员更新用户信息
 * @param userId 用户ID
 * @param updateData 更新的用户数据
 * @returns Promise 包含更新后的用户信息
 */
export const updateUser = async (userId: number, updateData: UserAdminUpdateParams) => {
  return request.post(`/admin/users/${userId}`, updateData)
}

/**
 * 管理员删除用户
 * @param userId 要删除的用户ID
 * @returns Promise 包含删除操作结果
 */
export const deleteUser = async (userId: number) => {
  return request.delete(`/admin/users/${userId}`)
}

/**
 * 立即执行一次爬虫任务
 * @returns Promise 包含爬虫任务执行结果
 */
export const runCrawlerOnce = async () => {
  return request.post('/admin/crawl/run-once')
}

/**
 * 爬取历史数据
 * @param startDate 开始日期 (YYYY-MM-DD格式)
 * @param endDate 结束日期 (YYYY-MM-DD格式，可选)
 * @returns Promise 包含爬虫任务执行结果
 */
export const crawlHistoricalData = async (startDate: string, endDate?: string) => {
  const params = endDate ? { start_date: startDate, end_date: endDate } : { start_date: startDate }
  return request.post('/admin/crawl/historical', params)
}

/**
 * 创建管理员账号（超级管理员专用）
 * @param userData 新管理员数据
 * @returns Promise 包含创建的管理员用户信息
 */
export const createAdminUser = async (
  userData: UserAdminUpdateParams & { username: string; password: string },
) => {
  return request.post('/admin/users/create-admin', userData)
}

/**
 * 获取最近的爬虫活动记录
 * @param limit 返回记录数量，默认10条
 * @returns Promise 包含爬虫活动记录的响应
 */
export const getRecentCrawlerActivities = async (limit: number = 10) => {
  return request.get('/admin/crawler/activities', { params: { limit } })
}

/**
 * 获取爬虫状态
 * @returns Promise 包含爬虫当前状态的响应
 */
export const getCrawlerStatus = async () => {
  return request.get('/admin/crawler/status')
}
