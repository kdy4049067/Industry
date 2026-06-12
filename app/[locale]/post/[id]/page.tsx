import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import type { PostWithAuthor, CommentWithAuthor, PostAttachment } from '@/types';
import AdminContentActions from '@/components/admin/AdminContentActions';
import LikeButton from '@/components/LikeButton';
import QnaAnswerSection from '@/components/QnaAnswerSection';
import ReportButton from '@/components/ReportButton';
import ShareButton from '@/components/ShareButton';
import { getDisplayRole } from '@/lib/getDisplayRole';
import CommentSection from './CommentSection';

const postSelect =
  '*, profiles(nickname, email, public_id, user_role, industry, manager_type)';
const commentsSelect =
  '*, profiles(nickname, email, public_id, user_role, manager_type)';

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);

  if (isNaN(postId)) notFound();

  const supabase = await createClient();

  const { error: viewCountError } = await supabase.rpc('increment_view_count', {
    post_id_input: postId,
  });

  if (viewCountError) {
    console.error('[post] increment_view_count failed:', viewCountError);
  }

  const [
    postResult,
    commentsResult,
    attachmentsResult,
    { data: userData },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select(postSelect)
      .eq('id', postId)
      .single(),
    supabase
      .from('comments')
      .select(commentsSelect)
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
    supabase
      .from('post_attachments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
    supabase.auth.getUser(),
  ]);

  if (postResult.error) {
    console.error('[post] post query failed:', postResult.error);
  }

  if (commentsResult.error) {
    console.error('[post] comments query failed:', commentsResult.error);
  }

  if (attachmentsResult.error) {
    console.error('[post] attachments query failed:', attachmentsResult.error);
  }

  const post = postResult.data;

  if (postResult.error && !post) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-gray-900">
          게시글을 불러오지 못했습니다.
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          운영 DB 스키마가 현재 배포 코드보다 오래되어 상세 조회에 실패했습니다.
          Supabase 보강 SQL을 적용한 뒤 다시 확인해 주세요.
        </p>
      </div>
    );
  }

  if (!post) notFound();

  const { data: currentProfile } = userData.user
    ? await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userData.user.id)
        .single()
    : { data: null };

  const typedPost = post as PostWithAuthor;
  const typedComments = (commentsResult.data ?? []) as CommentWithAuthor[];
  const typedAttachments = (attachmentsResult.data ?? []) as PostAttachment[];
  // 운영진 판별은 is_admin 단독. user_role='관리자' 는 회원가입에서 누구나
  // 선택하는 직무값이므로 운영진 권한과 무관 (appoint_staff.sql 동일 원칙).
  const isAdmin = Boolean(currentProfile?.is_admin);
  const isQnaPost = typedPost.category_slug === 'qna';
  const postUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/post/${typedPost.id}`
    : undefined;

  // 운영진 작성 글: 작성자 신원(닉네임/유형/업종)을 모두에게 숨긴다(관리자 포함).
  const t = await getTranslations('common');
  const authorProfile = typedPost.hide_author ? null : typedPost.profiles;

  return (
    <article className="rounded-2xl bg-white p-8 shadow">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">{typedPost.title}</h1>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
          <span>
            작성자:{' '}
            <strong className="text-gray-600">
              {typedPost.hide_author
                ? t('staffAuthor')
                : (authorProfile?.nickname ??
                  authorProfile?.user_code ??
                  authorProfile?.public_id ??
                  authorProfile?.email ??
                  '알 수 없음')}
            </strong>
          </span>
          <span>역할 {getDisplayRole(authorProfile)}</span>
          <span>업종 {authorProfile?.industry ?? '-'}</span>
          <span>
            작성일: {new Date(typedPost.created_at).toLocaleString('ko-KR')}
          </span>
          <span>조회 {typedPost.view_count}</span>
          <span>좋아요 {typedPost.like_count}</span>
          {typedPost.author_id && (
            <ReportButton
              targetType="post"
              targetId={typedPost.id}
              reportedUserId={typedPost.author_id}
            />
          )}
        </div>

        {typedPost.is_hidden && (
          <p className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            관리자에 의해 숨김 처리된 게시글입니다.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <LikeButton postId={typedPost.id} initialCount={typedPost.like_count ?? 0} />
          <ShareButton title={typedPost.title} url={postUrl} />
        </div>
      </div>

      {typedPost.image_url && !typedPost.is_hidden && (
        <div className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={typedPost.image_url}
            alt={typedPost.title}
            className="max-h-[500px] rounded-xl object-cover"
          />
        </div>
      )}

      {typedPost.is_hidden ? (
        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-gray-400">
          숨김 처리된 게시글입니다.
        </div>
      ) : (
        <div className="mt-6 whitespace-pre-wrap leading-relaxed text-gray-700">
          {typedPost.content}
        </div>
      )}

      {typedPost.file_url && !typedPost.is_hidden && (
        <a
          href={typedPost.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1 rounded-lg bg-gray-100 px-4 py-2 text-sm text-blue-700 hover:bg-gray-200"
        >
          📎 첨부파일 다운로드
        </a>
      )}

      {typedAttachments.length > 0 && !typedPost.is_hidden && (
        <section className="mt-8 rounded-2xl bg-gray-50 p-5">
          <h2 className="mb-4 text-lg font-bold text-gray-900">첨부파일</h2>

          <div className="space-y-4">
            {typedAttachments.map((file) => (
              <div key={file.id} className="rounded-xl bg-white p-4">
                {file.file_type?.startsWith('image/') && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file.file_url}
                    alt={file.file_name}
                    className="mb-3 max-h-[500px] rounded-xl object-cover"
                  />
                )}

                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  다운로드: {file.file_name}
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {isAdmin && <AdminContentActions targetType="post" targetId={typedPost.id} />}

      {isQnaPost ? (
        <QnaAnswerSection
          postId={typedPost.id}
          questionAuthorId={typedPost.author_id}
        />
      ) : (
        <CommentSection
          postId={postId}
          comments={typedComments}
          isAdmin={isAdmin}
        />
      )}
    </article>
  );
}
