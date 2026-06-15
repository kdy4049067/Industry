'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { findEmailByProfile } from '@/app/actions/auth';
import { countries } from '@/lib/countries';

export default function FindEmailPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('auth');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    | { state: 'idle' }
    | { state: 'found'; masked: string }
    | { state: 'not_found' }
    | { state: 'error'; message: string }
  >({ state: 'idle' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const res = await findEmailByProfile(new FormData(e.currentTarget));
    setLoading(false);

    if ('error' in res) {
      if (res.error === 'RATE_LIMITED') {
        setResult({ state: 'error', message: t('findEmail.rateLimited') });
        return;
      }
      setResult({ state: 'error', message: t('findEmail.invalidInput') });
      return;
    }
    if (res.masked) {
      setResult({ state: 'found', masked: res.masked });
    } else {
      setResult({ state: 'not_found' });
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold text-blue-900">{t('findEmail.title')}</h1>
        <p className="mb-6 text-sm text-gray-600">{t('findEmail.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {tCommon('nickname')}
            </label>
            <input
              name="nickname"
              type="text"
              required
              placeholder={tCommon('nicknamePlaceholder')}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {tCommon('nationality')}
            </label>
            <select
              name="nationality"
              required
              defaultValue=""
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                선택하세요
              </option>
              {countries.map((country) => (
                <option key={country.code} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {tCommon('industry')}
            </label>
            <select
              name="industry"
              required
              defaultValue=""
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="" disabled>
                {tCommon('managerTypeSelect')}
              </option>
              <option value="건설업">{tCommon('industryConstruction')}</option>
              <option value="제조업">{tCommon('industryManufacturing')}</option>
              <option value="기타">{tCommon('industryEtc')}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-900 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? t('findEmail.searching') : t('findEmail.submit')}
          </button>
        </form>

        {result.state === 'found' && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold">{t('findEmail.foundTitle')}</p>
            <p className="mt-1 font-mono text-base text-blue-900">{result.masked}</p>
            <p className="mt-2 text-xs text-blue-700">{t('findEmail.foundHint')}</p>
          </div>
        )}
        {result.state === 'not_found' && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            {t('findEmail.notFound')}
          </div>
        )}
        {result.state === 'error' && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {result.message}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            {t('forgot.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
