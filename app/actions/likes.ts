'use server';

import { createClient } from '@/lib/supabase/server';

type LikeActionResult =
  | { ok: true; liked: boolean; likeCount: number }
  | { ok: false; code: 'LOGIN_REQUIRED' | 'POST_NOT_FOUND' | 'UNKNOWN'; message: string };

export async function togglePostLike(postId: number): Promise<LikeActionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { ok: false, code: 'LOGIN_REQUIRED', message: '로그인 후 좋아요를 누를 수 있습니다.' };
  }

  const { data, error } = await supabase.rpc('toggle_post_like', {
    post_id_input: postId,
  });

  if (error) {
    console.error('[likes] toggle_post_like failed:', { postId, userId: userData.user.id, error });

    if (error.message.includes('LOGIN_REQUIRED')) {
      return { ok: false, code: 'LOGIN_REQUIRED', message: '로그인 후 좋아요를 누를 수 있습니다.' };
    }
    if (error.message.includes('POST_NOT_FOUND')) {
      return { ok: false, code: 'POST_NOT_FOUND', message: '게시글을 찾을 수 없습니다.' };
    }
    return { ok: false, code: 'UNKNOWN', message: '좋아요 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
  }

  return {
    ok: true,
    liked: Boolean(data?.liked),
    likeCount: Number(data?.like_count ?? 0),
  };
}
