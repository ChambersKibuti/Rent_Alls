import React, { useState } from "react";
import { Star } from "lucide-react";

export default function RatingStars({ value = 0, onChange, size = 16, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(star)}
          className={`${readOnly ? "cursor-default" : "cursor-pointer"} transition-transform ${!readOnly ? "hover:scale-110" : ""}`}
        >
          <Star
            size={size}
            className={
              star <= display
                ? "fill-[#FFD700] text-[#FFD700]"
                : "fill-transparent text-zinc-300"
            }
          />
        </button>
      ))}
    </div>
  );
}