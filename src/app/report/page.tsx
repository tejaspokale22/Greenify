"use client";
import { useState, useEffect } from "react";
import { MapPin, Upload, CheckCircle, Loader } from "lucide-react";
import {
  getUserByEmail,
  createReport,
  getRecentReports,
} from "@/db/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export default function ReportPage() {
  if (typeof window === "undefined") return null; // Prevents SSR issues
  const storedData = localStorage.getItem("userData");
  const [userData, setUserData] = useState<any>(storedData ? JSON.parse(storedData) : null);
  const router = useRouter();

  const [reports, setReports] = useState<
    Array<{
      id: number;
      location: string;
      wasteType: string;
      amount: string;
      createdAt: string;
    }>
  >([]);

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
    setNewReport({ ...newReport, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
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
                    - Identify the type of waste (e.g., plastic, paper, glass, metal, organic, hazardous, mixed, etc.).
                    - Estimate the quantity in kg or liters.
                    - Assess your confidence level as a number between 0 and 1.
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
                      "wasteType": "Plastic waste",
                      "quantity": "Approximately 150 kg",
                      "confidence": 0.85,
                      "decompositionTime": "100-1000 years",
                      "commonSources": "Give this information in a Paragraph",
                      "environmentalImpact": "Plastic waste takes hundreds of years to degrade, pollutes oceans, and harms wildlife. It breaks down into microplastics, which enter the food chain and pose risks to human health.",
                      "healthHazards": "Burning plastic releases toxic chemicals that cause respiratory diseases. Microplastics can accumulate in human organs and disrupt biological functions.",
                      "carbonFootprint": "Plastic production and waste contribute to high CO₂ emissions due to petroleum-based raw materials.",
                      "economicImpact": "Poor plastic waste management leads to high cleanup costs. However, recycling creates jobs and reduces raw material demand.",
                      "wasteReductionStrategies": "Reduce single-use plastics, promote biodegradable alternatives, and improve recycling infrastructure.",
                      "recyclingDisposalMethods": "Plastic can be sorted, shredded, and reprocessed into new products. Advanced methods like pyrolysis convert plastic into fuel. Reducing single-use plastics is also key to waste management.",
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
        const parsedResult = JSON.parse(jsonText);

        if (parsedResult.wasteType && parsedResult.quantity && parsedResult.confidence) {
          const report={
            location:newReport.location,
            wasteType:parsedResult.wasteType,
            amount:parsedResult.quantity,
            imageUrl:preview,
            verificationResult:{
              decompositionTime:parsedResult.decompositionTime,
              commonSources:parsedResult.commonSources,
              environmentalImpact:parsedResult.environmentalImpact,
              healthHazards:parsedResult.healthHazards,
              carbonFootprint:parsedResult.carbonFootprint,
              economicImpact:parsedResult.economicImpact,
              wasteReductionStrategies:parsedResult.wasteReductionStrategies,
              recyclingDisposalMethods:parsedResult.recyclingDisposalMethods,
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

      const formattedReport = {
        id: report.id,
        location: report.location,
        wasteType: report.wasteType,
        amount: report.amount,
        createdAt: report.createdAt.toISOString().split("T")[0],
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
      
      router.push('/dashboard');
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // useEffect(() => {
  //   const checkUser = async () => {
  //     const user = localStorage.getItem('userData');
  //     if (user) {
  //       setUser(JSON.parse(user));
  //       const recentReports = await getRecentReports();
  //       const formattedReports = recentReports.map(report => ({
  //         ...report,
  //         createdAt: report.createdAt.toISOString().split('T')[0]
  //       }));
  //       setReports(formattedReports);
  //     } else {
  //       router.push('/');
  //     }
  //   };
  //   checkUser();
  // }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
      <div className="w-full px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Report Waste
          </h1>
          <p className="text-lg text-gray-600">
            Help us keep our environment clean by reporting waste in your area
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-8 space-y-8 mb-12"
        >
          {/* Image Upload Section */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Upload Image
              </h2>
              <p className="text-gray-600">
                Take or upload a photo of the waste
              </p>
            </div>

            <div className="relative group">
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl group-hover:border-green-500 transition-all duration-300 bg-gray-50 group-hover:bg-gray-100">
                <div className="space-y-2 text-center">
                  <Upload className="mx-auto h-16 w-16 text-gray-400 group-hover:text-green-500 transition-colors duration-300" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="waste-image"
                      className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2"
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
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {preview && (
              <div className="mt-6 rounded-xl overflow-hidden shadow-lg border border-gray-200">
                <div className="relative aspect-video">
                  <img
                    src={preview}
                    alt="Waste preview"
                    className="w-full h-full object-contain bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={!file || verificationStatus === "verifying"}
            className={`mx-auto w-full flex items-center justify-center px-8 py-3 text-lg font-medium rounded-xl transition-all duration-300 ${
              !file
                ? "bg-gray-200 text-gray-500"
                : "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl cursor-pointer"
            }`}
          >
            {verificationStatus === "verifying" ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Analyzing Waste...
              </>
            ) : (
              "Analyze Waste"
            )}
          </button>

          {verificationStatus === "success" && verificationResult && (
            <div className="bg-white border border-green-200 rounded-xl shadow-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Analysis Complete
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">Waste Type</p>
                      <p className="text-lg font-medium text-gray-900">
                        {verificationResult.wasteType}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">Quantity</p>
                      <p className="text-lg font-medium text-gray-900">
                        {verificationResult.quantity}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">Confidence</p>
                      <p className="text-lg font-medium text-gray-900">
                        {(verificationResult.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Waste Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Location (Google Maps URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="location"
                    name="location"
                    value={newReport.location}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    placeholder="Paste Google Maps location URL"
                  />
                  <button
                    type="button"
                    onClick={() => window.open('https://www.google.com/maps', '_blank')}
                    className="px-4 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors duration-300 flex items-center gap-2 cursor-pointer" 
                  >
                    <MapPin className="w-5 h-5" />
                    Open Maps
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Click 'Open Maps' to find your location, then share and copy the URL
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 mb-2"
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-700"
                    placeholder="Verified waste type"
                    readOnly
                  />
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 mb-2"
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-700"
                    placeholder="Verified amount"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !verificationResult}
              className={`mx-auto w-full mt-10 flex items-center justify-center px-8 py-3 text-lg font-medium rounded-xl transition-all duration-300 ${
                !verificationResult
                  ? "bg-gray-200 text-gray-500"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl cursor-pointer"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Submitting Report...
                </>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </form>

        {/* Recent Reports */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Recent Reports
          </h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-sm text-gray-900">
                            {report.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {report.wasteType}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {report.amount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {report.createdAt}
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No reports yet. Be the first to report waste!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
