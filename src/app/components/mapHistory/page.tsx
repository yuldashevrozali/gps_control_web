'use client';

import dynamic from 'next/dynamic';

const MapHistory = dynamic(() => import('../MapHistoryComponent'), {
  ssr: false,
});

export default function Page() {
  return <MapHistory />;
}
