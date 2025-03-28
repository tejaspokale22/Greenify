"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Trash, 
  Package, 
  Award, 
  TrendingUp, 
  Calendar,
  MapPin,
  Users,
  BarChart
} from "lucide-react";
// import { getUserBalance, getRecentReports } from "@/db/actions";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface Report {
  id: number;
  userId: number;
  location: string;
  wasteType: string;
  amount: string;
  imageUrl: string | null;
  verificationResult: unknown;
  status: string;
  createdAt: Date;
  collectorId: number | null;
}

export default function DashboardPage() {
  if (typeof window === "undefined") return null; // Prevents SSR issues

  const storedData = localStorage.getItem("userData");
  const [userData, setUserData] = useState<any>(storedData ? JSON.parse(storedData) : null);
  const [userStats, setUserStats] = useState({
    points: 0,
    reportsCount: 0,
    rank: "Eco Warrior",
    impact: "Positive"
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const router = useRouter();

  // useEffect(() => {
  //   const checkUser = () => {
  //     const storedData = JSON.parse(localStorage.getItem("userData") || "{} ");
  //     setUserData(storedData);
  //   };
  //   checkUser();
  // }, [router]);

  if (!userData) return null;

  const stats = [
    {
      title: "Total Points",
      value: userStats.points,
      icon: Award,
      color: "bg-green-500",
    },
    {
      title: "Reports Made",
      value: userStats.reportsCount,
      icon: Trash,
      color: "bg-blue-500",
    },
    {
      title: "Current Rank",
      value: userStats.rank,
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      title: "Environmental Impact",
      value: userStats.impact,
      icon: Users,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-green-50 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {userData.name}!
            </h1>
            <p className="mt-2 text-gray-600">
              Track your environmental impact and waste management progress
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Activity and Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentReports.map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center p-4 bg-gray-50 rounded-xl"
                >
                  <MapPin className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {report.wasteType}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="ml-auto text-sm text-gray-500">
                    {report.location}
                  </span>
                </div>
              ))}
              {recentReports.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No recent activity to show
                </p>
              )}
            </div>
          </motion.div>

          {/* Environmental Impact */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Environmental Impact
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Waste Collected
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {userStats.reportsCount * 5}kg
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center">
                  <BarChart className="w-5 h-5 text-blue-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Carbon Offset
                  </span>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {userStats.reportsCount * 2.5}kg
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-purple-500 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    Active Days
                  </span>
                </div>
                <span className="text-sm font-semibold text-purple-600">
                  {Math.ceil(userStats.reportsCount * 1.5)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
