// app/about/page.tsx
import Image from 'next/image';
import { ReactNode } from 'react';
import {
  FaRecycle,
  FaRobot,
  FaChartLine,
  FaLeaf,
  FaCheckCircle,
  FaLightbulb,
  FaHandshake,
} from 'react-icons/fa';

export default function AboutPage() {
  return (
    <div className="pt-12 min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-20 text-center md:px-8">
        <h1 className="mb-6 text-4xl font-bold text-green-800 md:text-5xl">
          Revolutionizing Waste Management with AI
        </h1>
        <p className="mx-auto max-w-3xl text-xl text-gray-600">
          We&apos;re on a mission to make waste management smarter, more efficient, and environmentally friendly through cutting-edge artificial intelligence technology.
        </p>
      </section>

      {/* Mission Section */}
      <section className="px-4 py-16 bg-white md:px-8">
        <div className="grid gap-12 items-center mx-auto max-w-6xl md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-3xl font-bold text-green-700">Our Mission</h2>
            <p className="mb-4 text-gray-600">
              At Greenify, we believe sustainable waste management is key to a better future. Our AI-powered platform helps optimize collection, recycling, and environmental reporting.
            </p>
            <p className="text-gray-600">
              Using data analytics, we help communities conserve resources and manage waste intelligently.
            </p>
          </div>
          <div className="relative h-[400px] rounded-lg overflow-hidden shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&q=80"
              alt="AI-powered waste management"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-green-50 md:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="mb-12 text-3xl font-bold text-green-700">Our Key Features</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={<FaRobot />} title="AI-Powered Sorting" description="Smart algorithms auto-sort waste materials by type." />
            <FeatureCard icon={<FaChartLine />} title="Smart Analytics" description="Optimize routes and resource use with real-time data." />
            <FeatureCard icon={<FaRecycle />} title="Recycling Optimization" description="Boost recycling with intelligent recovery systems." />
            <FeatureCard icon={<FaLeaf />} title="Environmental Impact" description="Track carbon footprint and sustainability goals." />
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="px-4 py-16 bg-white md:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="mb-12 text-3xl font-bold text-green-700">Why Choose Greenify</h2>

          <div className="grid gap-8 mb-16 md:grid-cols-3">
            <StatBlock value="85%" label="Increase in Recycling Efficiency" />
            <StatBlock value="40%" label="Reduction in Operational Costs" />
            <StatBlock value="500+" label="Businesses Trust Our Solution" />
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <BenefitCard icon={<FaCheckCircle />} title="Proven Technology" description="Field-tested algorithms with consistent results." />
            <BenefitCard icon={<FaLightbulb />} title="Innovative Solutions" description="AI tools that adapt to new waste challenges." />
            <BenefitCard icon={<FaHandshake />} title="Dedicated Support" description="24/7 assistance and regular updates from our team." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center text-white bg-green-700 md:px-8">
        <h2 className="mb-4 text-3xl font-bold">Join Us in Making a Difference</h2>
        <p className="mb-8 text-xl">Together, we can build a greener, cleaner world through AI-driven waste management.</p>
        <button className="px-8 py-3 font-bold text-green-700 bg-white rounded-full transition hover:bg-green-100">
          Get Started Today
        </button>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 text-center bg-white rounded-lg shadow-md transition hover:shadow-lg">
      <div className="mb-4 text-4xl text-green-600">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-green-700">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function BenefitCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 text-left bg-white rounded-lg shadow-md">
      <div className="flex items-center mb-4 text-2xl text-green-600">
        {icon}
        <h3 className="ml-3 text-xl font-semibold text-green-700">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-6 text-center bg-green-50 rounded-lg">
      <div className="mb-2 text-4xl font-bold text-green-700">{value}</div>
      <p className="text-gray-600">{label}</p>
    </div>
  );
}
