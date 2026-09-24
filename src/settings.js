module.exports = {
  /**
   * 侧边栏主题 深色主题theme-dark，浅色主题theme-light
   */
  sideTheme: 'theme-dark',

  /**
   * 主题颜色（与列表页主按钮一致）
   */
  theme: '#2563eb',

  /**
   * 是否系统布局配置
   */
  showSettings: false,

  /**
   * 菜单位置：侧边 side / 顶部 top
   */
  navPosition: 'side',

  /**
   * 是否显示 tagsView
   */
  tagsView: true,

  /**
   * 是否固定头部（顶部导航栏 + 标签栏滚动时保持置顶）
   */
  fixedHeader: true,

  /**
   * 是否显示logo
   */
  sidebarLogo: true,

  /**
   * 是否显示动态标题
   */
  dynamicTitle: false,

  /**
   * @type {string | array} 'production' | ['production', 'development']
   * @description Need show err logs component.
   * The default is only used in the production env
   * If you want to also use it in dev, you can pass ['production', 'development']
   */
  errorLog: 'production'
}
