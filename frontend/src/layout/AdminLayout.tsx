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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      
      {/* Main Content Wrapper - takes remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AppHeader />
        
        {/* Main Content Area */}
        <div className="flex-1 p-4 mx-auto max-w-7xl md:p-6 w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
