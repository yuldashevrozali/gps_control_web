'use client'; // 🔥 Bu bo'lishi shart

import dynamic from 'next/dynamic';

// Dynamic import with ssr off
const RealTimeMap = dynamic(() => import('../components/realtimecomponent'), {
  ssr: false,
});

export default function RealTimeMapPage() {
  return <RealTimeMap />;
}
