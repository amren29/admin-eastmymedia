"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Monitor,
  FileText,
  Users,
  Package,
  BookOpen,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  Wrench,
  HardDrive,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <LayoutDashboard size={20} /> },
  { label: "Media Inventory", href: "/media", icon: <Monitor size={20} /> },
  { label: "Proposals", href: "/proposals", icon: <FileText size={20} /> },
  { label: "Customers", href: "/customers", icon: <Users size={20} /> },
  { label: "Packages", href: "/packages", icon: <Package size={20} /> },
  { label: "Blog", href: "/blog", icon: <BookOpen size={20} /> },
  { label: "Reports", href: "/reports", icon: <BarChart3 size={20} /> },
  {
    label: "Users",
    href: "/users",
    icon: <UserCog size={20} />,
    adminOnly: true,
  },
  { label: "Settings", href: "/settings", icon: <Settings size={20} /> },
];

const toolItems: NavItem[] = [
  {
    label: "Media Backup",
    href: "/tools/media-backup",
    icon: <HardDrive size={20} />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { userData, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive(href)
        ? "bg-blue-100 text-blue-700"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
    }`;

  const isAdmin = userData?.role === "administrator";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-5">
        <h1 className="text-lg font-bold text-gray-900">Eastmy Media</h1>
        <p className="text-xs text-gray-500">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-auto px-3 py-4">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.icon}
              {item.label}
            </Link>
          ))}

        {/* Tools Section */}
        <div className="pt-4">
          <p className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Wrench size={14} />
            Tools
          </p>
          {toolItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-200 p-4">
        {userData && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userData.fullName}
            </p>
            <p className="text-xs text-gray-500 truncate">{userData.email}</p>
            <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">
              {userData.role}
            </span>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
