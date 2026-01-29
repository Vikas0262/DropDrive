"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section - Centered */}
      <section className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl">
          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-2 text-foreground">
            Drop. Store. Share.
          </h1>

          {/* Subheading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-8">
            Your Cloud, Your Control.
          </h2>

          {/* Sub Text */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Upload files or folders in seconds and share them securely using smart-links with passwords, expiry time, and full access control — powered by DropDrive.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="bg-primary hover:bg-accent-hover text-primary-foreground px-8 py-6 text-base font-semibold rounded-lg w-full sm:w-auto">
                Start Uploading
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="ghost" className="text-primary hover:text-accent-hover px-8 py-6 text-base font-semibold w-full sm:w-auto">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
