'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import WeatherWidget from './WeatherWidget';
import { buildings } from '@/lib/buildings';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

export default function Header() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Fetch current user on mount AND when route changes
    useEffect(() => {
        fetchUser();
    }, [pathname]);

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me', {
                credentials: 'include',
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <header className="bg-slate-800 text-white shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <Link href={user ? "/home" : "/"} className="text-xl font-bold hover:text-blue-400 transition">
                            Cokethorpe Energy
                        </Link>
                    </div>

                    {/* Navigation - Only show if logged in */}
                    {user && (
                        <nav className="flex items-center gap-6">
                            <Link
                                href="/home"
                                className="hover:text-blue-400 transition font-medium"
                            >
                                Home
                            </Link>
                            <Link
                                href="/site-data"
                                className="hover:text-blue-400 transition font-medium"
                            >
                                Site Data
                            </Link>

                            {/* Buildings Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="hover:text-blue-400 transition font-medium flex items-center gap-1"
                                >
                                    Buildings
                                    <svg
                                        className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                                        {buildings.map((building) => (
                                            <Link
                                                key={building.id}
                                                href={`/buildings/${building.id}`}
                                                className="block px-4 py-2 hover:bg-slate-600 transition"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                {building.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Admin Link - Only for admins */}
                            {user.role === 'admin' && (
                                <Link
                                    href="/admin/users"
                                    className="hover:text-blue-400 transition font-medium"
                                >
                                    Admin
                                </Link>
                            )}
                        </nav>
                    )}

                    {/* Right side: Weather + Auth */}
                    <div className="flex items-center gap-4">
                        <WeatherWidget />

                        {/* Auth Section */}
                        {loading ? (
                            <div className="w-20 h-10 bg-slate-700 rounded animate-pulse"></div>
                        ) : user ? (
                            <div className="relative group">
                                <button className="flex items-center gap-2 hover:text-blue-400 transition py-2">
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{user.name || user.email}</div>
                                        <div className="text-xs text-slate-400 capitalize">{user.role}</div>
                                    </div>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* User Dropdown Menu - No gap */}
                                <div className="hidden group-hover:block absolute right-0 top-full pt-1 w-48 z-50">
                                    <div className="bg-slate-700 rounded-lg shadow-xl">
                                        <Link
                                            href="/settings"
                                            className="block px-4 py-2 hover:bg-slate-600 transition rounded-t-lg"
                                        >
                                            Change Password
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-600 transition rounded-b-lg text-red-300"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link
                                href="/"
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}