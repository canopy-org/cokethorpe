'use client';

import Link from 'next/link';
import { useState } from 'react';
import WeatherWidget from './WeatherWidget';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const buildings = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: `Building ${i + 1}`
  }));

  return (
    <header className="bg-slate-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold hover:text-blue-400 transition">
              Cokethorpe
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link 
              href="/" 
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
          </nav>

          {/* Right side: Weather + Auth */}
          <div className="flex items-center gap-4">
            <WeatherWidget />
            
            {/* Auth button placeholder */}
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition">
              Login
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}