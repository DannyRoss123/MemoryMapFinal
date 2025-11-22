"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUser } from "../context/UserContext";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

const navItems = [
  { label: "Home", href: "/home" },
  { label: "Memories", href: "/memories" },
  { label: "Journal", href: "/journal" },
  { label: "Contacts", href: "/contacts" },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) => pathname?.startsWith(href);
  const resolvedAvatar = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${API_BASE_URL}${user.profileImage}`
    : null;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo and Navigation stacked so the title sits above the tabs */}
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-gray-900">Memory Map</h1>
            <nav className="hidden md:flex space-x-6 mt-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pb-1 ${
                    isActive(item.href)
                      ? "text-gray-900 font-medium border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* User Profile */}
          <div className="relative flex items-center space-x-3" ref={menuRef}>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role === "PATIENT" ? "Patient" : user?.role || ""}</p>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300 overflow-hidden"
              aria-label="Open profile menu"
            >
              {resolvedAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolvedAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-10">
                <Link
                  href="/settings"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => logout()}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
