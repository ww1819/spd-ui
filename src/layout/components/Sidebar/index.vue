<template>
    <div :class="{'has-logo':showLogo}" :style="{ backgroundColor: settings.sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground }">
        <logo v-if="showLogo" :collapse="isCollapse" />
        <el-scrollbar :class="settings.sideTheme" wrap-class="scrollbar-wrapper">
            <el-menu
                ref="menu"
                :default-active="activeMenu"
                :openeds="openedMenus"
                :collapse="isCollapse"
                :background-color="settings.sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground"
                :text-color="settings.sideTheme === 'theme-dark' ? variables.menuColor : variables.menuLightColor"
                :unique-opened="false"
                :active-text-color="settings.theme"
                :collapse-transition="false"
                mode="vertical"
                @open="handleMenuOpen"
                @close="handleMenuClose"
                @select="handleMenuSelect"
            >
                <sidebar-item
                    v-for="(route, index) in sidebarRouters"
                    :key="route.uniqueId || (route.path + '_' + index)"
                    :item="route"
                    :base-path="route.path"
                />
            </el-menu>
        </el-scrollbar>
    </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import path from 'path';
import Logo from "./Logo";
import SidebarItem from "./SidebarItem";
import variables from "@/assets/styles/variables.scss";
import { isExternal } from '@/utils/validate';

