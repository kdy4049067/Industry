export type UserRole = '근로자' | '관리자';
export type Industry = '건설업' | '제조업' | '기타';
export type ManagerType =
  | '안전관리자'
  | '보건관리자'
  | '현장소장'
  | '관리감독자'
  | '안전보건총괄책임자'
  | '안전보건관리책임자'
  | '기타 관리자';

export type QnaStatus = '답변대기' | '답변완료';
export type ReportStatus = '접수' | '처리중' | '처리완료';
export type AccountStatus = 'active' | 'suspended' | 'banned';
export type SiteRole = 'member' | 'staff' | 'owner';
export type NewsGroup = '전체' | '건설업' | '제조업' | '조선·운송업' | '기타';
export type AnswerOpinionType =
  | '이의제기'
  | '추가의견'
  | '근거보완'
  | '오류수정요청';
export type ReportTargetType = 'post' | 'comment' | 'answer' | 'answer_opinion';
export type ReportReason =
  | '욕설/비방'
  | '성희롱'
  | '혐오/차별'
  | '허위사실'
  | '개인정보 노출'
  | '회사명/현장명 언급'
  | '스팸/광고'
  | '기타';
export type ModerationStatus = '접수' | '검토중' | '처리완료' | '반려';

export type CategorySlug =
  | 'notice'
  | 'free'
  | 'resources'
  | 'law'
  | 'news'
  | 'accident'
  | 'education'
  | 'checklist'
  | 'photos'
  | 'qna';

export interface Profile {
  id: string;
  login_id: string | null;
  email: string | null;
  nickname: string;
  nationality: string | null;
  age: number | null;
  birth_date: string | null;
  nationality_code: string | null;
  nationality_name: string | null;
  user_role: UserRole;
  industry: Industry;
  job_role: string | null;
  manager_type: ManagerType | null;
  public_id: string | null;
  user_code: string | null;
  site_role: SiteRole;
  can_manage_site: boolean;
  can_grant_admin: boolean;
  account_status: AccountStatus;
  report_count: number;
  suspended_until: string | null;
  is_admin: boolean;
  is_online: boolean;
  last_seen_at: string | null;
  last_login_at: string | null;
  is_super_admin: boolean;
  profile_image: string | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: CategorySlug;
  sort_order: number;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  category_slug: CategorySlug;
  author_id: string | null;
  image_url: string | null;
  file_url: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  qna_status: QnaStatus;
  accident_type: string | null;
  accident_cause: string | null;
  prevention_plan: string | null;
  news_subcategory: string | null;
  is_hidden: boolean;
  hidden_reason: string | null;
  hide_author: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostWithAuthor extends Post {
  profiles: Pick<
    Profile,
    | 'nickname'
    | 'email'
    | 'public_id'
    | 'user_code'
    | 'user_role'
    | 'industry'
    | 'job_role'
    | 'manager_type'
  > | null;
}

export interface PostListItem {
  id: number;
  title: string;
  created_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  hide_author: boolean;
  is_pinned: boolean;
  profiles: Pick<
    Profile,
    'nickname' | 'email' | 'public_id' | 'user_code' | 'user_role' | 'job_role' | 'manager_type'
  > | null;
}

export interface RecentPostItem {
  id: number;
  title: string;
  category_slug: string;
  created_at: string;
  profiles: Pick<Profile, 'nickname' | 'email'> | null;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: string | null;
  content: string;
  parent_comment_id: number | null;
  is_hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
}

export interface CommentWithAuthor extends Comment {
  profiles: Pick<
    Profile,
    'nickname' | 'email' | 'public_id' | 'user_code' | 'user_role' | 'job_role' | 'manager_type'
  > | null;
}

export interface PostAttachment {
  id: number;
  post_id: number;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string | null;
  created_at: string;
}

export interface Answer {
  id: number;
  post_id: number;
  author_id: string | null;
  content: string;
  source: string | null;
  is_selected: boolean;
  is_admin_answer: boolean;
  is_hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnswerOpinion {
  id: number;
  answer_id: number;
  author_id: string | null;
  opinion_type: AnswerOpinionType;
  content: string;
  source: string | null;
  is_hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnswerOpinionWithAuthor extends AnswerOpinion {
  profiles: Pick<
    Profile,
    'nickname' | 'email' | 'public_id' | 'user_code' | 'user_role' | 'job_role' | 'manager_type'
  > | null;
}

export interface AnswerWithAuthor extends Answer {
  profiles: Pick<
    Profile,
    | 'nickname'
    | 'email'
    | 'public_id'
    | 'user_code'
    | 'user_role'
    | 'industry'
    | 'job_role'
    | 'manager_type'
  > | null;
  answer_opinions: AnswerOpinionWithAuthor[];
}

export interface Like {
  id: number;
  post_id: number;
  user_id: string;
  created_at: string;
}

export interface Report {
  id: number;
  target_type: ReportTargetType;
  target_id: number;
  reported_user_id: string | null;
  reporter_id: string | null;
  reason: ReportReason;
  detail: string | null;
  status: ModerationStatus;
  created_at: string;
}

export interface SiteStats {
  memberCount: number;
  postCount: number;
  commentCount: number;
}
