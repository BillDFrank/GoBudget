"use client";

import { useSidebar } from "../context/SidebarContext";

const Backdrop: React.FC = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
      onClick={toggleMobileSidebar}
      aria-hidden="true"
    />
  );
};

export default Backdrop;
