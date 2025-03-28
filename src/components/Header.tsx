"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Leaf, Menu, X } from "lucide-react";
import Link from "next/link";
import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export default function Header() {
  if (typeof window === "undefined") return null; // Prevents SSR issues
  
  const storedData = localStorage.getItem("userData");
  const [userData, setUserData] = useState<any>(storedData ? JSON.parse(storedData) : null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn, user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  useEffect(() => {
    if (isSignedIn && user) {
      const userData = {
        clerkId: user.id,
        name: user.fullName || "Unknown",
        email: user.primaryEmailAddress?.emailAddress || "No Email",
        imageUrl: user.imageUrl || "",
      };
      localStorage.setItem("userData", JSON.stringify(userData));
    } else {
      localStorage.removeItem("userData");
    }
    const userData=localStorage.getItem("userData");
    setUserData(userData);``
  }, [isSignedIn, user]);

  const handleLogin = () => {
    openSignIn({
      appearance: {
        elements: {
          rootBox: "rounded-xl",
          card: "rounded-xl",
        },
      },
      afterSignInUrl: "/", 
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-3 bg-white shadow-md">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-1">
            <Leaf className="w-10 h-10 text-green-700" />
            <span className="text-2xl font-bold text-gray-900">Greenify</span>
          </Link>

          <div className="hidden items-center space-x-8 md:flex">
            {userData && <NavLink href="/dashboard">Dashboard</NavLink>}
            <NavLink href="/about">About</NavLink>
            <NavLink href="/features">Features</NavLink>
            <NavLink href="/contact">Contact</NavLink>

            {!isLoaded ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : !isSignedIn ? (
              <button
                onClick={handleLogin}
                className="flex items-center px-5 py-2 text-white bg-green-700 text-sm rounded transition-colors duration-200 hover:bg-green-800 cursor-pointer"
              >
                Log in
              </button>
            ) : (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-14 h-14",
                  },
                }}
              />
            )}
          </div>

          <button
            className="p-2 md:hidden transition-colors duration-200 hover:bg-gray-100 rounded-full"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>
        </nav>

        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden"
          >
            <div className="py-4 mt-4 space-y-4">
              <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
              <MobileNavLink href="/about">About</MobileNavLink>
              <MobileNavLink href="/features">Features</MobileNavLink>
              <MobileNavLink href="/contact">Contact</MobileNavLink>
              {isSignedIn ? (
                <div className="px-4">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-14 h-14",
                      },
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="w-full px-6 py-3 text-white bg-green-600 rounded-full transition-colors duration-200 hover:bg-green-700"
                >
                  Log in
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        isActive ? "text-green-600" : "text-gray-600 hover:text-green-600"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`block px-4 py-2 text-base font-medium transition-colors ${
        isActive ? "text-green-600" : "text-gray-900 hover:text-green-600"
      }`}
    >
      {children}
    </Link>
  );
}
