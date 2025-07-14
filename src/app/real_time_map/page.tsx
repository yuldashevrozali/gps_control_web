'use client';

import dynamic from 'next/dynamic';

const RealTimeMap = dynamic(() => import('../components/realtimecomponent'), {
  ssr: false,
});

export default function RealTimeMapPage() {
  return (
    <div>
      <RealTimeMap />
    </div>
  );
}
