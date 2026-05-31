import { memo, forwardRef } from "react";

const starPath = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

const StarRating = memo(forwardRef<HTMLDivElement, { rating: number; size?: number }>(({ rating, size = 14 }, ref) => {
  const rounded = Math.round(rating);
  return (
    <div ref={ref} className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= rounded ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className={i <= rounded ? "star-filled" : "star-empty"}>
          <path d={starPath} />
        </svg>
      ))}
    </div>
  );
}));
StarRating.displayName = "StarRating";

export default StarRating;
