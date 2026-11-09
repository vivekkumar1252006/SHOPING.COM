import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({ rating = 5, reviewsCount, showText = true, size = 16 }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {stars.map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= Math.round(rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-300 dark:text-slate-600'
            }`}
          />
        ))}
      </div>
      {showText && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1">
          {rating.toFixed(1)}
          {reviewsCount !== undefined && (
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">
              ({reviewsCount})
            </span>
          )}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
