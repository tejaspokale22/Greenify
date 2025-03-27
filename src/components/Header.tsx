"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Leaf, Menu, X, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import { createUser } from "@/db/actions";
import { toast } from "react-hot-toast";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn, user, isLoaded } = useUser();
  const { openSignIn } = useClerk();
  const [hasChecked, setHasChecked] = useState(false);

  console.log(user);

  const handleLogin = async () => {
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
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-1">
            <Leaf className="w-10 h-10 text-green-700" />
            <span className="text-2xl font-bold text-gray-900">Greenify</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            <NavLink href="/about">About</NavLink>
            <NavLink href="/features">Features</NavLink>
            <NavLink href="/contact">Contact</NavLink>
            
            {!isLoaded ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : !isSignedIn ? (
              <button
                onClick={handleLogin}
                className="flex items-center px-4 py-1 text-white bg-green-700 text-sm rounded transition-colors duration-200 hover:bg-green-800 cursor-pointer"
              >
                Log in
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard" 
                  className="flex items-center space-x-2 text-green-600 transition-colors duration-200 hover:text-green-700"
                >
                  <User className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10"
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden"
          >
            <div className="py-4 mt-4 space-y-4">
              <MobileNavLink href="/about">About</MobileNavLink>
              <MobileNavLink href="/features">Features</MobileNavLink>
              <MobileNavLink href="/contact">Contact</MobileNavLink>
              {isSignedIn ? (
                <>
                  <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
                  <div className="px-4">
                    <UserButton 
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10"
                        }
                      }}
                      afterSignOutUrl="/"
                    />
                  </div>
                </>
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors ${
        isActive 
          ? "text-green-600" 
          : "text-gray-600 hover:text-green-600"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={`block px-4 py-2 text-base font-medium transition-colors ${
        isActive 
          ? "text-green-600" 
          : "text-gray-900 hover:text-green-600"
      }`}
    >
      {children}
    </Link>
  );
}
