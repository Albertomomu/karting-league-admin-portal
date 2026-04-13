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
  FlagTriangleRightIcon,
  ChevronDownIcon,
} from 'lucide-react';

type NavChild = {
  name: string;
  path: string;
};

type NavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
  children?: NavChild[];
};

const navItems: NavItem[] = [
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
  {
    name: 'Gestión de Carrera',
    path: '/gestion-carrera',
    icon: <FlagTriangleRightIcon size={20} />,
    children: [
      { name: 'Wildkarts', path: '/gestion-carrera/wildkarts' },
      { name: 'Clasificación', path: '/gestion-carrera/clasificacion' },
      { name: 'Parrillas', path: '/gestion-carrera/parrillas' },
      { name: 'Resultados Carrera', path: '/gestion-carrera/resultados' },
      { name: 'Documentos PDF', path: '/gestion-carrera/pdfs' },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const pathname = usePathname();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, openSubmenu, toggleSubmenu } = useSidebar();

  const isActive = (path: string) => pathname === path;
  const isGroupActive = (item: NavItem) =>
    item.children ? item.children.some((child) => pathname.startsWith(child.path)) : false;

  const showLabels = isExpanded || isHovered || isMobileOpen;

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
          {showLabels ? (
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
            {showLabels ? 'Menú' : <MoreHorizontalIcon size={16} />}
          </h2>
          <ul className="flex flex-col gap-4">
            {navItems.map((item) =>
              item.children ? (
                <li key={item.name}>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`menu-item group w-full ${
                      isGroupActive(item) ? 'menu-item-active' : 'menu-item-inactive'
                    }`}
                  >
                    <span
                      className={`${
                        isGroupActive(item)
                          ? 'menu-item-icon-active'
                          : 'menu-item-icon-inactive'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {showLabels && (
                      <>
                        <span className="menu-item-text flex-1 text-left">{item.name}</span>
                        <ChevronDownIcon
                          size={16}
                          className={`transition-transform duration-200 ${
                            openSubmenu === item.name ? 'rotate-180' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>
                  {showLabels && openSubmenu === item.name && (
                    <ul className="ml-8 mt-2 flex flex-col gap-2">
                      {item.children.map((child) => (
                        <li key={child.name}>
                          <Link
                            href={child.path}
                            className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                              isActive(child.path)
                                ? 'text-brand-500 bg-brand-50 dark:bg-brand-500/10 font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
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
                    {showLabels && (
                      <span className="menu-item-text">{item.name}</span>
                    )}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
