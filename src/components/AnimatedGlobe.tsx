import { Leaf } from "lucide-react";

export default function AnimatedGlobe() {
    return (
      <div className="relative mx-auto mb-8 w-20 h-20">
        <div className="absolute inset-0 bg-green-600 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute inset-2 bg-green-400 rounded-full opacity-40 animate-ping"></div>
        <div className="absolute inset-4 bg-green-300 rounded-full opacity-60 animate-spin"></div>
        <div className="absolute inset-6 bg-green-200 rounded-full opacity-80 animate-bounce"></div>
        <Leaf className="absolute inset-0 m-auto w-10 h-10 text-green-600 animate-pulse" />
      </div>
    )
  }