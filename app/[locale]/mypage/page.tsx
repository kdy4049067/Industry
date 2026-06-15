import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import MyPageEditForm from '@/components/MyPageEditForm';
import type { AccountStatus } from '@/types';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const supabase = await createClient();
  const t = await getTranslations();
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/login?redirectTo=/mypage', locale });
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'id, email, nickname, nationality, age, user_role, industry, manager_type, public_id, account_status, report_count, suspended_until, is_admin, created_at'
    )
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-white p-8 shadow">
          <h1 className="mb-3 text-2xl font-bold text-blue-900">{t('mypage.title')}</h1>
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {t('mypage.loadError')}
          </p>
        </div>
      </div>
    );
  }

  const statusLabel = formatAccountStatus(
    profile.account_status,
    profile.suspended_until,
    locale,
    {
      active: t('mypage.statusActive'),
      banned: t('mypage.statusBanned'),
      suspended: t('mypage.statusSuspended'),
      suspendedUntil: (until: string) =>
        t('mypage.statusSuspendedUntil', { until }),
    }
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-1 text-2xl font-bold text-blue-900">{t('mypage.title')}</h1>
        <p className="mb-6 text-sm text-gray-500">{t('mypage.subtitle')}</p>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Info label={t('mypage.infoEmail')} value={profile.email ?? '-'} />
          <Info label={t('mypage.infoPublicId')} value={profile.public_id ?? '-'} />
          <Info label={t('mypage.infoJoinedAt')} value={formatDate(profile.created_at, locale)} />
          <Info label={t('mypage.infoStatus')} value={statusLabel} />
          <Info
            label={t('mypage.infoReports')}
            value={t('mypage.infoReportsUnit', { count: profile.report_count })}
          />
          {profile.is_admin && (
            <Info label={t('mypage.infoRole')} value={t('mypage.infoRoleAdmin')} />
          )}
        </dl>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow">
        <h2 className="mb-6 text-lg font-bold text-blue-900">{t('mypage.editSection')}</h2>
        <MyPageEditForm profile={profile} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(
      locale === 'ko' ? 'ko-KR' : 'en-US'
    );
  } catch {
    return iso;
  }
}

interface StatusLabels {
  active: string;
  banned: string;
  suspended: string;
  suspendedUntil: (until: string) => string;
}

function formatAccountStatus(
  status: AccountStatus,
  suspendedUntil: string | null,
  locale: string,
  labels: StatusLabels
): string {
  if (status === 'active') return labels.active;
  if (status === 'banned') return labels.banned;
  if (status === 'suspended') {
    if (suspendedUntil) {
      const until = new Date(suspendedUntil).toLocaleString(
        locale === 'ko' ? 'ko-KR' : 'en-US'
      );
      return labels.suspendedUntil(until);
    }
    return labels.suspended;
  }
  return status;
}
