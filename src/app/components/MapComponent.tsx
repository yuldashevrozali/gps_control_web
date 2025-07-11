// components/MapComponent.js (yoki .tsx)
import { useEffect, useRef } from 'react';
import L from 'leaflet'; // Bu yerda Leaflet'ni import qilamiz

// Leaflet markerining default ikonalarini tuzatish
// Bu muhim, chunki Next.js bilan ikonalar noto'g'ri ko'rsatilishi mumkin
if (typeof window !== 'undefined') { // Faqat brauzer muhitida ishga tushirish
  delete L.Icon.Default.prototype._get='https://www.google.com/search?q=L.Icon.Default.prototype._getIconUrl&ie=UTF-8&sourceid=newtab&opi=89978449';
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default.src,
    iconUrl: require('leaflet/dist/images/marker-icon.png').default.src,
    shadowUrl: require('leaflet/dist/images/marker-shadow.png').default.src,
  });
}

const MapComponent = () => {
  const mapRef = useRef(null); // Xarita instansiyasini saqlash uchun ref

  useEffect(() => {
    // Xarita faqat bir marta yaratilishini ta'minlash
    if (!mapRef.current) {
      mapRef.current = L.map('mapid').setView([40.75, 72.35], 13); // Farg'ona, O'zbekiston koordinatalari

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Marker qo'shish (ixtiyoriy)
      L.marker([40.75, 72.35]).addTo(mapRef.current)
        .bindPopup('Salom, Farg\'ona!')
        .openPopup();
    }

    // Komponent o'chirilganda xaritani tozalash (xotira sizib chiqishini oldini olish)
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Faqat bir marta ishga tushirish

  return <div id="mapid" style={{ height: '500px', width: '100%' }}></div>;
};

export default MapComponent;