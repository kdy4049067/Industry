'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LikeButton({
  postId,
  initialCount,
}: {
  postId: number;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: userData }) => {
      if (!userData.user) return;

      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (active) setLiked(Boolean(data));
    });

    return () => {
      active = false;
    };
  }, [postId]);

  const handleLike = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      alert('로그인 후 좋아요를 누를 수 있습니다.');
      setLoading(false);
      return;
    }

    if (liked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userData.user.id);

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setCount((c) => Math.max(0, c - 1));
      setLiked(false);
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userData.user.id });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setCount((c) => c + 1);
      setLiked(true);
    }

    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={loading}
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
