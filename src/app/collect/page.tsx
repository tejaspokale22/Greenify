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
import type { Report } from "@/lib/types";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";
import Image from "next/image";

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const ITEMS_PER_PAGE = 5;

export default function CollectPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hoveredWasteType, setHoveredWasteType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState("idle");
  const [verificationResult, setVerificationResult] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);

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

  const handleFileChange = (e: React.ChangeEvent) => {
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

  const readFileAsBase64 = (file: File): Promise => {
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
        const mappedTasks = fetchedTasks.map((task: any) => ({
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
        const parsedResult = JSON.parse(jsonText);
        setVerificationDetails(parsedResult);

        const {
          sameLocation,
          firstImageHasWaste,
          cleanupStatus,
          comments,
        } = parsedResult;

        // @ts-ignore
        if (sameLocation && firstImageHasWaste && cleanupStatus === "fully cleaned") {
          const collectedWaste = await createCollectedWaste(
            selectedTask.id,
            // @ts-ignore
            (user as any).clerkId,
            comments
          );

          if (collectedWaste) {
            const updatedReport = await updateTaskStatus(
              selectedTask.id,
              "verified",
              // @ts-ignore
              (user as any).clerkId
            );

            if (updatedReport) {
              await updateRewardPoints(
                // @ts-ignore
                (user as any).clerkId,
                50
              );

              await createNotification(
                // @ts-ignore
                (user as any).clerkId,
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
                        // @ts-ignore
                        collectorId: (user as any).clerkId,
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
            "Verification failed. The images don't match or the waste hasn't been fully cleaned."
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
      tasks.find((task: Report) => task.id?.toString() === taskId) || null
    );
  };
  return (
  <>
    {!isClient ? null : (
      <div>
        <h2 className="text-xl font-bold mb-4">Waste Collection Tasks</h2>

        <input
          type="text"
          placeholder="Search tasks..."
          onChange={(e) => setSearchTerm(e.target.value)}
          className="py-2 pr-4 pl-10 w-full text-sm bg-white rounded-lg border border-gray-300 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
        />

        {loading ? (
          <p>Loading tasks...</p>
        ) : paginatedTasks.length === 0 ? (
          <div>
            <h3>No tasks found</h3>
            <p>
              {searchTerm
                ? "No tasks match your search criteria."
                : "There are no waste collection tasks available."}
            </p>
          </div>
        ) : (
          <>
            {paginatedTasks.map((task) => (
              <div key={task.id} className="border p-4 rounded mb-4">
                <div className="flex justify-between items-center mb-2">
                  <button
                    className="text-blue-600 underline"
                    onClick={() => console.log('See location')}
                  >
                    See Location
                  </button>
                  <span>
                    {task.status === "pending"
                      ? "Pending"
                      : task.status === "in_progress"
                      ? "In Progress"
                      : "Verified"}
                  </span>
                </div>

                <div
                  onMouseEnter={() => setHoveredWasteType(task.wasteType)}
                  onMouseLeave={() => setHoveredWasteType(null)}
                  className="block truncate cursor-pointer"
                >
                  {task.wasteType}
                </div>

                {hoveredWasteType === task.wasteType && (
                  <div className="text-sm text-gray-500">{task.wasteType}</div>
                )}

                <div>{task.amount || "N/A"}</div>
                <div>{task.createdAt ? task.createdAt.toLocaleDateString() : "No date"}</div>

                {task.createdAt && (
                  <div>
                    {typeof getDaysAgo(task.createdAt) === "string"
                      ? getDaysAgo(task.createdAt)
                      : `${getDaysAgo(task.createdAt)} ${
                          getDaysAgo(task.createdAt) === 1 ? "day" : "days"
                        } ago`}
                  </div>
                )}

                {task.status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleViewDetails(task.id?.toString() || "")}
                      className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-green-600 border border-green-600 hover:bg-green-50"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleStartCollection(task.id?.toString() || "")}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Start Collection
                    </button>
                  </div>
                )}

                {task.status === "in_progress" && task.collectorId === (user as any)?.id && (
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Complete & Verify
                  </button>
                )}

                {task.status === "in_progress" && task.collectorId !== (user as any)?.id && (
                  <div>In progress by another collector...</div>
                )}

                {task.status === "verified" && (
                  <div>Reward Earned</div>
                )}
              </div>
            ))}

            {pageCount > 1 && (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {pageCount}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
                  disabled={currentPage === pageCount}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )}

    {selectedTask && (
      <div>
        <h3 className="text-lg font-bold">Verify Collection</h3>
        <button
          onClick={() => setSelectedTask(null)}
          className="p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          aria-label="Close modal"
        >
          ✕
        </button>

        <div>
          <h4>Original Image</h4>
          {selectedTask.imageUrl && <img src={selectedTask.imageUrl} alt="Original" />}
        </div>

        <div>
          <h4>Upload Verification Photo</h4>
          <input type="file" />
        </div>

        {preview && (
          <div>
            <h4>Verification Image</h4>
            <img src={preview} alt="Preview" />
          </div>
        )}

        {verificationDetails && (
          <div>
            <p>Same Location: {verificationDetails.sameLocation ? "Yes" : "No"}</p>
            <p>Waste Present: {verificationDetails.firstImageHasWaste ? "Yes" : "No"}</p>
            <p>Cleanup Status: {verificationDetails.cleanupStatus}</p>
            <p>Waste Type: {verificationDetails.wasteType}</p>
            <p>{verificationDetails.comments}</p>
          </div>
        )}

        {verificationStatus === "success" && verificationResult && (
          <div>
            <h4>Verification Successful</h4>
            <p>Your collection has been verified successfully. You've earned a reward!</p>
          </div>
        )}

        {verificationStatus === "failure" && (
          <div>
            <h4>Verification Failed</h4>
            <p>
              {verificationDetails
                ? "The verification criteria were not met. Please ensure the images are from the same location and the waste has been fully cleaned."
                : "Please try again with a clearer image."}
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              setSelectedTask(null);
              setVerificationStatus("idle");
              setVerificationDetails(null);
              setFile(null);
              setPreview(null);
            }}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300"
          >
            {verificationStatus === "success" || verificationStatus === "failure"
              ? "Close"
              : "Cancel"}
          </button>

          {verificationStatus !== "success" && verificationStatus !== "failure" && (
            <button
              onClick={handleVerification}
              className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              {verificationStatus === "verifying" ? "Verifying..." : "Verify"}
            </button>
          )}
        </div>
      </div>
    )}
  </>
);
}
