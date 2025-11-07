'use client';

import { useTranslations } from 'next-intl';

export function I18nTest() {
  const t = useTranslations('common.buttons');
  
  return (
    <div>
      <p>Translation test:</p>
      <button>{t('save')}</button>
      <button>{t('cancel')}</button>
    </div>
  );
}