// src/app/components/MapClient.tsx
"use client";
import dynamic from "next/dynamic";

const MapComponent = dynamic(
  () => import("../components/realtimecomponent"),
  {
    ssr: false,
    loading: () => <p>Xarita yuklanmoqda...</p>,
  }
);

export default function MapClient() {
  return <MapComponent />;
}