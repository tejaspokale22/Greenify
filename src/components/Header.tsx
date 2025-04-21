"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Leaf, Menu, X } from "lucide-react";
import Link from "next/link";
import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export default function Header() {
  const [userData, setUserData] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn, user, isLoaded } = useUser();
  const { openSignIn } = useClerk();

  useEffect(() => {
    // Only access localStorage on the client side
    const storedData = localStorage.getItem("userData");
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && user) {
      const userData = {
        clerkId: user.id,
        name: user.fullName || "Unknown",
        email: user.primaryEmailAddress?.emailAddress || "No Email",
        imageUrl: user.imageUrl || "",
      };
      localStorage.setItem("userData", JSON.stringify(userData));
      setUserData(userData);
    } else {
      localStorage.removeItem("userData");
      setUserData(null);
    }
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
    <header className="fixed top-0 right-0 left-0 z-50 py-3 border-b border-gray-100 shadow-sm backdrop-blur-sm bg-white/90">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-1">
            <Leaf className="w-10 h-10 text-green-700" />
            <span className="text-[22px] font-bold tracking-tight text-gray-900">Greenify</span>
          </Link>

          <div className="hidden items-center space-x-8 md:flex">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/about">About</NavLink>
            {userData && <NavLink href="/dashboard">Dashboard</NavLink>}

            {!isLoaded ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : !isSignedIn ? (
              <button
                onClick={handleLogin}
                className="flex items-center px-5 py-2 text-sm font-medium text-white bg-green-800 rounded-full transition-all duration-200 cursor-pointer hover:bg-green-700 hover:shadow-md"
              >
                Log in
              </button>
            ) : (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                  },
                }}
              />
            )}
          </div>

          <button
            className="p-2 rounded-full transition-colors duration-200 md:hidden hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
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
            transition={{ duration: 0.2 }}
            className="md:hidden"
          >
            <div className="py-4 mt-4 space-y-3 bg-white rounded-lg shadow-lg">
              <MobileNavLink href="/">Home</MobileNavLink>
              <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
              <MobileNavLink href="/about">About</MobileNavLink>
              {isSignedIn ? (
                <div className="px-4 py-2">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                      },
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-6 py-2.5 mx-4 w-[calc(100%-2rem)] text-white bg-green-600 rounded-full transition-all duration-200 hover:bg-green-700 hover:shadow-md"
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
      className={`text-sm font-medium transition-colors relative ${
        isActive ? "text-green-600" : "text-gray-600 hover:text-green-600"
      }`}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-full"></span>
      )}
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
        isActive ? "text-green-600 bg-green-50" : "text-gray-900 hover:text-green-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  );
}
