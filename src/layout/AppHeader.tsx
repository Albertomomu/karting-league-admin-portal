'use client';

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const AppHeader: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { pilot } = useAuth();

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-white px-4 py-3 shadow-sm dark:bg-gray-900 lg:px-6">
      {/* Sidebar toggle + Logo + Texto bienvenida */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden text-gray-600 dark:text-gray-400"
          onClick={handleToggle}
          aria-label="Toggle Sidebar"
        >
          {isMobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
              />
            </svg>
          ) : (
            <svg width="16" height="12" viewBox="0 0 16 12">
              <path
                fill="currentColor"
                d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
              />
            </svg>
          )}
        </button>

        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo/logo.png"
            alt="Logo"
            width={48}
            height={48}
            className="dark:hidden"
          />
          <Image
            src="/images/logo/logo.png"
            alt="Logo dark"
            width={48}
            height={48}
            className="hidden dark:block"
          />
        </Link>

        <span className="hidden md:inline-block text-gray-800 dark:text-white font-semibold text-sm sm:text-base">
          Bienvenido al panel de control de{" "}
          <span className="text-brand-600">Karting League</span>
          {pilot?.name && `, ${pilot.name}`}
        </span>
      </div>

      {/* Right items: Theme + User */}
      <div className="flex items-center gap-3">
        <ThemeToggleButton />
        <UserDropdown />
      </div>
    </header>
  );
};

export default AppHeader;
