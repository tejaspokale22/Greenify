"use client";
import { useState, useEffect } from "react";
import { MapPin, Upload, CheckCircle, Package } from "lucide-react";
import { createReport, getRecentReports } from "@/db/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Report } from "@/lib/types";

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export default function ReportPage() {
  if (typeof window === "undefined") return null; // Prevents SSR issues

  const storedData = localStorage.getItem("userData");
  const [userData, setUserData] = useState<any>(
    storedData ? JSON.parse(storedData) : null
  );
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  console.log(reports);

  const [isLoadingReports, setIsLoadingReports] = useState(true);

  const [newReport, setNewReport] = useState({
    location: "",
    type: "",
    amount: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "failure"
  >("idle");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Validate location URL if it's a location input
    if (name === "location" && value) {
      try {
        new URL(value); // This will throw if URL is invalid
      } catch {
        toast.error("Please enter a valid URL");
        return;
      }
    }

    setNewReport({ ...newReport, [name]: value });
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

  const handleVerify = async () => {
    if (!file) {
      toast.error("No file selected");
      return;
    }

    setVerificationStatus("verifying");

    try {
      const base64Data = await readFileAsBase64(file);
      const imageData = base64Data.split(",")[1];

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
                    text: `You are an expert in waste management, environmental sustainability, and recycling. Analyze the provided image and classify the waste.

                    Instructions:
                    - If the image is not related to waste, return false.
                    - Identify the type of waste (e.g., plastic, paper, glass, metal, organic, hazardous, mixed, etc.).
                    - Estimate the quantity in kg or liters.
                    - Provide detailed information on the following aspects:
                    
                      1. Decomposition Time: How long this waste takes to degrade in the environment.
                      2. Common Sources: Where this type of waste typically originates.
                      3. Environmental Impact: How this waste affects nature, pollution, and wildlife.
                      4. Health Hazards: Risks for humans, such as toxicity, infections, or air pollution.
                      5. Carbon Footprint: Contribution to CO₂ emissions and climate change.
                      6. Economic Impact: The financial burden or benefits of managing this waste.
                      7. Waste Reduction Strategies: How to minimize the generation of this waste.
                      8. Recycling/Disposal Methods: Best practices for handling, recycling, or safely disposing of this waste.
                      9. Legislation & Regulations: Any existing laws or guidelines related to proper waste disposal.
                    
                    Response Format:
                    Return ONLY a valid JSON object without any explanations or extra text. Example output:
                    
                    {
                      "imageType": true if related to waste and false if not related to waste,
                      "wasteType": "Plastic waste",
                      "quantity": "Approximately 150 kg",
                      "decompositionTime": "100-1000 years",
                      "commonSources": "Give this information in a Paragraph",
                      "environmentalImpact": "Plastic waste takes hundreds of years to degrade, pollutes oceans, and harms wildlife. It breaks down into microplastics, which enter the food chain and pose risks to human health.",
                      "healthHazards": "Burning plastic releases toxic chemicals that cause respiratory diseases. Microplastics can accumulate in human organs and disrupt biological functions.",
                      "carbonFootprint": "Plastic production and waste contribute to high CO₂ emissions due to petroleum-based raw materials.",
                      "economicImpact": "Poor plastic waste management leads to high cleanup costs. However, recycling creates jobs and reduces raw material demand.",
                      "wasteReductionStrategies": "Reduce single-use plastics, promote biodegradable alternatives, and improve recycling infrastructure.",
                      "recyclingDisposalMethods": "Plastic can be sorted, shredded, and reprocessed into new products. Advanced methods like pyrolysis convert plastic into fuel. Reducing single-use plastics is also key to waste management."
                    }
                    Give all keys info in a Paragraph or string format.
                    Give each content in very detailed and long format excluding wasteType, confidence and quantity.
                    Ensure the response strictly follows this JSON format without additional text or explanations.`,
                  },
                  {
                    inline_data: {
                      mime_type: file.type,
                      data: imageData,
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
        throw new Error(
          `API Error: ${result.error?.message || "Unknown error"}`
        );
      }

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Invalid response format from Gemini API");
      }
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : null;
      if (jsonText) {
        // Clean the JSON string before parsing
        const cleanedJson = jsonText
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/(\w+):/g, '"$1":') // Add quotes around property names
          .replace(/,\s*}/g, "}") // Remove trailing commas
          .replace(/,\s*]/g, "]"); // Remove trailing commas in arrays

        try {
          const parsedResult = JSON.parse(cleanedJson);
          console.log(parsedResult);

          if (parsedResult.imageType === false) {
            toast.error("Please upload an image related to waste.");
            return;
          }

          if (parsedResult.wasteType && parsedResult.quantity) {
            const report = {
              location: newReport.location,
              wasteType: parsedResult.wasteType,
              amount: parsedResult.quantity,
              imageUrl: preview,
              verificationResult: {
                decompositionTime: parsedResult.decompositionTime,
                commonSources: parsedResult.commonSources,
                environmentalImpact: parsedResult.environmentalImpact,
                healthHazards: parsedResult.healthHazards,
                carbonFootprint: parsedResult.carbonFootprint,
                economicImpact: parsedResult.economicImpact,
                wasteReductionStrategies: parsedResult.wasteReductionStrategies,
                recyclingDisposalMethods: parsedResult.recyclingDisposalMethods,
              },
            };
            setVerificationResult(report);
            setVerificationStatus("success");
            setNewReport({
              ...newReport,
              type: parsedResult.wasteType,
              amount: parsedResult.quantity,
            });
          } else {
            console.error("Invalid verification result:", parsedResult);
            setVerificationStatus("failure");
            toast.error("Could not analyze the waste image properly");
          }
        } catch (error) {
          console.error("Error parsing verification result:", error);
          setVerificationStatus("failure");
          toast.error("Failed to parse verification result");
        }
      } else {
        throw new Error("Failed to extract JSON from response");
      }
    } catch (error) {
      console.error("Error verifying waste:", error);
      setVerificationStatus("failure");
      toast.error((error as string) || "Failed to verify waste image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationStatus !== "success" || !userData) {
      toast.error("Please verify the waste before submitting or log in.");
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await createReport(
        userData.clerkId,
        newReport.location,
        newReport.type,
        newReport.amount,
        preview,
        verificationResult.verificationResult
      );

      // Create a properly typed report object
      const formattedReport: Report = {
        id: report.id,
        userId: userData.clerkId,
        location: report.location,
        wasteType: report.wasteType,
        amount: report.amount,
        imageUrl: preview || "",
        verificationResult: verificationResult.verificationResult,
        status: "pending",
        createdAt: new Date(),
        collectorId: null,
      };

      setReports([formattedReport, ...reports]);
      setNewReport({ location: "", type: "", amount: "" });
      setFile(null);
      setPreview(null);
      setVerificationStatus("idle");
      setVerificationResult(null);

      toast.success(
        `Report submitted successfully! You've earned points for reporting waste.`
      );

      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchRecentReports = async () => {
      try {
        setIsLoadingReports(true);
        const recentReports = await getRecentReports(5); // Fetch 5 most recent reports
        setReports(recentReports as Report[]);
      } catch (error) {
        console.error("Error fetching recent reports:", error);
        toast.error("Failed to load recent reports");
      } finally {
        setIsLoadingReports(false);
      }
    };

    fetchRecentReports();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="px-4 py-12 mx-auto max-w-6xl sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold text-gray-900">
            Report Waste
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Help us keep our environment clean by reporting waste in your area.
            Your contribution makes a difference.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Image Upload Card */}
          <div className="p-8 bg-white rounded-2xl shadow-lg">
            <div className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-gray-800">
                Upload Waste Image
              </h2>
              <p className="text-gray-600">
                Take a clear photo of the waste to help us analyze it accurately
              </p>
            </div>

            <div className="space-y-8">
              {/* Upload Area */}
              <div className="relative group">
                <div className="flex justify-center px-8 py-12 bg-gray-50 rounded-xl border-2 border-gray-300 border-dashed transition-all duration-300 group-hover:border-green-500 group-hover:bg-gray-100">
                  <div className="space-y-4 text-center">
                    <Upload className="mx-auto w-20 h-20 text-gray-400 transition-colors duration-300 group-hover:text-green-500" />
                    <div className="flex flex-col items-center text-sm text-gray-600">
                      <label
                        htmlFor="waste-image"
                        className="relative mb-2 font-medium text-green-600 rounded-md cursor-pointer hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2"
                      >
                        <span>Upload a file</span>
                        <input
                          id="waste-image"
                          name="waste-image"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </label>
                      <p className="text-gray-500">or drag and drop</p>
                      <p className="mt-2 text-xs text-gray-400">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Area */}
              {preview && (
                <div className="overflow-hidden mt-8 rounded-xl border border-gray-200 shadow-lg">
                  <div className="relative bg-white aspect-video">
                    <img
                      src={preview}
                      alt="Waste preview"
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              )}

              {/* Analyze Button */}
              <button
                type="button"
                onClick={handleVerify}
                disabled={!file || verificationStatus === "verifying"}
                className={`w-full flex items-center justify-center gap-3 px-8 py-4 text-lg font-medium rounded-xl transition-all duration-300 ${
                  !file
                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                    : "text-white bg-green-600 shadow-lg cursor-pointer hover:bg-green-700 hover:shadow-xl"
                }`}
              >
                {verificationStatus === "verifying" ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-b-2 border-white animate-spin"></div>
                    <span>Analyzing Waste...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Waste</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results Card */}
          {verificationStatus === "success" && verificationResult && (
            <div className="p-8 bg-white rounded-2xl shadow-lg">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="mb-6 text-2xl font-semibold text-gray-900">
                    Analysis Complete
                  </h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="mb-2 text-sm font-medium text-gray-500">
                        Waste Type
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {verificationResult.wasteType}
                      </p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="mb-2 text-sm font-medium text-gray-500">
                        Quantity
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {verificationResult.amount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location Details Card */}
          <div className="p-8 bg-white rounded-2xl shadow-lg">
            <h2 className="mb-8 text-2xl font-semibold text-gray-800">
              Location Details
            </h2>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Location Input */}
              <div className="space-y-4">
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700"
                >
                  Location (Google Maps URL)
                </label>
                <div className="flex gap-3">
                  <input
                    type="url"
                    id="location"
                    name="location"
                    value={newReport.location}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Paste Google Maps location URL"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      window.open("https://www.google.com/maps", "_blank")
                    }
                    className="flex gap-2 items-center px-6 py-3 text-green-700 bg-green-100 rounded-xl transition-colors duration-300 cursor-pointer hover:bg-green-200"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Open Maps</span>
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Click 'Open Maps' to find your location, then share and copy
                  the URL
                </p>
              </div>

              {/* Waste Details */}
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="type"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Waste Type
                  </label>
                  <input
                    type="text"
                    id="type"
                    name="type"
                    value={newReport.type}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-3 w-full text-gray-700 bg-gray-50 rounded-xl border border-gray-300"
                    placeholder="Verified waste type"
                    readOnly
                  />
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Estimated Amount
                  </label>
                  <input
                    type="text"
                    id="amount"
                    name="amount"
                    value={newReport.amount}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-3 w-full text-gray-700 bg-gray-50 rounded-xl border border-gray-300"
                    placeholder="Verified amount"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !verificationResult}
              className={`w-full mt-10 flex items-center justify-center gap-3 px-8 py-4 text-lg font-medium rounded-xl transition-all duration-300 ${
                !verificationResult
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "text-white bg-green-600 shadow-lg cursor-pointer hover:bg-green-700 hover:shadow-xl"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 rounded-full border-b-2 border-white animate-spin"></div>
                  <span>Submitting Report...</span>
                </>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </form>

        {/* Recent Reports Section */}
        <div className="mt-16">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">
            Recent Reports
          </h2>
          <div className="overflow-hidden bg-white rounded-2xl shadow-lg">
            <div className="max-h-[480px] overflow-y-auto">
              {isLoadingReports ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-5 h-5 rounded-full border-b-2 border-green-500 animate-spin"></div>
                  <span className="ml-2 text-gray-500">
                    Loading recent reports...
                  </span>
                </div>
              ) : reports.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-8 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Location
                      </th>
                      <th className="px-8 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-8 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-8 py-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr
                        key={report.id}
                        className="transition-colors duration-200 hover:bg-gray-50"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center">
                            <MapPin className="mr-3 w-5 h-5 text-green-500" />
                            <a
                              href={report.location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
                            >
                              View Location
                            </a>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-gray-900">
                          {report.wasteType}
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-gray-900">
                          {report.amount}
                        </td>
                        <td className="px-8 py-5 text-sm text-gray-500">
                          {report.createdAt
                            ? new Date(report.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center">
                  <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                  <p className="text-gray-500">
                    No reports yet. Be the first to report waste!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
