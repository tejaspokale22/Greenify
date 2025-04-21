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
  BarChart,
  Plus,
  ArrowRight,
  Loader2,
  RefreshCw
} from "lucide-react";
import { getRecentReports } from "@/db/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Report } from "@/lib/types";
import { useUser } from "@clerk/nextjs";

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export default function DashboardPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [userStats, setUserStats] = useState({
    points: 0,
    reportsCount: 0,
    rank: "Eco Warrior",
    impact: "Positive"
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load user data from localStorage on client-side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("userData");
      if (storedData) {
        setUserData(JSON.parse(storedData));
      } else if (user) {
        // If no stored data but we have user from Clerk, create userData
        const newUserData = {
          name: user.fullName || user.username || "User",
          email: user.emailAddresses[0]?.emailAddress || "",
          id: user.id
        };
        setUserData(newUserData);
        localStorage.setItem("userData", JSON.stringify(newUserData));
      }
    }
  }, [user]);

  // Redirect to home page if user is not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Function to fetch reports from the database
  const fetchRecentReports = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // Check if we have cached data and it's not expired
      const cachedData = localStorage.getItem("recentReports");
      const cacheTimestamp = localStorage.getItem("recentReportsTimestamp");
      
      const now = new Date().getTime();
      const isCacheValid = cacheTimestamp && 
        (now - parseInt(cacheTimestamp)) < CACHE_EXPIRATION;
      
      // Use cached data if available, not expired, and not forcing refresh
      if (cachedData && isCacheValid && !forceRefresh) {
        const parsedReports = JSON.parse(cachedData);
        setRecentReports(parsedReports);
        
        // Update user stats based on cached reports
        if (parsedReports.length > 0) {
          setUserStats(prev => ({
            ...prev,
            reportsCount: parsedReports.length,
            points: parsedReports.length * 10,
            rank: parsedReports.length > 20 ? "Eco Master" : parsedReports.length > 10 ? "Eco Champion" : "Eco Warrior",
            impact: parsedReports.length > 15 ? "Significant" : parsedReports.length > 5 ? "Positive" : "Growing"
          }));
        }
        
        setIsLoading(false);
        return;
      }
      
      // Fetch fresh data from the database
      const reports = await getRecentReports(5);
      
      // Convert null imageUrl to undefined to match Report type
      const formattedReports = reports.map(report => ({
        ...report,
        imageUrl: report.imageUrl || undefined,
        collectorId: report.collectorId || null
      }));
      
      // Cache the formatted reports
      localStorage.setItem("recentReports", JSON.stringify(formattedReports));
      localStorage.setItem("recentReportsTimestamp", now.toString());
      
      setRecentReports(formattedReports as Report[]);
      
      // Update user stats based on reports
      if (formattedReports.length > 0) {
        setUserStats(prev => ({
          ...prev,
          reportsCount: reports.length,
          points: reports.length * 10,
          rank: reports.length > 20 ? "Eco Master" : reports.length > 10 ? "Eco Champion" : "Eco Warrior",
          impact: reports.length > 15 ? "Significant" : reports.length > 5 ? "Positive" : "Growing"
        }));
      }
    } catch (error) {
      console.error("Error fetching recent reports:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (isSignedIn) {
      fetchRecentReports();
    }
  }, [isSignedIn]);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRecentReports(true);
  };

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
      </div>
    );
  }

  // Don't render anything if not signed in (will redirect)
  if (!isSignedIn) {
    return null;
  }

  // Use a fallback name if userData is not available
  const userName = userData?.name || user?.fullName || user?.username || "User";

  const stats = [
    {
      title: "Total Points",
      value: userStats.points,
      icon: Award,
      color: "bg-green-500",
      description: "Your environmental contribution score"
    },
    {
      title: "Reports Made",
      value: userStats.reportsCount,
      icon: Trash,
      color: "bg-blue-500",
      description: "Total waste reports submitted"
    },
    {
      title: "Current Rank",
      value: userStats.rank,
      icon: TrendingUp,
      color: "bg-purple-500",
      description: "Your current eco-warrior status"
    },
    {
      title: "Environmental Impact",
      value: userStats.impact,
      icon: Users,
      color: "bg-orange-500",
      description: "Your positive environmental footprint"
    },
  ];

  return (
    <div className="pt-12 pb-20 min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-white rounded-2xl border border-gray-100 shadow-lg"
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {userName}! 🌱
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Track your environmental impact and waste management progress
                </p>
              </div>
              <Link 
                href="/report"
                className="flex gap-2 items-center px-6 py-3 text-white bg-green-600 rounded-xl shadow-lg transition-colors duration-300 hover:bg-green-700 hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span>New Report</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 mb-12 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-white rounded-2xl border border-gray-100 shadow-lg transition-shadow duration-300 hover:shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-500">{stat.title}</span>
              </div>
              <p className="mb-2 text-3xl font-bold text-gray-900">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Activity and Progress Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 bg-white rounded-2xl border border-gray-100 shadow-lg"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Activity
              </h2>
              <div className="flex gap-4 items-center">
                <button 
                  onClick={handleRefresh}
                  className="flex gap-1 items-center text-sm font-medium text-green-600 hover:text-green-700"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Refresh</span>
                </button>
                <Link 
                  href="/reports"
                  className="flex gap-1 items-center text-sm font-medium text-green-600 hover:text-green-700"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                </div>
              ) : recentReports.length > 0 ? (
                recentReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center p-4 bg-gray-50 rounded-xl transition-colors duration-300 hover:bg-gray-100"
                  >
                    <div className="flex-shrink-0">
                      <MapPin className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1 ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {report.wasteType}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(report.createdAt || new Date()).toLocaleDateString()}
                      </p>
                    </div>
                    <a 
                      href={report.location}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-1 items-center text-sm text-green-600 hover:text-green-700 hover:underline"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>View Location</span>
                    </a>
                  </motion.div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                  <p className="text-gray-500">
                    No recent activity to show
                  </p>
                  <Link 
                    href="/report"
                    className="inline-flex gap-2 items-center mt-4 text-sm font-medium text-green-600 hover:text-green-700"
                  >
                    Create your first report
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Environmental Impact */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 bg-white rounded-2xl border border-gray-100 shadow-lg"
          >
            <h2 className="mb-6 text-xl font-semibold text-gray-900">
              Environmental Impact
            </h2>
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center p-4 bg-green-50 rounded-xl transition-colors duration-300 hover:bg-green-100"
              >
                <div className="flex items-center">
                  <Package className="mr-3 w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Waste Collected
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {userStats.reportsCount * 5}kg
                </span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex justify-between items-center p-4 bg-blue-50 rounded-xl transition-colors duration-300 hover:bg-blue-100"
              >
                <div className="flex items-center">
                  <BarChart className="mr-3 w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Carbon Offset
                  </span>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {userStats.reportsCount * 2.5}kg
                </span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-between items-center p-4 bg-purple-50 rounded-xl transition-colors duration-300 hover:bg-purple-100"
              >
                <div className="flex items-center">
                  <Calendar className="mr-3 w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-900">
                    Active Days
                  </span>
                </div>
                <span className="text-sm font-semibold text-purple-600">
                  {Math.ceil(userStats.reportsCount * 1.5)}
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
