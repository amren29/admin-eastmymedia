"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Map as MapIcon,
    Users,
    Settings,
    LogOut,
    FileText,
    UserCircle,
    UserPlus,
    UserCog,
    Package
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx } from 'clsx';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['administrator', 'director', 'chief', 'manager', 'sales', 'admin'] },
    { name: 'Media Inventory', href: '/media', icon: MapIcon, roles: ['administrator', 'director', 'chief', 'manager', 'sales', 'admin'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['administrator', 'director', 'chief', 'manager', 'sales'] },
    { name: 'Proposals', href: '/proposals', icon: FileText, roles: ['administrator', 'director', 'chief', 'manager', 'sales'] },
    { name: 'Packages', href: '/packages', icon: Package, roles: ['administrator', 'director', 'chief', 'manager', 'sales'] },
    { name: 'Blog', href: '/blog', icon: FileText, roles: ['administrator', 'admin', 'editor'] },
    { name: 'User Management', href: '/users', icon: UserCog, roles: ['administrator'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['administrator', 'director', 'chief', 'manager'] },
];

export function Sidebar() {
    const pathname = usePathname();
    const { userData, user, logout } = useAuth();

    // Filter navigation items based on user role
    const filteredNavItems = navItems.filter(item =>
        userData?.role && item.roles.includes(userData.role.toLowerCase())
    );

    return (
        <div className="flex h-screen w-64 flex-col bg-white text-slate-700 shadow-xl z-10">
            <div className="flex h-16 items-center px-6 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center font-bold text-lg text-primary-foreground">E</div>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900">Eastmy Media</h1>
                </div>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-6">
                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu</p>
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200'
                            )}
                        >
                            <Icon className={clsx(
                                isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900',
                                "mr-3 h-5 w-5 flex-shrink-0 transition-colors"
                            )} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-slate-100 p-3 bg-white">
                <div className="px-3 py-2 mb-2">
                    <p className="text-sm font-medium text-slate-900 truncate">
                        {userData?.fullName || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                        {userData?.email || user?.email || ''}
                    </p>
                </div>
                <button
                    onClick={() => logout()}
                    className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut className="mr-3 h-4 w-4 flex-shrink-0 group-hover:text-red-600 transition-colors" />
                    Logout
                </button>
            </div>
        </div>
    );
}
