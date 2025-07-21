'use client';

import dynamic from 'next/dynamic';

const MapHistory = dynamic(() => import('../components/MapHistoryComponent'), {
  ssr: false,
});

export default function Page() {
  return <MapHistory />;
}
