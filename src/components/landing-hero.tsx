"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github } from "lucide-react";
import { LaptopMockup } from "@/components/ui/landing-laptop-mockup";
import Image from "next/image";

export default function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [targetAudience, setTargetAudience] = useState("creatives");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const audiences = [
      "creatives",
      "designers",
      "videographers",
      "marketers",
      "artists",
      "everyone",
    ];

    let currentIndex = 0;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      // Wait for fade out before changing text
      setTimeout(() => {
        currentIndex = (currentIndex + 1) % audiences.length;
        setTargetAudience(audiences[currentIndex]);
        
        // Wait a tiny bit after text change before fading back in
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 400);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-32">
      {/* Background floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] opacity-30 animate-float">
          <div className="w-40 h-40 bg-gradient-to-tr from-gray-800 to-transparent rounded-lg rotate-12" />
        </div>
        <div className="absolute top-[40%] right-[15%] opacity-20 animate-float-delay-1">
          <div className="w-60 h-32 bg-gradient-to-tl from-gray-800 to-transparent rounded-lg -rotate-12" />
        </div>
        <div className="absolute bottom-[20%] left-[20%] opacity-25 animate-float-delay-2">
          <div className="w-48 h-48 bg-gradient-to-tr from-gray-800 to-transparent rounded-lg rotate-45" />
        </div>
      </div>

      {/* Main content */}
      <div
        className={`text-center px-4 transition-opacity duration-1000 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      >
       
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-medium mb-4 tracking-tight">
          TRAXS<sup className="text-xl md:text-2xl align-super">©</sup>
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center text-xl sm:text-2xl text-white/80 mt-4 gap-2 mb-8">
          <span>A video creation platform for</span>
          <span className="font-medium relative min-w-44 px-3 py-1 border border-white/20 rounded-full">
            <span 
              className={`text-white transition-opacity duration-300 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {targetAudience}
            </span>
          </span>
        </div>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
          Traxs is a video edtor built for the modern creator. Create stunning videos with our intuitive tools for every day use from reels, to shorts, to ads, the possibilities are endless.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/app">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 min-w-[200px]"
            >
              Try it now
            </Button>
          </Link>
       
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 flex flex-col items-center animate-bounce">
        <span className="text-sm text-white/60">Scroll to explore</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-2 opacity-60">
          <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* App Screenshot */}
      <div className="relative group max-w-6xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/40 to-blue-500/40 blur-3xl opacity-20" />
        <LaptopMockup>
          <Image
            src="/screenshot.webp?height=800&width=1200"
            width={1200}
            height={800}
            alt="Video Starter Kit interface"
            className="w-full h-auto"
            priority
          />
        </LaptopMockup>

        {/* Floating gradient elements */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl opacity-20" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl opacity-20" />
      </div>
    </section>
  );
}
