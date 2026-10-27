import React from 'react'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeatureCards } from '@/components/landing/FeatureCards'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { StatisticsSection } from '@/components/landing/StatisticsSection'
import { SecuritySection } from '@/components/landing/SecuritySection'
import { AboutSection } from '@/components/landing/AboutSection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-500/20 selection:text-blue-700">
      {/* Navigation Bar */}
      <LandingNavbar />

      {/* Main Content Sections */}
      <main>
        {/* 1. Hero Section with Get Started Button */}
        <HeroSection />

        {/* 2. Feature Cards (Student Records, Verification, Data Security) */}
        <FeatureCards />

        {/* 3. Three-Step How It Works Section */}
        <HowItWorks />

        {/* 4. Statistics Cards (Clearly Labelled Demonstration Data) */}
        <StatisticsSection />

        {/* 5. Security & Privacy Section */}
        <SecuritySection />

        {/* 6. About the APAAR Ecosystem & NEP 2020 Mandate */}
        <AboutSection />
      </main>

      {/* Footer with Useful Navigation Links */}
      <LandingFooter />
    </div>
  )
}
