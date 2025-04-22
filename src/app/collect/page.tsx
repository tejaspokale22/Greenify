"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  MapPin,
  CheckCircle,
  Clock,
  Upload,
  Calendar,
  Weight,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getWasteCollectionTasks,
  createCollectedWaste,
  updateTaskStatus,
  updateRewardPoints,
  createNotification,
} from "@/db/actions";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import Image from "next/image";

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const ITEMS_PER_PAGE = 5;

interface Task {
  id: number;
  userId: string;
  location: string;
  wasteType: string;
  amount: string;
  status: string;
  collectorId: string | null;
  verificationResult: CollectedWaste | null;
  imageUrl: string | null;
  createdAt: Date;
  date?: string;
}

interface VerificationDetails {
  sameLocation: boolean;
  firstImageHasWaste: boolean;
  cleanupStatus: string;
  wasteType: string;
  comments: string;
}

interface CollectedWaste {
  id: number;
  status: string;
  collectorId: string;
  reportId: number;
  collectionDate: Date;
  comment: string | null;
}

interface User {
  id: string;
  clerkId: string;
  name: string;
  email: string;
}

interface FetchedTask {
  id: number;
  userId: string;
  location: string;
  wasteType: string;
  amount: string;
  status: string;
  collectorId: string | null;
  verificationResult: unknown;
  imageUrl: string | null;
  date: string;
}

