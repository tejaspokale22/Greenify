'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Leaf, Menu, X } from 'lucide-react'
import Link from 'next/link'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300  ${
      isScrolled ? 'py-4 bg-white shadow-md' : 'py-6 bg-transparent'
    }`}>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <span className={`text-2xl font-bold ${
              isScrolled ? 'text-gray-900' : 'text-gray-900'
            }`}>
              Greenify
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-8 md:flex">
            <NavLink href="/about" isScrolled={isScrolled}>About</NavLink>
            <NavLink href="/features" isScrolled={isScrolled}>Features</NavLink>
            <NavLink href="/contact" isScrolled={isScrolled}>Contact</NavLink>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 text-white bg-green-600 rounded-full transition-colors hover:bg-green-700"
            >
              Get Started
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="p-2 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`} />
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
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 w-full text-white bg-green-600 rounded-full transition-colors hover:bg-green-700"
              >
                Get Started
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  )
}

function NavLink({ href, children, isScrolled }: { href: string; children: React.ReactNode; isScrolled: boolean }) {
  return (
    <Link 
      href={href}
      className={`text-sm font-medium transition-colors ${
        isScrolled ? 'text-gray-600 hover:text-green-600' : 'text-gray-800 hover:text-green-600'
      }`}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link 
      href={href}
      className="block px-4 py-2 text-base font-medium text-gray-900 transition-colors hover:text-green-600"
    >
      {children}
    </Link>
  )
} 