'use client';

import { useState } from 'react';
import { updateProfile } from '@/app/actions/profile';
import { countries } from '@/lib/countries';
import type { Industry, ManagerType, Profile, UserRole } from '@/types';

const MANAGER_TYPES: ManagerType[] = [
  '안전관리자',
  '보건관리자',
  '현장소장',
  '관리감독자',
  '안전보건총괄책임자',
  '안전보건관리책임자',
];

const INDUSTRIES: Industry[] = ['건설업', '제조업', '기타'];

interface Props {
  profile: Pick<
    Profile,
    'nickname' | 'nationality' | 'age' | 'industry' | 'user_role' | 'manager_type'
  >;
}

export default function MyPageEditForm({ profile }: Props) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [nationalityCode, setNationalityCode] = useState(
    countries.find((c) => c.name === profile.nationality)?.code ?? ''
  );
  const [age, setAge] = useState<string>(
    profile.age !== null ? String(profile.age) : ''
  );
  const [industry, setIndustry] = useState<Industry>(profile.industry);
  const [userRole, setUserRole] = useState<UserRole>(profile.user_role);
  const [managerType, setManagerType] = useState<ManagerType | ''>(
    profile.manager_type ?? ''
  );
  const [status, setStatus] = useState<
    { type: 'error' | 'success'; message: string } | null
  >(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const parsedAge = age.trim() === '' ? null : Number(age);

    const result = await updateProfile({
      nickname,
      nationality_code: nationalityCode || null,
      age: parsedAge,
      industry,
      user_role: userRole,
      manager_type: userRole === '관리자' ? (managerType || null) : null,
    });

    setLoading(false);

    if ('error' in result && result.error) {
      setStatus({ type: 'error', message: result.error });
      return;
    }
    setStatus({ type: 'success', message: '저장되었습니다.' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="닉네임">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <Field label="국적">
        <select
          value={nationalityCode}
          onChange={(e) => setNationalityCode(e.target.value)}
          className={inputClass}
        >
          <option value="">선택하세요</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="나이">
        <input
          value={age}
          onChange={(e) => setAge(e.target.value)}
          type="number"
          min={15}
          max={80}
          placeholder="나이"
          className={inputClass}
        />
      </Field>

      <Field label="구분">
        <select
          value={userRole}
          onChange={(e) => setUserRole(e.target.value as UserRole)}
          required
          className={inputClass}
        >
          <option value="근로자">근로자</option>
          <option value="관리자">관리자</option>
        </select>
      </Field>

      <Field label="업종">
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value as Industry)}
          required
          className={inputClass}
        >
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </Field>

      {userRole === '관리자' && (
        <Field label="관리자 직무">
          <select
            value={managerType}
            onChange={(e) => setManagerType(e.target.value as ManagerType | '')}
            required
            className={inputClass}
          >
            <option value="">선택하세요</option>
            {MANAGER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      )}

      {status && (
        <p
          className={`rounded-lg p-3 text-sm ${
            status.type === 'error'
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-900 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? '저장 중...' : '저장'}
      </button>
    </form>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}
