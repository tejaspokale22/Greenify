"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaMedal, FaTrophy, FaGift, FaStar, FaLeaf } from "react-icons/fa";
import Loader from "@/components/Loader";
import Image from "next/image";

// Dummy rewards data
const rewardsData = [
  {
    id: 1,
    title: "Eco Warrior",
    description: "Reached 100 points by recycling 50 items",
    icon: <FaMedal className="text-amber-500" />,
    points: 100,
    date: "May 15, 2023",
    status: "completed",
  },
  {
    id: 2,
    title: "Green Innovator",
    description: "Completed 10 eco-friendly challenges",
    icon: <FaTrophy className="text-emerald-500" />,
    points: 250,
    date: "June 22, 2023",
    status: "completed",
  },
  {
    id: 3,
    title: "Sustainability Champion",
    description: "Reduced carbon footprint by 25%",
    icon: <FaLeaf className="text-green-500" />,
    points: 500,
    date: "July 10, 2023",
    status: "completed",
  },
  {
    id: 4,
    title: "Community Leader",
    description: "Invited 5 friends to join Greenify",
    icon: <FaStar className="text-blue-500" />,
    points: 150,
    date: "August 5, 2023",
    status: "completed",
  },
  {
    id: 5,
    title: "Zero Waste Master",
    description: "Achieved zero waste for 30 days",
    icon: <FaGift className="text-purple-500" />,
    points: 300,
    date: "September 18, 2023",
    status: "in-progress",
  },
];

// Available rewards to redeem
const availableRewards = [
  {
    id: 1,
    title: "Eco-friendly Water Bottle",
    description: "Reusable stainless steel water bottle",
    points: 200,
    image: "https://images.unsplash.com/photo-1602147637168-13d4b47a0bca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 2,
    title: "Bamboo Cutlery Set",
    description: "Sustainable bamboo cutlery set with carrying case",
    points: 300,
    image: "https://images.unsplash.com/photo-1583241475883-9f8d8cbf7ef7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 3,
    title: "Organic Cotton Tote",
    description: "Eco-friendly shopping bag made from organic cotton",
    points: 150,
    image: "https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
  },
];

export default function RewardsPage() {
  const [activeTab, setActiveTab] = useState("earned");
  const [totalPoints] = useState(0);
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
        <h1 className="mb-2 text-3xl font-bold text-gray-800">Your Rewards</h1>
        <p className="text-gray-600">Track your eco-friendly achievements and redeem rewards</p>
      </div>

      {/* Points Summary Card */}
      <div className="p-6 mb-8 text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="mb-1 text-xl font-semibold">Total Points</h2>
            <p className="text-4xl font-bold">{totalPoints}</p>
          </div>
          <div className="p-4 bg-white bg-opacity-20 rounded-full">
            <FaTrophy className="text-3xl" />
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2.5">
            <div className="bg-white h-2.5 rounded-full" style={{ width: "65%" }}></div>
          </div>
          <p className="mt-2 text-sm">Next tier: 2000 points</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-6 border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "earned"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("earned")}
        >
          Earned Rewards
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "available"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("available")}
        >
          Available Rewards
        </button>
      </div>

      {/* Earned Rewards */}
      {activeTab === "earned" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rewardsData.map((reward) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="p-3 mr-4 bg-gray-100 rounded-full">
                    {reward.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{reward.title}</h3>
                    <p className="text-sm text-gray-500">{reward.date}</p>
                  </div>
                </div>
                <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {reward.points} pts
                </div>
              </div>
              <p className="mt-4 text-gray-600">{reward.description}</p>
              <div className="flex items-center mt-4">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  reward.status === "completed" ? "bg-green-500" : "bg-yellow-500"
                }`}></span>
                <span className="text-sm text-gray-500 capitalize">{reward.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Available Rewards */}
      {activeTab === "available" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableRewards.map((reward) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg"
            >
              <div className="overflow-hidden h-48">
                <Image
                  src={reward.image}
                  alt={reward.title}
                  className="object-cover w-full h-full"
                  width={400}
                  height={300}
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{reward.title}</h3>
                  <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {reward.points} pts
                  </div>
                </div>
                <p className="mb-4 text-gray-600">{reward.description}</p>
                <button 
                  className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                    totalPoints >= reward.points 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  disabled={totalPoints < reward.points}
                >
                  {totalPoints >= reward.points ? "Redeem Now" : "Not Enough Points"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
