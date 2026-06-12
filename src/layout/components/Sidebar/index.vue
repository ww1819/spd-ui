<template>
    <div :class="{'has-logo':showLogo}" :style="{ backgroundColor: settings.sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground }">
        <logo v-if="showLogo" :collapse="isCollapse" />
        <el-scrollbar :class="settings.sideTheme" wrap-class="scrollbar-wrapper">
            <el-menu
                ref="menu"
                :default-active="activeMenu"
                :collapse="isCollapse"
                :background-color="settings.sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground"
                :text-color="settings.sideTheme === 'theme-dark' ? variables.menuColor : variables.menuLightColor"
                :unique-opened="false"
                :active-text-color="settings.theme"
                :collapse-transition="false"
                mode="vertical"
                @open="handleMenuOpen"
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
            if (meta.activeMenu) {
                return meta.activeMenu;
            }
            return path;
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
        activeMenu() {
            this.$nextTick(() => {
                this.expandActiveMenuParents();
            });
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.expandActiveMenuParents();
        });
    },
    methods: {
        normalizeMenuPath(menuPath) {
            if (!menuPath || typeof menuPath !== 'string') {
                return '';
            }
            const normalized = menuPath.replace(/\\/g, '/');
            if (normalized.length > 1 && normalized.endsWith('/')) {
                return normalized.slice(0, -1);
            }
            return normalized;
        },
        resolveMenuPath(basePath, routePath) {
            if (isExternal(routePath)) {
                return routePath;
            }
            if (isExternal(basePath)) {
                return basePath;
            }
            const base = this.normalizeMenuPath(basePath);
            const segment = (routePath == null ? '' : String(routePath)).replace(/\\/g, '/');
            if (!segment) {
                return base;
            }
            if (segment.startsWith('/')) {
                return this.normalizeMenuPath(segment);
            }
            if (!base) {
                return this.normalizeMenuPath('/' + segment);
            }
            return this.normalizeMenuPath(base + '/' + segment);
        },
        getTopLevelMenuIndexes() {
            return (this.sidebarRouters || [])
                .filter(route => !route.hidden)
                .map(route => this.resolveMenuPath('', route.path));
        },
        isTopLevelMenuIndex(index) {
            const normalized = this.normalizeMenuPath(index);
            return this.getTopLevelMenuIndexes().includes(normalized);
        },
        isUnderTopLevelMenu(menuPath, topPath) {
            const normalizedMenuPath = this.normalizeMenuPath(menuPath);
            const normalizedTopPath = this.normalizeMenuPath(topPath);
            if (!normalizedMenuPath || !normalizedTopPath) {
                return false;
            }
            if (normalizedMenuPath === normalizedTopPath) {
                return true;
            }
            return normalizedMenuPath.startsWith(normalizedTopPath + '/');
        },
        getSubmenuEntry(menuIndex) {
            const menu = this.getMenuRef();
            if (!menu || !menu.submenus) {
                return null;
            }
            const normalizedIndex = this.normalizeMenuPath(menuIndex);
            return menu.submenus[normalizedIndex] || menu.submenus[menuIndex] || null;
        },
        /** 从 el-menu 已注册的 submenu 获取同级菜单 index，与界面实际 index 保持一致 */
        getSiblingSubmenuIndexes(menuIndex) {
            const submenu = this.getSubmenuEntry(menuIndex);
            if (!submenu || !Array.isArray(submenu.indexPath) || submenu.indexPath.length < 2) {
                return [];
            }
            const depth = submenu.indexPath.length;
            const parentKey = this.normalizeMenuPath(submenu.indexPath[depth - 2]);
            const menu = this.getMenuRef();
            return Object.keys(menu.submenus)
                .map(key => this.normalizeMenuPath(key))
                .filter(key => {
                    const sibling = menu.submenus[key];
                    if (!sibling || !Array.isArray(sibling.indexPath) || sibling.indexPath.length !== depth) {
                        return false;
                    }
                    return this.normalizeMenuPath(sibling.indexPath[depth - 2]) === parentKey;
                });
        },
        getMenuRef() {
            return this.$refs.menu;
        },
        getOpenedMenus() {
            const menu = this.getMenuRef();
            if (!menu || !Array.isArray(menu.openedMenus)) {
                return [];
            }
            return menu.openedMenus.map(item => this.normalizeMenuPath(item));
        },
        setOpenedMenus(openedMenus) {
            const menu = this.getMenuRef();
            if (!menu) {
                return;
            }
            const prev = this.getOpenedMenus();
            const next = [...new Set(
                (openedMenus || []).map(item => this.normalizeMenuPath(item)).filter(Boolean)
            )];
            prev.forEach(path => {
                if (!next.includes(path) && typeof menu.closeMenu === 'function') {
                    menu.closeMenu(path);
                }
            });
            menu.openedMenus = next;
        },
        getParentIndexesFromIndexPath(indexPath) {
            if (!Array.isArray(indexPath) || indexPath.length <= 1) {
                return [];
            }
            return indexPath
                .slice(0, -1)
                .map(item => this.normalizeMenuPath(item));
        },
        findParentMenusByRoute(targetPath) {
            const parentMenus = [];
            const normalizedTarget = this.normalizeMenuPath(targetPath);
            const walk = (routes, basePath = '') => {
                for (const route of routes) {
                    if (route.hidden) {
                        continue;
                    }
                    const currentPath = this.resolveMenuPath(basePath, route.path);
                    if (route.children && route.children.length > 0) {
                        if (this.hasActiveChild(route.children, normalizedTarget, currentPath)) {
                            parentMenus.push(currentPath);
                            walk(route.children, currentPath);
                            return;
                        }
                    }
                }
            };
            walk(this.sidebarRouters || []);
            return parentMenus;
        },
        hasActiveChild(children, targetPath, basePath) {
            for (const child of children) {
                if (child.hidden) {
                    continue;
                }
                const childPath = this.resolveMenuPath(basePath, child.path);
                if (
                    targetPath === childPath ||
                    targetPath.startsWith(childPath + '/')
                ) {
                    return true;
                }
                if (child.children && child.children.length > 0 && this.hasActiveChild(child.children, targetPath, childPath)) {
                    return true;
                }
            }
            return false;
        },
        getParentIndexesForPath(menuPath) {
            const normalizedPath = this.normalizeMenuPath(menuPath);
            const menu = this.getMenuRef();
            const activeItem = menu && menu.items[normalizedPath];
            if (activeItem && Array.isArray(activeItem.indexPath)) {
                const parents = this.getParentIndexesFromIndexPath(activeItem.indexPath);
                if (parents.length > 0) {
                    return parents;
                }
            }
            return this.findParentMenusByRoute(normalizedPath);
        },
        keepParentMenusOpen(menuPath, indexPath) {
            let parentIndexes = this.getParentIndexesFromIndexPath(indexPath);
            if (parentIndexes.length === 0) {
                parentIndexes = this.getParentIndexesForPath(menuPath);
            }
            if (parentIndexes.length === 0) {
                return;
            }
            const activeLevel2 = parentIndexes.length > 1
                ? parentIndexes[parentIndexes.length - 1]
                : null;
            const siblingMenus = activeLevel2 ? this.getSiblingSubmenuIndexes(activeLevel2) : [];
            const next = this.getOpenedMenus().filter(path => {
                if (activeLevel2 && siblingMenus.includes(path) && path !== activeLevel2) {
                    return false;
                }
                return true;
            });
            parentIndexes.forEach(parentPath => {
                if (!next.includes(parentPath)) {
                    next.push(parentPath);
                }
            });
            this.setOpenedMenus(next);
        },
        expandActiveMenuParents() {
            this.keepParentMenusOpen(this.activeMenu);
        },
        handleMenuSelect(index, indexPath) {
            const menuPath = this.normalizeMenuPath(
                typeof index === 'string' ? index : (index && index.path) || ''
            );
            if (menuPath && menuPath.startsWith('/')) {
                this.$store.commit('app/SET_SIDEBAR_NAV_TICK', {
                    path: menuPath,
                    tick: Date.now()
                });
            }
            this.$nextTick(() => {
                this.keepParentMenusOpen(menuPath, indexPath);
            });
        },
        handleMenuOpen(index) {
            const menuIndex = this.normalizeMenuPath(index);
            this.$nextTick(() => {
                const currentOpeneds = this.getOpenedMenus();

                if (this.isTopLevelMenuIndex(menuIndex)) {
                    const topLevels = this.getTopLevelMenuIndexes();
                    const next = currentOpeneds.filter(path => {
                        if (topLevels.includes(path)) {
                            return path === menuIndex;
                        }
                        return this.isUnderTopLevelMenu(path, menuIndex);
                    });
                    if (!next.includes(menuIndex)) {
                        next.push(menuIndex);
                    }
                    this.setOpenedMenus(next);
                    return;
                }

                const submenu = this.getSubmenuEntry(menuIndex);
                if (!submenu || !Array.isArray(submenu.indexPath) || submenu.indexPath.length < 2) {
                    return;
                }
                const topPath = this.normalizeMenuPath(submenu.indexPath[0]);
                const siblingMenus = this.getSiblingSubmenuIndexes(menuIndex);
                const next = currentOpeneds.filter(path => {
                    if (siblingMenus.includes(path)) {
                        return path === menuIndex;
                    }
                    return true;
                });
                if (!next.includes(menuIndex)) {
                    next.push(menuIndex);
                }
                if (topPath && !next.includes(topPath)) {
                    next.push(topPath);
                }
                this.setOpenedMenus(next);
            });
        }
    }
};
</script>
