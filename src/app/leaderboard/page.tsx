"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMedal, FaTrophy, FaCrown, FaLeaf, FaUser } from "react-icons/fa";
import Loader from "@/components/Loader";
import Image from "next/image";

// Dummy leaderboard data
const leaderboardData = [
  {
    id: 1,
    name: "Sarah Johnson",
    points: 2500,
    rank: 1,
    achievements: 15,
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    badge: <FaCrown className="text-yellow-500" />,
  },
  {
    id: 2,
    name: "Michael Chen",
    points: 2350,
    rank: 2,
    achievements: 14,
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    badge: <FaMedal className="text-gray-400" />,
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    points: 2200,
    rank: 3,
    achievements: 13,
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    badge: <FaMedal className="text-amber-600" />,
  },
  {
    id: 4,
    name: "James Wilson",
    points: 2050,
    rank: 4,
    achievements: 12,
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    badge: <FaLeaf className="text-green-500" />,
  },
  {
    id: 5,
    name: "Olivia Taylor",
    points: 1900,
    rank: 5,
    achievements: 11,
    avatar: "https://randomuser.me/api/portraits/women/5.jpg",
    badge: <FaLeaf className="text-green-500" />,
  },
  {
    id: 6,
    name: "David Kim",
    points: 1750,
    rank: 6,
    achievements: 10,
    avatar: "https://randomuser.me/api/portraits/men/6.jpg",
    badge: <FaLeaf className="text-green-500" />,
  },
  {
    id: 7,
    name: "Sophia Martinez",
    points: 1600,
    rank: 7,
    achievements: 9,
    avatar: "https://randomuser.me/api/portraits/women/7.jpg",
    badge: <FaLeaf className="text-green-500" />,
  },
  {
    id: 8,
    name: "Ethan Brown",
    points: 1450,
    rank: 8,
    achievements: 8,
    avatar: "https://randomuser.me/api/portraits/men/8.jpg",
    badge: <FaLeaf className="text-green-500" />,
  },
  {
    id: 9,
    name: "Ava Davis",
    points: 1300,
    rank: 9,
    achievements: 7,
    avatar: "https://randomuser.me/api/portraits/women/9.jpg",
    badge: <FaLeaf className="text-green-500" />,
  },
  {
    id: 10,
    name: "Noah Garcia",
    points: 1150,
    rank: 10,
    achievements: 6,
    avatar: "https://randomuser.me/api/portraits/men/10.jpg",
    badge: <FaLeaf className="text-green-500" />,
  },
];

// Time periods for filtering
const timePeriods = [
  { id: "all-time", label: "All Time" },
  { id: "monthly", label: "This Month" },
  { id: "weekly", label: "This Week" },
  { id: "daily", label: "Today" },
];

export default function LeaderboardPage() {
  const [activePeriod, setActivePeriod] = useState("all-time");
  const [userRank] = useState(12);
  const [userPoints] = useState(950);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate waiting for layout components to load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Adjust this time as needed based on your actual layout load time

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container p-12 mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-800">Leaderboard</h1>
        <p className="text-gray-600">See how you rank against other eco-friendly champions</p>
      </div>

      {/* User Rank Summary Card */}
      <div className="p-6 mb-8 text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="mb-1 text-xl font-semibold">Your Ranking</h2>
            <p className="text-4xl font-bold">#{userRank}</p>
            <p className="mt-2 text-sm opacity-80">You have {userPoints} points</p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-full">
            <FaTrophy className="text-3xl" />
          </div>
        </div>
      </div>

      {/* Time Period Filter */}
      <div className="flex overflow-x-auto pb-2 mb-6 space-x-2">
        {timePeriods.map((period) => (
          <button
            key={period.id}
            onClick={() => setActivePeriod(period.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activePeriod === period.id
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-hidden bg-white rounded-xl shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Points
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Achievements
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboardData.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: user.id * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg font-semibold">{user.rank}</span>
                      <span className="ml-2">{user.badge}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 relative">
                        <Image
                          className="rounded-full"
                          src={user.avatar}
                          alt={user.name}
                          fill
                          sizes="40px"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.points}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.achievements}</div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Your Position (if not in top 10) */}
      {userRank > 10 && (
        <div className="p-4 mt-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10">
                <div className="flex justify-center items-center w-10 h-10 bg-green-100 rounded-full">
                  <FaUser className="text-green-500" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">You</div>
                <div className="text-xs text-gray-500">Rank #{userRank}</div>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">{userPoints} points</div>
          </div>
        </div>
      )}
    </div>
  );
}