export default function CollectPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hoveredWasteType, setHoveredWasteType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "failure">("idle");
  const [verificationResult, setVerificationResult] = useState<CollectedWaste | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<VerificationDetails | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getDaysAgo = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
        if (!selectedFile.type.startsWith("image/")) {
          toast.error("Please upload an image file");
          return;
        }
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
    if (!dataUrl) return null;
    const [meta, base64] = dataUrl.split(",");
    const mimeType = meta.match(/data:(.*);base64/)?.[1] || "image/jpeg";
    return { base64, mimeType };
  };

  const filteredTasks = tasks
    .filter((task) =>
      task.location.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);

  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await getWasteCollectionTasks();
        const mappedTasks = fetchedTasks.map((task: FetchedTask) => ({
          id: task.id,
          userId: task.userId,
          location: task.location,
          wasteType: task.wasteType,
          amount: task.amount,
          status: task.status,
          collectorId: task.collectorId || null,
          verificationResult: task.verificationResult as CollectedWaste | null,
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

    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUser(parsedUserData);
    }
    fetchTasks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleVerify = async () => {
    if (!file || !selectedTask) {
      toast.error("Please upload a verification image.");
      return;
    }

    setVerificationStatus("verifying");
    setVerificationDetails(null);

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
        const parsedResult = JSON.parse(jsonText) as VerificationDetails;
        setVerificationDetails(parsedResult);

        const {
          sameLocation,
          firstImageHasWaste,
          cleanupStatus,
          comments,
        } = parsedResult;

        if (sameLocation && firstImageHasWaste && cleanupStatus === "fully cleaned") {
          if (!user?.clerkId) {
            toast.error("User not authenticated");
            return;
          }

          const collectedWaste = await createCollectedWaste(
            selectedTask.id,
            user.clerkId,
            comments
          );

          if (collectedWaste) {
            const updatedReport = await updateTaskStatus(
              selectedTask.id,
              "verified",
              user.clerkId
            );

            if (updatedReport) {
              await updateRewardPoints(
                user.clerkId,
                50
              );

              await createNotification(
                user.clerkId,
                `You earned 50 points for successfully collecting waste at ${selectedTask.location}!`,
                "reward"
              );

              setVerificationStatus("success");
              setVerificationResult(collectedWaste);
              toast.success("Collection verified successfully! You earned 50 points!");

              setTasks((prevTasks) =>
                prevTasks.map((task) =>
                  task.id === selectedTask.id
                    ? {
                        ...task,
                        status: "verified",
                        collectorId: user.clerkId || null,
                        verificationResult: collectedWaste,
                      }
                    : task
                )
              );
            } else {
              setVerificationStatus("failure");
              toast.error("Failed to update report status. Please try again.");
            }
          } else {
            setVerificationStatus("failure");
            toast.error("Failed to verify collection. Please try again.");
          }
        } else {
          setVerificationStatus("failure");
          toast.error(
            "Verification failed. The images don&apos;t match or the waste hasn&apos;t been fully cleaned."
          );
        }
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
      tasks.find((task) => task.id?.toString() === taskId) || null
    );
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      {!isClient ? (
        <div className="flex justify-center items-center min-h-screen">
          <Loader />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Waste Collection Tasks
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 text-gray-400 transform -translate-y-1/2" size={20} />
              <input
                type="text"
                placeholder="Search by location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 pr-4 pl-10 w-full text-sm bg-white rounded-lg border border-gray-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader />
              <span className="ml-2 text-gray-600">Loading tasks...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedTasks.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-lg text-gray-500">
                    No tasks found
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    {searchTerm
                      ? "No tasks match your search criteria."
                      : "There are no waste collection tasks available."}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {paginatedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 space-y-4 bg-white rounded-lg shadow"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <MapPin className="text-gray-400" size={20} />
                          <span className="text-gray-600">See Location</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="text-gray-400" size={20} />
                          <span className="text-gray-600">
                            {task.status === "pending"
                              ? "Pending"
                              : task.status === "in_progress"
                              ? "In Progress"
                              : "Verified"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div
                          onMouseEnter={() => setHoveredWasteType(task.wasteType)}
                          onMouseLeave={() => setHoveredWasteType(null)}
                          className="block truncate cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <Trash2 className="text-gray-400" size={20} />
                            <span className="text-gray-600">{task.wasteType}</span>
                          </div>
                          {hoveredWasteType === task.wasteType && (
                            <div className="mt-1 text-sm text-gray-500">
                              {task.wasteType}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Weight className="text-gray-400" size={20} />
                          <span className="text-gray-600">
                            {task.amount || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="text-gray-400" size={20} />
                          <span className="text-gray-600">
                            {task.createdAt
                              ? task.createdAt.toLocaleDateString()
                              : "No date"}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {task.createdAt && (
                            <span>
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

                        <div className="flex items-center space-x-2">
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
                              <span className="text-sm text-gray-500">
                                In progress by another collector...
                              </span>
                            )}
                          {task.status === "verified" && (
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="text-green-500" size={20} />
                              <span className="text-green-600">Reward Earned</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pageCount > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 cursor-pointer hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {pageCount}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
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
      )}

      {selectedTask && (
        <div className="overflow-y-auto fixed inset-0 z-50">
          <div className="flex justify-center items-center px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setSelectedTask(null)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block overflow-hidden text-left align-bottom bg-white rounded-lg shadow-xl transition-all transform sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Verify Collection
                  </h2>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-1 text-gray-400 rounded-full transition-colors cursor-pointer hover:text-gray-500 hover:bg-gray-100"
                    aria-label="Close modal"
                  >
                    <svg
                      className="w-6 h-6"
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

                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-700">
                      Original Image
                    </h3>
                    {selectedTask.imageUrl && (
                      <div className="overflow-hidden relative rounded-lg aspect-video">
                        <Image
                          src={selectedTask.imageUrl}
                          alt="Original waste"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-700">
                      Upload Verification Photo
                    </h3>
                    <div className="flex justify-center px-6 pt-5 pb-6 mt-1 rounded-lg border-2 border-gray-300 border-dashed">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto w-12 h-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative font-medium text-green-600 bg-white rounded-md cursor-pointer hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {preview && (
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-gray-700">
                        Verification Image
                      </h3>
                      <div className="overflow-hidden relative rounded-lg aspect-video">
                        <Image
                          src={preview}
                          alt="Verification"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {verificationDetails && (
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-gray-700">
                        Verification Details
                      </h3>
                      <div className="p-4 space-y-2 bg-gray-50 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Same Location:</span>
                          <span className="font-medium">
                            {verificationDetails.sameLocation ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Waste Present:</span>
                          <span className="font-medium">
                            {verificationDetails.firstImageHasWaste ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cleanup Status:</span>
                          <span className="font-medium">
                            {verificationDetails.cleanupStatus}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Waste Type:</span>
                          <span className="font-medium">
                            {verificationDetails.wasteType}
                          </span>
                        </div>
                        <div className="mt-4">
                          <span className="text-gray-600">Comments:</span>
                          <p className="mt-1 text-sm text-gray-700">
                            {verificationDetails.comments}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {verificationStatus === "success" && verificationResult && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="text-green-500" size={20} />
                        <div>
                          <h4 className="text-sm font-medium text-green-800">
                            Verification Successful
                          </h4>
                          <p className="mt-1 text-sm text-green-700">
                            Your collection has been verified successfully. You&apos;ve earned a reward!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {verificationStatus === "failure" && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2">
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
                        <div>
                          <h4 className="text-sm font-medium text-red-800">
                            Verification Failed
                          </h4>
                          <p className="mt-1 text-sm text-red-700">
                            {verificationDetails
                              ? "The verification criteria were not met. Please ensure the images are from the same location and the waste has been fully cleaned."
                              : "Please try again with a clearer image."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleVerify}
                  disabled={!file || verificationStatus === "verifying"}
                  className="inline-flex justify-center px-4 py-2 w-full text-base font-medium text-white bg-green-600 rounded-md border border-transparent shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verificationStatus === "verifying" ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4">
                        <Loader />
                      </div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify"
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setVerificationStatus("idle");
                    setVerificationDetails(null);
                    setFile(null);
                    setPreview(null);
                  }}
                  className="inline-flex justify-center px-4 py-2 mt-3 w-full text-base font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {verificationStatus === "success" ||
                  verificationStatus === "failure"
                    ? "Close"
                    : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
