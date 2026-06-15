'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * 호출자가 최고 운영진(is_super_admin)인지 세션 supabase 로 검증.
 * 검증 통과 시에만 호출부에서 service_role(admin) 클라이언트를 사용한다.
 * (이 검증 단계를 절대 생략하지 말 것 — answers.ts 채택 토글과 동일 패턴)
 */
async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'UNAUTHENTICATED' as const };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) return { error: 'FORBIDDEN' as const };

  return { userId: user.id };
}

/** 일반 사용자를 사이트 운영진(is_admin=true)으로 임명. 최고 운영진만 가능. */
export async function appointStaff(targetUserId: string) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth;

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', targetUserId);

  if (error) return { error: error.message };

  revalidatePath('/admin/users', 'page');
  return { success: true as const };
}

/** 게시글 상단 고정/해제. 최고 운영진만 가능. */
export async function togglePinPost(postId: number, pinned: boolean) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth;

  const admin = createAdminClient();
  const { error } = await admin
    .from('posts')
    .update({ is_pinned: pinned })
    .eq('id', postId);

  if (error) return { error: error.message };

  revalidatePath('/board/notice');
  revalidatePath(`/post/${postId}`);
  return { success: true as const };
}

/** 운영진 권한 해임(is_admin=false). 최고 운영진만 가능하며, 최고 운영진은 해임 불가. */
export async function dismissStaff(targetUserId: string) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth;

  const admin = createAdminClient();

  const { data: target } = await admin
    .from('profiles')
    .select('is_super_admin')
    .eq('id', targetUserId)
    .single();

  if (target?.is_super_admin) {
    return { error: 'CANNOT_DISMISS_SUPER_ADMIN' as const };
  }

  const { error } = await admin
    .from('profiles')
    .update({ is_admin: false })
    .eq('id', targetUserId);

  if (error) return { error: error.message };

  revalidatePath('/admin/users', 'page');
  return { success: true as const };
}
