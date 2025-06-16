export interface IconOption {
  value: string
  label: string
}

/**
 * 图标选项配置
 * 统一管理所有可用的Element Plus图标选项
 */
export const ICON_OPTIONS: IconOption[] = [
  { value: 'Folder', label: '文件夹' },
  { value: 'Document', label: '文档' },
  { value: 'Setting', label: '设置' },
  { value: 'Menu', label: '菜单' },
  { value: 'Star', label: '星星' },
  { value: 'Trophy', label: '奖杯' },
  { value: 'Present', label: '礼物' },
  { value: 'Compass', label: '指南针' },
  { value: 'Promotion', label: '火箭' },
  { value: 'Bell', label: '铃铛' },
  { value: 'Camera', label: '相机' },
  { value: 'Mic', label: '音乐' },
  { value: 'VideoPlay', label: '视频' },
  { value: 'ShoppingCart', label: '购物车' },
  { value: 'Coffee', label: '咖啡' },
  { value: 'Reading', label: '书籍' },
  { value: 'Cpu', label: 'CPU' },
  { value: 'Monitor', label: '显示器' },
  { value: 'House', label: '房屋' },
  { value: 'User', label: '用户' },
  { value: 'Calendar', label: '日历' },
  { value: 'Clock', label: '时钟' },
  { value: 'Message', label: '消息' },
  { value: 'Phone', label: '电话' },
  { value: 'Position', label: '位置' },
  { value: 'Search', label: '搜索' },
  { value: 'Share', label: '分享' },
  { value: 'Tools', label: '工具' },
  { value: 'Warning', label: '警告' },
  { value: 'InfoFilled', label: '信息' },
  { value: 'SuccessFilled', label: '成功' },
  { value: 'CircleClose', label: '关闭' },
  { value: 'DataLine', label: '代码' },
  { value: 'EditPen', label: '画笔' },
  { value: 'Finished', label: '魔法' },
  { value: 'Wallet', label: '数据库' },
  { value: 'Grid', label: '服务器' },
  { value: 'Sunny', label: '云服务' },
  { value: 'PictureFilled', label: '图片' },
  { value: 'VideoPause', label: '暂停' }
]

/**
 * 图标描述映射
 * 从图标名称到中文描述的映射关系
 */
export const ICON_DESCRIPTIONS: Record<string, string> = ICON_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label
    return acc
  },
  {} as Record<string, string>
)

/**
 * 获取图标的中文描述
 * @param iconName Element Plus图标名称
 * @returns 中文描述
 */
export function getIconDescription(iconName: string): string {
  return ICON_DESCRIPTIONS[iconName] || iconName
}

/**
 * 获取所有图标选项
 * @returns 图标选项数组
 */
export function getIconOptions(): IconOption[] {
  return ICON_OPTIONS
}

/**
 * 检查图标是否存在
 * @param iconName 图标名称
 * @returns 是否存在
 */
export function isValidIcon(iconName: string): boolean {
  return iconName in ICON_DESCRIPTIONS
} 