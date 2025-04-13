"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trash, Package, Gift, Trophy, Home, ChartBar, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const { isSignedIn, isLoaded } = useUser();

  // Don't show sidebar if not signed in or still loading
  if (!isLoaded || !isSignedIn) {
    return children;
  }

  // Show sidebar on specified routes
  if (!pathname.includes('/report') && 
      !pathname.includes('/dashboard') && 
      !pathname.includes('/collect') && 
      !pathname.includes('/rewards') && 
      !pathname.includes('/leaderboard')) {
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
    <div className="flex pt-16 min-h-screen">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-20 z-50 p-2 bg-white rounded-lg shadow-lg lg:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 w-64 shadow-lg z-40"
      >
        {/* Sidebar Header */}
        <div className="px-6 py-6 border-b border-gray-100">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold text-gray-800"
          >
            Greenify
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-1 text-sm text-gray-500"
          >
            Manage your waste reports
          </motion.p>
        </div>

        {/* Menu Items */}
        <nav className="p-4">
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Link href={item.link} className="block">
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
                    <span className="ml-4 font-medium">{item.name}</span>
                    
                    {pathname === item.link && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-2 h-2 bg-green-500 rounded-full"
                      />
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute right-0 bottom-0 left-0 p-6 border-t border-gray-100">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center space-x-4"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-gray-600">Active Session</p>
          </motion.div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`flex-1 ${isOpen ? 'lg:ml-64' : 'lg:ml-0'} w-full transition-all duration-300`}
      >
        <div className="w-full">
          {children}
        </div>
      </motion.main>
    </div>
  );
}