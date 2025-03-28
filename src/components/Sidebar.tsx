"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trash, Package, Gift, Trophy, Home, ChartBar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname();

  // Show sidebar on both report and dashboard routes
  if (!pathname.includes('/report') && !pathname.includes('/dashboard')) {
    return children;
  }

  const menuItems = [
    { name: "Dashboard", icon: <Home className="w-5 h-5" />, link: "/dashboard" },
    { name: "Report Waste", icon: <Trash className="w-5 h-5" />, link: "/report" },
    { name: "Collect Waste", icon: <Package className="w-5 h-5" />, link: "/collect" },
    { name: "Rewards", icon: <Gift className="w-5 h-5" />, link: "/rewards" },
    { name: "Leaderboard", icon: <Trophy className="w-5 h-5" />, link: "/leaderboard" },
  ];

  return (
    <div className="flex min-h-screen pt-16">
      <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 w-64 shadow-lg">
        {/* Sidebar Header */}
        <div className="px-6 py-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Greenify</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your waste reports</p>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          <div className="space-y-4">
            {menuItems.map((item) => (
              <Link key={item.name} href={item.link} className="flex flex-col">
                <div
                  className={`flex items-center p-3 rounded-xl transition-all duration-300 
                    ${pathname === item.link 
                      ? 'bg-green-50 text-green-700 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm'}`}
                >
                  <div className={`${
                    pathname === item.link 
                      ? 'text-green-600 bg-green-100 p-3 rounded-xl' 
                      : 'text-gray-400 bg-gray-100 p-3 rounded-xl group-hover:text-green-500 group-hover:bg-green-50'
                  } transition-all duration-300`}>
                    {item.icon}
                  </div>
                  <span className="ml-4 font-medium text-base">{item.name}</span>
                  
                  {pathname === item.link && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-green-500"
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p className="text-sm text-gray-600">Active Session</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 w-full">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}