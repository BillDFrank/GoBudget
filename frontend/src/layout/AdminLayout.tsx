"use client";

import { useSidebar } from "../context/SidebarContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      
      {/* Main Content Wrapper - takes remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AppHeader />
        
        {/* Main Content Area - scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 mx-auto max-w-7xl md:p-6 w-full lg:ml-0">
          <div className="page-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
