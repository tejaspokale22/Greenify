import React, { ReactNode } from 'react';
import Image from 'next/image';
import { FaRecycle, FaRobot, FaChartLine, FaLeaf, FaCheckCircle, FaLightbulb, FaHandshake } from 'react-icons/fa';

const AboutPage = () => {
  return (
    <div className="pt-12 min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="pb-12 text-4xl font-bold text-green-800 md:text-5xl">
            Revolutionizing Waste Management with AI
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            We're on a mission to make waste management smarter, more efficient, and environmentally friendly through cutting-edge artificial intelligence technology.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="px-4 py-16 bg-white md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 items-center md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-green-700">Our Mission</h2>
              <p className="mb-4 text-gray-600">
                At Greenify, we believe that sustainable waste management is crucial for our planet's future. Our AI-powered platform helps businesses and communities optimize their waste collection, recycling processes, and environmental impact.
              </p>
              <p className="text-gray-600">
                By leveraging artificial intelligence and data analytics, we're creating a more sustainable world where waste is managed efficiently and resources are conserved for future generations.
              </p>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&q=80"
                alt="AI-powered waste management"
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-green-50 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-3xl font-bold text-center text-green-700">Our Key Features</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<FaRobot className="text-4xl text-green-600" />}
              title="AI-Powered Sorting"
              description="Advanced algorithms that identify and sort different types of waste materials automatically."
            />
            <FeatureCard
              icon={<FaChartLine className="text-4xl text-green-600" />}
              title="Smart Analytics"
              description="Data-driven insights to optimize waste collection routes and resource allocation."
            />
            <FeatureCard
              icon={<FaRecycle className="text-4xl text-green-600" />}
              title="Recycling Optimization"
              description="Maximize recycling rates with intelligent processing and material recovery systems."
            />
            <FeatureCard
              icon={<FaLeaf className="text-4xl text-green-600" />}
              title="Environmental Impact"
              description="Track and reduce your carbon footprint with our comprehensive environmental monitoring."
            />
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="px-4 py-16 bg-white md:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-3xl font-bold text-center text-green-700">Why Choose Greenify</h2>
          
          {/* Stats Grid */}
          <div className="grid gap-8 mb-16 md:grid-cols-3">
            <div className="p-6 text-center bg-green-50 rounded-lg">
              <div className="mb-2 text-4xl font-bold text-green-700">85%</div>
              <p className="text-gray-600">Increase in Recycling Efficiency</p>
            </div>
            <div className="p-6 text-center bg-green-50 rounded-lg">
              <div className="mb-2 text-4xl font-bold text-green-700">40%</div>
              <p className="text-gray-600">Reduction in Operational Costs</p>
            </div>
            <div className="p-6 text-center bg-green-50 rounded-lg">
              <div className="mb-2 text-4xl font-bold text-green-700">500+</div>
              <p className="text-gray-600">Businesses Trust Our Solution</p>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid gap-8 md:grid-cols-3">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <FaCheckCircle className="mr-3 text-2xl text-green-600" />
                <h3 className="text-xl font-semibold text-green-700">Proven Technology</h3>
              </div>
              <p className="text-gray-600">Our AI algorithms have been tested and refined through thousands of real-world applications, delivering consistent results.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <FaLightbulb className="mr-3 text-2xl text-green-600" />
                <h3 className="text-xl font-semibold text-green-700">Innovative Solutions</h3>
              </div>
              <p className="text-gray-600">Stay ahead of the curve with our cutting-edge technology that adapts to new waste management challenges.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <FaHandshake className="mr-3 text-2xl text-green-600" />
                <h3 className="text-xl font-semibold text-green-700">Dedicated Support</h3>
              </div>
              <p className="text-gray-600">Our expert team provides 24/7 support and regular updates to ensure your waste management system runs smoothly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 text-white bg-green-700 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-3xl font-bold">Join Us in Making a Difference</h2>
          <p className="mb-8 text-xl">
            Together, we can create a more sustainable future through intelligent waste management.
          </p>
          <button className="px-8 py-3 font-bold text-green-700 bg-white rounded-full transition duration-300 hover:bg-green-50">
            Get Started Today
          </button>
        </div>
      </section>
    </div>
  );
};

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

interface TeamMemberProps {
  name: string;
  role: string;
  image: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md transition duration-300 hover:shadow-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-green-700">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const TeamMember = ({ name, role, image }: TeamMemberProps) => {
  return (
    <div className="text-center">
      <div className="overflow-hidden relative mx-auto mb-4 w-48 h-48 rounded-full">
        <Image
          src={image}
          alt={name}
          fill
          style={{ objectFit: 'cover' }}
        />
      </div>
      <h3 className="text-xl font-semibold text-green-700">{name}</h3>
      <p className="text-gray-600">{role}</p>
    </div>
  );
};

export default AboutPage;
