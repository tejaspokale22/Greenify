"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  MapPin,
  CheckCircle,
  Clock,
  ArrowRight,
  Camera,
  Upload,
  Calendar,
  Weight,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getWasteCollectionTasks } from "@/db/actions";
import type { Report } from "@/lib/types";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const ITEMS_PER_PAGE = 5;

export default function CollectPage() {
  const router = useRouter();

  if (typeof window === "undefined") return null; // Prevents SSR issues

  const [userData, setUserData] = useState<any>(null);
  const [tasks, setTasks] = useState<Report[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hoveredWasteType, setHoveredWasteType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState<Report | null>(null);
  const [verificationImage, setVerificationImage] = useState<string | null>(
    null
  );
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failure"
  >("idle");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Function to calculate days ago
  const getDaysAgo = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if the date is today
    const isToday = now.toDateString() === date.toDateString();
    if (isToday) {
      return "Today";
    }

    return diffDays;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];

        // Validate file type
        if (!selectedFile.type.startsWith("image/")) {
          toast.error("Please upload an image file");
          return;
        }

        // Validate file size (10MB limit)
        if (selectedFile.size > 10 * 1024 * 1024) {
          toast.error("File size should be less than 10MB");
          return;
        }

        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.onerror = () => {
          toast.error("Error reading file");
        };
        reader.readAsDataURL(selectedFile);
      }
    } catch (error) {
      console.error("Error handling file:", error);
      toast.error("Error processing file. Please try again.");
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractBase64Data = (dataUrl: string | null) => {
    // Example: "data:image/jpeg;base64,XXXX..."
    if (!dataUrl) return null;
    const [meta, base64] = dataUrl.split(",");
    const mimeType = meta.match(/data:(.*);base64/)?.[1] || "image/jpeg";
    return { base64, mimeType };
  };

  // Calculate pagination
  const filteredTasks = tasks
    .filter((task) =>
      task.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by date in descending order (newest first)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);

  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Fetch tasks whenever userData changes or on initial load
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await getWasteCollectionTasks();
        // Map the fetched tasks to match the Report type
        const mappedTasks = fetchedTasks.map((task) => ({
          id: task.id,
          userId: task.userId,
          location: task.location,
          wasteType: task.wasteType,
          amount: task.amount,
          status: task.status,
          collectorId: task.collectorId,
          verificationResult: task.verificationResult,
          imageUrl: task.imageUrl,
          createdAt: new Date(task.date),
        }));
        setTasks(mappedTasks);
      } catch (error: unknown) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to load tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Check if we have user data in localStorage
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
      setUser(parsedUserData);
    }

    // Always fetch tasks
    fetchTasks();
  }, []);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Implementation for status change
    console.log(`Changing status of task ${taskId} to ${newStatus}`);
  };

  const handleVerify = async () => {
    if (!file || !selectedTask) {
      toast.error("Please upload a verification image.");
      return;
    }

    setVerificationStatus("verifying");

    try {
      const base64Data = await readFileAsBase64(file);
      const imageData2 = base64Data.split(",")[1];
      const imageData1 = extractBase64Data(selectedTask.imageUrl)?.base64;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert in waste management and environmental analysis. Analyze the two images below.

  Instructions:
  - Determine if both images are from the same place.
  - If yes, compare the state of the location:
    - Was there waste in the first image?
    - Has the waste been cleaned in the second image?
    - Briefly describe the type of waste and the cleanup status.

  Return a JSON object in this format:

  {
    "sameLocation": true or false,
    "firstImageHasWaste": true or false,
    "cleanupStatus": "fully cleaned" or "partially cleaned" or "not cleaned",
    "wasteType": "plastic" or "mixed" or etc,
    "comments": "Short paragraph summarizing your findings"
  }

  Return ONLY the JSON object, no other text or explanation.`,
                  },
                  {
                    inline_data: {
                      mime_type: file.type,
                      data: imageData1,
                    },
                  },
                  {
                    inline_data: {
                      mime_type: file.type,
                      data: imageData2,
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Unknown API error");
      }

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : null;

      if (jsonText) {
        const parsedResult = JSON.parse(jsonText);
        console.log(parsedResult);

        // Save the verification result
        const verificationReport = {
          wasteTypeMatch: parsedResult.wasteType === selectedTask.wasteType,
          quantityMatch: parsedResult.cleanupStatus === "fully cleaned",
          confidence: 0.95, // This could be calculated based on the API response
          wasteType: parsedResult.wasteType,
          cleanupStatus: parsedResult.cleanupStatus,
          comments: parsedResult.comments,
        };

        setVerificationResult(verificationReport);
        setVerificationStatus("success");
        toast.success("Verification successful!");
      } else {
        throw new Error("Could not parse response JSON");
      }
    } catch (error) {
      console.error("Error during verification:", error);
      toast.error("Failed to verify collection. Please try again.");
      setVerificationStatus("failure");
    }
  };

  const handleViewDetails = (taskId: string) => {
    router.push(`/viewReport/${taskId}`);
  };

  const handleStartCollection = (taskId: string) => {
    setSelectedTask(
      tasks.find((task: Report) => task.id?.toString() === taskId) || null
    );
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 sm:mb-0">
            Waste Collection Tasks
          </h1>

          <div className="relative w-full max-w-md">
            <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-2 pr-4 pl-10 w-full text-sm bg-white rounded-lg border border-gray-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <Loader />
              <p className="text-sm text-gray-500">Loading tasks...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedTasks.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
                <Trash2 className="mx-auto w-12 h-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No tasks found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? "No tasks match your search criteria."
                    : "There are no waste collection tasks available."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <MapPin className="mr-2 w-5 h-5 text-green-600" />
                          <a
                            href={task.location}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-green-600 cursor-pointer text-md hover:underline"
                          >
                            See Location
                          </a>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            task.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {task.status === "pending"
                            ? "Pending"
                            : task.status === "in_progress"
                            ? "In Progress"
                            : "Verified"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="flex items-center">
                          <Trash2 className="mr-2 w-4 h-4 text-gray-500" />
                          <div className="relative">
                            <span
                              onMouseEnter={() =>
                                setHoveredWasteType(task.wasteType)
                              }
                              onMouseLeave={() => setHoveredWasteType(null)}
                              className="truncate cursor-pointer"
                            >
                              {task.wasteType}
                            </span>
                            {hoveredWasteType === task.wasteType && (
                              <div className="absolute left-0 top-full z-10 p-2 mt-1 text-xs text-white bg-gray-800 rounded-md shadow-lg">
                                {task.wasteType}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Weight className="mr-2 w-4 h-4 text-gray-500" />
                          <span className="truncate">
                            {task.amount || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-2 w-4 h-4 text-gray-500" />
                          <span className="truncate">
                            {task.createdAt
                              ? task.createdAt.toLocaleDateString()
                              : "No date"}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-6">
                        <div className="text-xs text-gray-500">
                          {task.createdAt && (
                            <span className="flex items-center">
                              <Clock className="mr-1 w-3 h-3" />
                              {typeof getDaysAgo(task.createdAt) === "string"
                                ? getDaysAgo(task.createdAt)
                                : `${getDaysAgo(task.createdAt)} ${
                                    getDaysAgo(task.createdAt) === 1
                                      ? "day"
                                      : "days"
                                  } ago`}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-end space-x-2">
                          {task.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleViewDetails(task.id?.toString() || "")
                                }
                                className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-green-600 border border-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() =>
                                  handleStartCollection(
                                    task.id?.toString() || ""
                                  )
                                }
                                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer"
                              >
                                Start Collection
                              </button>
                            </>
                          )}
                          {task.status === "in_progress" &&
                            task.collectorId === user?.id && (
                              <button
                                onClick={() => setSelectedTask(task)}
                                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer"
                              >
                                Complete & Verify
                              </button>
                            )}
                          {task.status === "in_progress" &&
                            task.collectorId !== user?.id && (
                              <span className="text-sm font-medium text-yellow-600">
                                In progress by another collector
                              </span>
                            )}
                          {task.status === "verified" && (
                            <span className="flex items-center text-sm font-medium text-green-600">
                              <CheckCircle className="mr-1 w-4 h-4" />
                              Reward Earned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pageCount > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 cursor-pointer hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, pageCount))
                  }
                  disabled={currentPage === pageCount}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 cursor-pointer hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div className="fixed inset-0 backdrop-blur-sm bg-black/70" />

          {/* Modal Container - Fixed height */}
          <div className="overflow-hidden relative w-full max-w-md bg-white rounded-xl shadow-2xl animate-slideUp">
            {/* Modal Header - Compact */}
            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Verify Collection
                </h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 text-gray-400 rounded-full transition-colors cursor-pointer hover:text-gray-500 hover:bg-gray-100"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - Fixed height with scrolling if needed */}
            <div className="p-4 max-h-[50vh] overflow-y-auto">
              {/* Upload Section */}
              <div className="mb-4">
                <label
                  htmlFor="verification-image"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Upload Verification Photo
                </label>
                <div className="flex justify-center px-4 py-6 rounded-lg border-2 border-gray-300 border-dashed transition-colors hover:border-green-500">
                  <div className="text-center">
                    <Upload className="mx-auto w-8 h-8 text-gray-400" />
                    <div className="mt-2 text-sm text-gray-600">
                      <label
                        htmlFor="verification-image"
                        className="relative font-medium text-green-600 rounded-md cursor-pointer hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2"
                      >
                        <span>Upload a file</span>
                        <input
                          id="verification-image"
                          name="verification-image"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Section - Fixed height */}
              {preview && (
                <div className="overflow-hidden mb-4 h-40 rounded-lg border border-gray-200 shadow-sm">
                  <img
                    src={preview}
                    alt="Verification preview"
                    className="object-contain w-full h-full"
                  />
                </div>
              )}

              {/* Verification Status Messages */}
              {verificationStatus === "success" && verificationResult && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Verification Successful
                      </h3>
                      <p className="mt-1 text-xs text-green-700">
                        Your collection has been verified successfully.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {verificationStatus === "failure" && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Verification Failed
                      </h3>
                      <p className="mt-1 text-xs text-red-700">
                        Please try again with a clearer image.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex justify-end p-4 space-x-3 border-t border-gray-200">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 transition-colors cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={!file || verificationStatus === "verifying"}
                className={`flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-300 ${
                  !file
                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                    : "text-white bg-green-600 shadow-sm cursor-pointer hover:bg-green-700"
                }`}
              >
                {verificationStatus === "verifying" ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-b-2 border-white animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verify</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
