'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSidebar } from '../context/SidebarContext';

import {
  UsersIcon,
  ShieldCheckIcon,
  FlagIcon,
  TrophyIcon,
  LayersIcon,
  CalendarIcon,
  SettingsIcon,
  TimerIcon,
  ClockIcon,
  LayoutDashboardIcon,
  MoreHorizontalIcon,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: <LayoutDashboardIcon size={20} /> },
  { name: 'Pilotos', path: '/pilotos', icon: <UsersIcon size={20} /> },
  { name: 'Pilotos / temporada', path: '/pilotos-temporadas', icon: <UsersIcon size={20} /> },
  { name: 'Equipos', path: '/equipos', icon: <ShieldCheckIcon size={20} /> },
  { name: 'Circuitos', path: '/circuitos', icon: <FlagIcon size={20} /> },
  { name: 'Carreras', path: '/carreras', icon: <TrophyIcon size={20} /> },
  { name: 'Resultados', path: '/resultados', icon: <LayersIcon size={20} /> },
  { name: 'Sesiones', path: '/sesiones', icon: <CalendarIcon size={20} /> },
  { name: 'Ligas', path: '/ligas', icon: <SettingsIcon size={20} /> },
  { name: 'Temporadas', path: '/temporadas', icon: <TimerIcon size={20} /> },
  { name: 'Tiempos por vuelta', path: '/tiempos', icon: <ClockIcon size={20} /> },
];

const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();

  const isActive = (path: string) => pathname === path;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? 'w-[290px]'
            : isHovered
            ? 'w-[290px]'
            : 'w-[90px]'
        }
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* LOGO */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.png"
                alt="Logo"
                width={120}
                height={120}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo.png"
                alt="Logo"
                width={120}
                height={120}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* NAV */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <h2
            className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
              !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'
            }`}
          >
            {isExpanded || isHovered || isMobileOpen ? 'Menú' : <MoreHorizontalIcon size={16} />}
          </h2>
          <ul className="flex flex-col gap-4">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`menu-item group ${
                    isActive(item.path) ? 'menu-item-active' : 'menu-item-inactive'
                  }`}
                >
                  <span
                    className={`${
                      isActive(item.path)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{item.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
