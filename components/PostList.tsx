import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { PostListItem } from '@/types';
import { getDisplayRole } from '@/lib/getDisplayRole';

export default function PostList({ posts }: { posts: PostListItem[] }) {
  const t = useTranslations('common');

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
        아직 등록된 게시글이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="grid grid-cols-12 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <div className="col-span-1">번호</div>
        <div className="col-span-4">제목</div>
        <div className="col-span-2">작성자</div>
        <div className="col-span-2">작성일</div>
        <div className="col-span-1 text-center">조회</div>
        <div className="col-span-1 text-center">좋아요</div>
        <div className="col-span-1 text-center">댓글</div>
      </div>

      {posts.map((post, index) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="grid grid-cols-12 items-center border-t border-gray-100 px-4 py-3.5 text-sm transition-colors hover:bg-blue-50"
        >
          <div className="col-span-1 text-gray-400">{posts.length - index}</div>

          <div className="col-span-4 truncate pr-4 font-medium text-gray-800">
            {post.is_pinned && (
              <span className="mr-1.5 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs font-bold text-blue-700">
                공지
              </span>
            )}
            {post.title}
          </div>

          <div className="col-span-2 truncate text-gray-500">
            {post.hide_author
              ? t('staffAuthor')
              : post.profiles?.nickname ??
                post.profiles?.user_code ??
                post.profiles?.public_id ??
                post.profiles?.email ??
                '알 수 없음'}
            <span className="ml-1 text-xs text-gray-400">
              {post.hide_author ? '' : getDisplayRole(post.profiles)}
            </span>
          </div>

          <div className="col-span-2 text-gray-400">
            {new Date(post.created_at).toLocaleDateString('ko-KR')}
          </div>

          <div className="col-span-1 text-center text-gray-400">
            {post.view_count}
          </div>

          <div className="col-span-1 text-center text-gray-400">
            {post.like_count}
          </div>

          <div className="col-span-1 text-center text-gray-400">
            {post.comment_count}
          </div>
        </Link>
      ))}
    </div>
  );
}
