'use client';

import { useState, useTransition } from 'react';
import { togglePostLike } from '@/app/actions/likes';

export default function LikeButton({
  postId,
  initialCount,
  initialLiked = false,
}: {
  postId: number;
  initialCount: number;
  initialLiked?: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [isPending, startTransition] = useTransition();

  const handleLike = () => {
    startTransition(async () => {
      const result = await togglePostLike(postId);
      if (!result.ok) {
        alert(result.message);
        return;
      }
      setLiked(result.liked);
      setCount(result.likeCount);
    });
  };

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={isPending}
      aria-pressed={liked}
      className={`rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50 ${
        liked
          ? 'bg-red-50 text-red-600'
          : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
      }`}
    >
      {liked ? '♥ 좋아요' : '♡ 좋아요'} {count}
    </button>
  );
}
