<template>
    <div :class="{'has-logo':showLogo}" :style="{ backgroundColor: settings.sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground }">
        <logo v-if="showLogo" :collapse="isCollapse" />
        <el-scrollbar :class="settings.sideTheme" wrap-class="scrollbar-wrapper">
            <el-menu
                :default-active="activeMenu"
                :default-openeds="defaultOpeneds"
                :collapse="isCollapse"
                :background-color="settings.sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground"
                :text-color="settings.sideTheme === 'theme-dark' ? variables.menuColor : variables.menuLightColor"
                :unique-opened="true"
                :active-text-color="settings.theme"
                :collapse-transition="false"
                mode="vertical"
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
        // 计算默认展开的菜单，只展开直接包含当前激活菜单的父菜单（只展开一层）
        defaultOpeneds() {
            const activePath = this.activeMenu;
            if (!activePath) {
                return [];
            }
            
            const openedMenus = [];
            
            // 查找直接包含当前激活路径的父菜单（只查找一层，不递归）
            const findDirectParentMenu = (routes, targetPath, basePath = '') => {
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
                        // 检查子菜单中是否直接包含目标路径（不递归检查子菜单的子菜单）
                        if (this.hasDirectActiveChild(route.children, targetPath, currentPath)) {
                            openedMenus.push(currentPath);
                            // 找到直接父菜单后就不再继续查找，只展开一层
                            return;
                        }
                    }
                }
            };
            
            findDirectParentMenu(this.sidebarRouters, activePath);
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
    methods: {
        // 检查子路由中是否直接包含目标路径（只检查一层，不递归）
        hasDirectActiveChild(children, targetPath, basePath) {
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
                
                // 检查路径是否匹配（只检查直接子菜单，不递归检查子菜单的子菜单）
                // 支持精确匹配和前缀匹配（因为路由可能是 /department/batchConsume 而菜单路径可能是 /department）
                if (targetPath === childPath || targetPath.startsWith(childPath + '/') || childPath === targetPath) {
                    return true;
                }
            }
            
            return false;
        }
    }
};
</script>
