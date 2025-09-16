"use client";
import React, { useEffect, useRef, useState,useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSidebar } from "../context/SidebarContext";
import {
  GridIcon,
  CreditCardIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PiggyBankIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  ChevronDownIcon,
  UserCircleIcon,
  CogIcon,
  LogoutIcon,
} from "../icons/index";
import { useAuthStore } from "../store/auth";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: <CreditCardIcon />,
    name: "Transactions",
    path: "/transactions",
  },
  {
    icon: <TrendingUpIcon />,
    name: "Income",
    path: "/income",
  },
  {
    icon: <TrendingDownIcon />,
    name: "Expenses",
    path: "/expenses",
  },
  {
    icon: <PiggyBankIcon />,
    name: "Savings",
    path: "/savings",
  },
  {
    icon: <ChartBarIcon />,
    name: "Investments",
    path: "/investments",
  },
  {
    icon: <ShoppingCartIcon />,
    name: "Supermarket",
    path: "/supermarket",
  },
];

const profileItems: NavItem[] = [
  {
    icon: <UserCircleIcon />,
    name: "Profile",
    path: "/profile",
  },
  {
    icon: <CogIcon />,
    name: "Settings",
    path: "/settings",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [openSubmenu, setOpenSubmenu] = useState<{ type: string; index: number } | null>(null);
  const subMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [subMenuHeight, setSubMenuHeight] = useState<{ [key: string]: number }>({});

  const isActive = (path: string) => router.pathname === path;

  const handleSubmenuToggle = (index: number, menuType: "main" | "profile") => {
    const newSubmenu = { type: menuType, index };
    setOpenSubmenu(
      openSubmenu?.type === menuType && openSubmenu?.index === index
        ? null
        : newSubmenu
    );
  };

  const updateSubMenuHeights = useCallback(() => {
    const newHeights: { [key: string]: number } = {};
    Object.entries(subMenuRefs.current).forEach(([key, ref]) => {
      if (ref) {
        newHeights[key] = ref.scrollHeight;
      }
    });
    setSubMenuHeight(newHeights);
  }, []);

  useEffect(() => {
    updateSubMenuHeights();
    window.addEventListener("resize", updateSubMenuHeights);
    return () => window.removeEventListener("resize", updateSubMenuHeights);
  }, [updateSubMenuHeights]);

  const handleLogout = () => {
    logout();
    window.location.href = 'https://gobudget.duckdns.org';
  };

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "profile"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            New
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            Pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <aside
        className={`sidebar ${
          isMobileOpen
            ? "sidebar-mobile-open"
            : "sidebar-mobile-closed"
        } ${
          isExpanded ? "sidebar-expanded" : "sidebar-collapsed"
        } ${isHovered ? "sidebar-hovered" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-brand">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">GB</span>
              </div>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="text-xl font-bold text-gray-900">
                  Go Budget
                </span>
              )}
            </div>
          </Link>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <div className="space-y-8">
              <div>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <h3 className="sidebar-section-title">Main Menu</h3>
                )}
                {renderMenuItems(navItems, "main")}
              </div>

              <div>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <h3 className="sidebar-section-title">Profile</h3>
                )}
                {renderMenuItems(profileItems, "profile")}
              </div>
            </div>
          </nav>

          <div className="sidebar-footer">
            <button
              onClick={handleLogout}
              className="menu-item group menu-item-inactive w-full"
            >
              <span className="menu-item-icon-inactive">
                <LogoutIcon />
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
