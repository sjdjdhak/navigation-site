// 图标映射工具
// 将FontAwesome图标映射到Element Plus图标

export const iconMapping: Record<string, string> = {
  // 设计相关
  'fas fa-palette': 'EditPen',
  'fas fa-paintbrush': 'EditPen',
  'fas fa-magic': 'Finished',
  'fas fa-wand-magic-sparkles': 'Finished',
  
  // 开发相关
  'fas fa-code': 'DataLine',
  'fas fa-laptop-code': 'Monitor',
  'fas fa-database': 'Wallet',
  'fas fa-server': 'Grid',
  'fas fa-cloud': 'Sunny',
  
  // 效率工具
  'fas fa-tasks': 'Document',
  'fas fa-clipboard-list': 'Document',
  'fas fa-calendar': 'Calendar',
  'fas fa-clock': 'Clock',
  'fas fa-users': 'User',
  'fas fa-user-friends': 'User',
  
  // 学习教育
  'fas fa-book': 'Reading',
  'fas fa-graduation-cap': 'Trophy',
  'fas fa-university': 'House',
  'fas fa-chalkboard-teacher': 'User',
  
  // 创意工具
  'fas fa-video': 'VideoPlay',
  'fas fa-music': 'Mic',
  'fas fa-camera': 'Camera',
  'fas fa-image': 'PictureFilled',
  'fas fa-file-video': 'VideoPlay',
  'fas fa-file-audio': 'Mic',
  
  // 通用图标
  'fas fa-folder': 'Folder',
  'fas fa-file': 'Document',
  'fas fa-star': 'Star',
  'fas fa-heart': 'Star',
  'fas fa-thumbs-up': 'Star',
  'fas fa-fire': 'Promotion',
  'fas fa-rocket': 'Promotion',
  'fas fa-gem': 'Present',
  'fas fa-crown': 'Trophy',
  'fas fa-award': 'Trophy',
  'fas fa-medal': 'Trophy',
  
  // 工具类
  'fas fa-tools': 'Tools',
  'fas fa-wrench': 'Tools',
  'fas fa-cog': 'Setting',
  'fas fa-cogs': 'Setting',
  'fas fa-sliders-h': 'Setting',
  
  // 搜索和导航
  'fas fa-search': 'Search',
  'fas fa-compass': 'Compass',
  'fas fa-map': 'Position',
  'fas fa-route': 'Position',
  
  // 通讯
  'fas fa-envelope': 'Message',
  'fas fa-comment': 'Message',
  'fas fa-phone': 'Phone',
  'fas fa-mobile': 'Phone',
  
  // 购物
  'fas fa-shopping-cart': 'ShoppingCart',
  'fas fa-store': 'House',
  'fas fa-tag': 'Star',
  'fas fa-tags': 'Star',
  
  // 状态
  'fas fa-check': 'SuccessFilled',
  'fas fa-times': 'CircleClose',
  'fas fa-exclamation': 'Warning',
  'fas fa-info': 'InfoFilled',
  'fas fa-question': 'InfoFilled',
  
  // 媒体
  'fas fa-play': 'VideoPlay',
  'fas fa-pause': 'VideoPause',
  'fas fa-stop': 'CircleClose',
  'fas fa-volume-up': 'Mic',
  'fas fa-microphone': 'Mic'
}

/**
 * 将FontAwesome图标映射为Element Plus图标
 * @param faIcon FontAwesome图标类名
 * @returns Element Plus图标名称
 */
export function mapFaIconToElement(faIcon?: string): string {
  if (!faIcon) return 'Folder'
  
  // 如果已经是Element Plus图标，直接返回
  if (!faIcon.includes('fa-')) {
    return faIcon
  }
  
  // 查找映射
  const mapped = iconMapping[faIcon]
  if (mapped) {
    return mapped
  }
  
  // 尝试基于关键词的智能映射
  const lowerIcon = faIcon.toLowerCase()
  
  if (lowerIcon.includes('palette') || lowerIcon.includes('brush')) return 'EditPen'
  if (lowerIcon.includes('code') || lowerIcon.includes('terminal')) return 'DataLine'
  if (lowerIcon.includes('database') || lowerIcon.includes('data')) return 'Wallet'
  if (lowerIcon.includes('server') || lowerIcon.includes('cloud')) return 'Sunny'
  if (lowerIcon.includes('task') || lowerIcon.includes('list')) return 'Document'
  if (lowerIcon.includes('calendar') || lowerIcon.includes('date')) return 'Calendar'
  if (lowerIcon.includes('clock') || lowerIcon.includes('time')) return 'Clock'
  if (lowerIcon.includes('user') || lowerIcon.includes('people')) return 'User'
  if (lowerIcon.includes('book') || lowerIcon.includes('read')) return 'Reading'
  if (lowerIcon.includes('video') || lowerIcon.includes('play')) return 'VideoPlay'
  if (lowerIcon.includes('music') || lowerIcon.includes('audio') || lowerIcon.includes('sound')) return 'Mic'
  if (lowerIcon.includes('camera') || lowerIcon.includes('photo')) return 'Camera'
  if (lowerIcon.includes('star') || lowerIcon.includes('favorite')) return 'Star'
  if (lowerIcon.includes('rocket') || lowerIcon.includes('fire')) return 'Promotion'
  if (lowerIcon.includes('gift') || lowerIcon.includes('present')) return 'Present'
  if (lowerIcon.includes('trophy') || lowerIcon.includes('award')) return 'Trophy'
  if (lowerIcon.includes('tool') || lowerIcon.includes('wrench')) return 'Tools'
  if (lowerIcon.includes('setting') || lowerIcon.includes('config')) return 'Setting'
  if (lowerIcon.includes('search') || lowerIcon.includes('find')) return 'Search'
  if (lowerIcon.includes('compass') || lowerIcon.includes('navigation')) return 'Compass'
  if (lowerIcon.includes('message') || lowerIcon.includes('mail') || lowerIcon.includes('chat')) return 'Message'
  if (lowerIcon.includes('phone') || lowerIcon.includes('call')) return 'Phone'
  if (lowerIcon.includes('shop') || lowerIcon.includes('cart') || lowerIcon.includes('buy')) return 'ShoppingCart'
  if (lowerIcon.includes('house') || lowerIcon.includes('home')) return 'House'
  if (lowerIcon.includes('folder') || lowerIcon.includes('directory')) return 'Folder'
  if (lowerIcon.includes('file') || lowerIcon.includes('document')) return 'Document'
  
  // 默认返回文件夹图标
  return 'Folder'
}

// 重新导出统一的图标描述函数
export { getIconDescription } from '@/admin/utils/icon-config' 