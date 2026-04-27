"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const slides = [
  {
    title: "20% off top picks this season",
    desc: "Upgrade your home, tech, ride, and more.",
    img: "https://via.placeholder.com/420x240",
  },
  {
    title: "Fresh deals on gadgets",
    desc: "Save big on the latest tech today.",
    img: "https://via.placeholder.com/420x240/cccccc",
  },
  {
    title: "Upgrade your workspace",
    desc: "Monitors, desks, and more on sale.",
    img: "https://via.placeholder.com/420x240/aaaaaa",
  },
];

export default function PromoBanner() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Auto slide with pause
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const current = slides[index];

  return (
    <div className="px-45">
      <div className="relative w-full bg-lime-400 rounded-2xl px-[100px] py-15 flex items-center justify-between overflow-hidden">
        {/* Left Content */}
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold text-black mb-4">
            {current.title}
          </h1>
          <p className="text-lg text-black mb-6">{current.desc}</p>
          <button className="bg-black text-white px-6 py-3 rounded-full hover:opacity-90 transition">
            Get the coupon
          </button>
          <p className="text-sm text-black mt-6 underline">
            Ends 5/10 PDT. Max $350 off. 2x use.
          </p>
        </div>

        {/* Right Image */}
        <div className="flex items-center justify-center">
          <img
            src={current.img}
            alt="promo"
            className="w-[420px] h-[240px] object-cover rounded-2xl shadow-lg transition-all duration-500"
          />
        </div>

        {/* Controls (Right Side) */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button
            onClick={prevSlide}
            className="bg-white p-2 rounded-full shadow"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={nextSlide}
            className="bg-white p-2 rounded-full shadow"
          >
            <ChevronRight />
          </button>
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="bg-white p-2 rounded-full shadow"
          >
            {isPaused ? <Play /> : <Pause />}
          </button>
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full cursor-pointer ${
                i === index ? "bg-black" : "bg-gray-500"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}