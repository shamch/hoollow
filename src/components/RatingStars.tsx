"use client";

import React from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface RatingStarsProps {
    rating: number;
    onRate?: (rating: number) => void;
    size?: number;
    readonly?: boolean;
}

export default function RatingStars({ rating, onRate, size = 20, readonly = false }: RatingStarsProps) {
    const [hover, setHover] = React.useState(0);

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                    key={star}
                    type="button"
                    whileHover={readonly ? {} : { scale: 1.2 }}
                    whileTap={readonly ? {} : { scale: 0.9 }}
                    onClick={() => !readonly && onRate?.(star)}
                    onMouseEnter={() => !readonly && setHover(star)}
                    onMouseLeave={() => !readonly && setHover(0)}
                    className={`${readonly ? "cursor-default" : "cursor-pointer"} transition-colors`}
                >
                    <Star
                        size={size}
                        fill={(hover || rating) >= star ? "currentColor" : "none"}
                        className={`${
                            (hover || rating) >= star 
                                ? "text-yellow-500 fill-yellow-500" 
                                : "text-zinc-700"
                        }`}
                        strokeWidth={2}
                    />
                </motion.button>
            ))}
        </div>
    );
}
