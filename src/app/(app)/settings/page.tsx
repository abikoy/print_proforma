'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** On phones the section list (from the layout) is this page. On desktop, open the first section. */
export default function SettingsIndexPage() {
  const router = useRouter();
  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) router.replace('/settings/categories');
  }, [router]);
  return null;
}
