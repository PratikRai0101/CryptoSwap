import React from "react";

export function LoadingSpinner({ message = "Loading...", size = "md" }: { message?: string; size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-4",
  };
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
      <div className={`animate-spin rounded-full border-t-blue-500 border-gray-300 mb-4 ${sizeMap[size]}`}/>
      {message && <span className="text-base text-muted-foreground">{message}</span>}
    </div>
  );
}
