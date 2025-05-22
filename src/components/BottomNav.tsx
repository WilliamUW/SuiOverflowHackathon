import { BookOpen, Gift, Home } from "lucide-react";

import { cn } from "../lib/utils";

interface BottomNavProps {
  currentPage: "home" | "preparation" | "rewards";
  onPageChange: (page: "home" | "preparation" | "rewards") => void;
}

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="max-w-screen-lg mx-auto px-4">
        <div className="flex justify-around py-2">
          <button
            className={`flex flex-col items-center p-2 ${
              currentPage === "home" ? "text-blue-600" : "text-gray-600"
            }`}
            onClick={() => onPageChange("home")}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            className={`flex flex-col items-center p-2 ${
              currentPage === "preparation" ? "text-blue-600" : "text-gray-600"
            }`}
            onClick={() => onPageChange("preparation")}
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs mt-1">Prepare</span>
          </button>
          <button
            className={`flex flex-col items-center p-2 ${
              currentPage === "rewards" ? "text-blue-600" : "text-gray-600"
            }`}
            onClick={() => onPageChange("rewards")}
          >
            <Gift className="w-6 h-6" />
            <span className="text-xs mt-1">Rewards</span>
          </button>
        </div>
      </div>
    </div>
  );
} 