export default {
    components: { SidebarItem, Logo },
    data() {
        return {
            openedMenus: [], // 当前展开的菜单列表
            manuallyClosedMenus: [] // 用户手动收起的菜单列表（用于记录用户意图）
        };
    },
    computed: {
        ...mapState(["settings"]),
        ...mapGetters(["sidebarRouters", "sidebar"]),
        activeMenu() {
            const route = this.$route;
            const { meta, path } = route;
            // if set path, the sidebar will highlight the path you set
            if (meta.activeMenu) {
                return meta.activeMenu;
            }
            return path;
        },
        // 计算默认展开的菜单，递归查找所有包含当前激活菜单的父菜单
        defaultOpeneds() {
            const activePath = this.activeMenu;
            if (!activePath) {
                return [];
            }
            
            const openedMenus = [];
            
            // 递归查找所有包含当前激活路径的父菜单
            const findAllParentMenus = (routes, targetPath, basePath = '') => {
                for (const route of routes) {
                    if (route.hidden) {
                        continue;
                    }
                    
                    // 构建当前路由的完整路径（与 SidebarItem 中的 resolvePath 逻辑一致）
                    let currentPath = '';
                    if (isExternal(route.path)) {
                        currentPath = route.path;
                    } else if (isExternal(basePath)) {
                        currentPath = basePath;
                    } else if (basePath) {
                        currentPath = path.resolve(basePath, route.path);
                    } else {
                        currentPath = route.path.startsWith('/') ? route.path : '/' + route.path;
                    }
                    
                    // 如果有子菜单
                    if (route.children && route.children.length > 0) {
                        // 递归检查子菜单中是否包含目标路径
                        if (this.hasActiveChild(route.children, targetPath, currentPath)) {
                            openedMenus.push(currentPath);
                            // 继续递归查找子菜单中的父菜单
                            findAllParentMenus(route.children, targetPath, currentPath);
                        }
                    }
                }
            };
            
            findAllParentMenus(this.sidebarRouters, activePath);
            return openedMenus;
        },
        showLogo() {
            return this.$store.state.settings.sidebarLogo;
        },
        variables() {
            return variables;
        },
        isCollapse() {
            return !this.sidebar.opened;
        }
    },
    watch: {
        // 监听路由变化，动态更新展开的菜单
        '$route': {
            immediate: true,
            handler() {
                this.$nextTick(() => {
                    this.updateOpenedMenus();
                });
            }
        },
        // 监听 defaultOpeneds 变化，更新 openedMenus
        defaultOpeneds: {
            immediate: true,
            handler(newVal) {
                // 合并默认展开的菜单和用户手动展开的菜单（去重）
                // 但排除用户手动收起的菜单
                const filteredNewVal = newVal.filter(menu => !this.manuallyClosedMenus.includes(menu));
                // 只添加新的菜单，不删除用户手动收起的菜单
                const newMenus = filteredNewVal.filter(menu => !this.openedMenus.includes(menu));
                if (newMenus.length > 0) {
                    const allOpened = [...new Set([...this.openedMenus, ...newMenus])];
                    // 只有当 openedMenus 发生变化时才更新，避免覆盖用户的手动操作
                    if (JSON.stringify(allOpened.sort()) !== JSON.stringify(this.openedMenus.sort())) {
                        this.$nextTick(() => {
                            this.openedMenus = allOpened;
                            this.syncMenuState();
                        });
                    }
                }
            }
        }
    },
    mounted() {
        // 组件挂载时初始化展开的菜单
        this.$nextTick(() => {
            this.updateOpenedMenus();
        });
    },
    methods: {
        // 更新展开的菜单列表
        updateOpenedMenus() {
            const defaultOpened = this.defaultOpeneds;
            // 合并默认展开的菜单和用户手动展开的菜单（去重）
            // 但排除用户手动收起的菜单
            const filteredDefaultOpened = defaultOpened.filter(menu => !this.manuallyClosedMenus.includes(menu));
            const allOpened = [...new Set([...this.openedMenus, ...filteredDefaultOpened])];
            // 只有当 openedMenus 发生变化时才更新，避免覆盖用户的手动操作
            if (JSON.stringify(allOpened.sort()) !== JSON.stringify(this.openedMenus.sort())) {
                this.openedMenus = allOpened;
                // 确保菜单组件同步更新
                this.$nextTick(() => {
                    this.syncMenuState();
                });
            }
        },
        // 菜单展开事件
        handleMenuOpen(index) {
            if (!this.openedMenus.includes(index)) {
                this.openedMenus.push(index);
            }
            // 如果用户手动展开菜单，则从手动收起列表中移除（表示用户想要展开它）
            const closedIndex = this.manuallyClosedMenus.indexOf(index);
            if (closedIndex > -1) {
                this.manuallyClosedMenus.splice(closedIndex, 1);
            }
        },
        // 菜单收起事件（只有用户手动点击收起时才执行）
        handleMenuClose(index) {
            // 检查是否是当前激活菜单的父菜单，如果是则不收起
            const activePath = this.activeMenu;
            if (this.isParentOfActiveMenu(index, activePath)) {
                // 如果是当前激活菜单的父菜单，阻止收起
                this.$nextTick(() => {
                    if (!this.openedMenus.includes(index)) {
                        this.openedMenus.push(index);
                    }
                    // 强制同步菜单组件状态
                    this.syncMenuState();
                });
                return;
            }
            // 否则允许收起，并记录用户手动收起的意图
            const indexPos = this.openedMenus.indexOf(index);
            if (indexPos > -1) {
                // 先记录用户手动收起的菜单（如果还没有记录）
                if (!this.manuallyClosedMenus.includes(index)) {
                    this.manuallyClosedMenus.push(index);
                }
                // 从展开列表中移除
                this.openedMenus.splice(indexPos, 1);
                // 立即同步菜单组件状态，确保菜单能够收起
                this.syncMenuState();
                // 使用 $nextTick 再次确保状态同步，并防止自动展开
                this.$nextTick(() => {
                    // 再次检查并确保菜单已收起
                    if (this.openedMenus.includes(index)) {
                        const pos = this.openedMenus.indexOf(index);
                        if (pos > -1) {
                            this.openedMenus.splice(pos, 1);
                        }
                    }
                    this.syncMenuState();
                });
            }
        },
        // 同步菜单组件状态
        syncMenuState() {
            if (this.$refs.menu) {
                // 直接设置 openedMenus 属性
                const currentOpeneds = [...this.openedMenus];
                this.$refs.menu.openedMenus = currentOpeneds;
                // 使用 Vue.set 确保响应式更新
                if (this.$refs.menu.$set) {
                    this.$refs.menu.$set(this.$refs.menu, 'openedMenus', currentOpeneds);
                }
                // 直接操作菜单组件的内部状态，确保菜单能够正确收起
                if (this.$refs.menu.$children) {
                    this.$refs.menu.$children.forEach(child => {
                        if (child.$options.name === 'ElSubmenu' && child.index) {
                            const shouldBeOpen = currentOpeneds.includes(child.index);
                            if (child.opened !== shouldBeOpen) {
                                child.opened = shouldBeOpen;
                            }
                        }
                    });
                }
                // 强制更新菜单组件
                this.$refs.menu.$forceUpdate();
            }
        },
        // 菜单选择事件（点击菜单项时触发）
        handleMenuSelect(index) {
            // 确保所有父菜单都展开
            this.$nextTick(() => {
                this.ensureParentMenusOpen(index);
            });
        },
        // 确保父菜单展开
        ensureParentMenusOpen(menuPath) {
            const parentMenus = this.findAllParentMenus(menuPath);
            const allOpened = [...new Set([...this.openedMenus, ...parentMenus])];
            this.openedMenus = allOpened;
            // 强制更新菜单组件
            if (this.$refs.menu) {
                this.$refs.menu.openedMenus = allOpened;
            }
        },
        // 查找所有父菜单路径
        findAllParentMenus(targetPath) {
            const parentMenus = [];
            const findParents = (routes, targetPath, basePath = '', parents = []) => {
                for (const route of routes) {
                    if (route.hidden) {
                        continue;
                    }
                    
                    let currentPath = '';
                    if (isExternal(route.path)) {
                        currentPath = route.path;
                    } else if (isExternal(basePath)) {
                        currentPath = basePath;
                    } else if (basePath) {
                        currentPath = path.resolve(basePath, route.path);
                    } else {
                        currentPath = route.path.startsWith('/') ? route.path : '/' + route.path;
                    }
                    
                    if (route.children && route.children.length > 0) {
                        const newParents = [...parents, currentPath];
                        if (this.hasActiveChild(route.children, targetPath, currentPath)) {
                            parentMenus.push(...newParents);
                            findParents(route.children, targetPath, currentPath, newParents);
                            break;
                        }
                    }
                }
            };
            findParents(this.sidebarRouters, targetPath);
            return parentMenus;
        },
        // 检查菜单是否是当前激活菜单的父菜单
        isParentOfActiveMenu(menuPath, activePath) {
            if (!activePath || !menuPath) {
                return false;
            }
            // 检查 activePath 是否以 menuPath 开头
            return activePath.startsWith(menuPath + '/') || activePath === menuPath;
        },
        // 递归检查子路由中是否包含目标路径
        hasActiveChild(children, targetPath, basePath) {
            if (!children || children.length === 0) {
                return false;
            }
            
            for (const child of children) {
                if (child.hidden) {
                    continue;
                }
                
                // 构建子路由的完整路径（与 SidebarItem 中的 resolvePath 逻辑一致）
                let childPath = '';
                if (isExternal(child.path)) {
                    childPath = child.path;
                } else if (isExternal(basePath)) {
                    childPath = basePath;
                } else if (basePath) {
                    childPath = path.resolve(basePath, child.path);
                } else {
                    childPath = child.path.startsWith('/') ? child.path : '/' + child.path;
                }
                
                // 检查路径是否匹配（精确匹配或前缀匹配）
                if (targetPath === childPath || targetPath.startsWith(childPath + '/') || childPath === targetPath) {
                    return true;
                }
                
                // 如果有子菜单，递归检查
                if (child.children && child.children.length > 0) {
                    if (this.hasActiveChild(child.children, targetPath, childPath)) {
                        return true;
                    }
                }
            }
            
            return false;
        }
    }
};
</script>
