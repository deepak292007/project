import { getBaseUrl } from '../../lib/api';

const BASE = getBaseUrl();
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useSession } from '../../store';
import type { Lang } from '../../types';

export interface FacilityMarkerData {
  facilityId: string;
  name: string;
  nameTelugu?: string;
  nameKannada?: string;
  nameMarathi?: string;
  nameHindi?: string;
  type?: string;
  level: string;
  phone: string;
  address: string;
  city?: string;
  district?: string;
  lat: number;
  lng: number;
  distKm: number;
  travelMin: number;
  emergencyOpen24h: boolean;
  bedsAvailable: number;
  bedsTotal: number;
  specialistsAvailable: number;
  matchScore?: number;
  empanelledSchemes?: string[];
  diagnosticsAvailable?: string[];
}

interface LiveFacilityMapProps {
  onLocationChange?: (lat: number, lng: number, address: string) => void;
  selectedFacilityId?: string | null;
  onSelectFacility?: (facility: FacilityMarkerData) => void;
  height?: string | number;
  showSearch?: boolean;
  compact?: boolean;
}

const DEFAULT_LAT = 16.5062; // Vijayawada / Amaravati Capital Region
const DEFAULT_LNG = 80.6480;

const LEVEL_COLORS: Record<string, string> = {
  sub_centre: '#475569',
  phc: '#0d9488',
  rural_hospital: '#d97706',
  district_hospital: '#2563eb',
  civil_hospital: '#7c3aed',
  aiims: '#9333ea'
};

const LEVEL_LABELS: Record<string, Record<Lang, string>> = {
  sub_centre: { en: 'Sub-Centre', hi: 'उप-केंद्र', mr: 'उप-केंद्र', te: 'ఉప-కేంద్రం', kn: 'ಉಪ-ಕೇಂದ್ರ' },
  phc: { en: 'Primary Health Centre (PHC)', hi: 'प्राथमिक स्वास्थ्य केंद्र (PHC)', mr: 'प्राथमिक आरोग्य केंद्र (PHC)', te: 'ప్రాథమిక ఆరోగ్య కేంద్రం (PHC)', kn: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ (PHC)' },
  rural_hospital: { en: 'Community / Rural Hospital', hi: 'सामुदायिक / ग्रामीण अस्पताल', mr: 'ग्रामीण रुग्णालय', te: 'కమ్యూనిటీ / ప్రాంతీయ ఆసుపత్రి', kn: 'ಗ್ರಾಮೀಣ ಆಸ್ಪತ್ರೆ' },
  district_hospital: { en: 'District Hospital', hi: 'जिला अस्पताल', mr: 'जिल्हा रुग्णालय', te: 'జిల్లా ఆసుపత్రి', kn: 'ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆ' },
  civil_hospital: { en: 'Tertiary / Medical College', hi: 'मेडिकल कॉलेज / तृतीयक केंद्र', mr: 'वैद्यकीय महाविद्यालय', te: 'మెడికల్ కాలేజ్ / ఎయిమ్స్', kn: 'ವೈದ್ಯಕೀಯ ಕಾಲೇಜು' },
  aiims: { en: 'AIIMS / Super Specialty', hi: 'एम्स सुपर स्पेशलिटी', mr: 'एम्स सुपर स्पेशालिटी', te: 'ఎయిమ్స్ సూపర్ స్పెషాలిటీ', kn: 'ಏಮ್ಸ್ ಸೂಪರ್ ಸ್ಪೆಷಾಲಿಟಿ' }
};

// Common Indian Location Presets for fast testing & navigation
const QUICK_PRESETS = [
  { name: 'Amaravati / Vijayawada (AP)', lat: 16.5062, lng: 80.6480, lang: 'te' },
  { name: 'Mangalagiri AIIMS (AP)', lat: 16.4419, lng: 80.5746, lang: 'te' },
  { name: 'Inavolu Village, Guntur (AP)', lat: 16.5120, lng: 80.5210, lang: 'te' },
  { name: 'Palghar Rural Tribal Block (MH)', lat: 19.6967, lng: 72.7699, lang: 'mr' },
  { name: 'Bangalore Rural / Devanahalli (KA)', lat: 13.2484, lng: 77.7126, lang: 'kn' }
];

export const LiveFacilityMap: React.FC<LiveFacilityMapProps> = ({
  onLocationChange,
  selectedFacilityId,
  onSelectFacility,
  height = 420,
  showSearch = true,
  compact = false
}) => {
  const { lang, setLang } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as Lang;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const facilityMarkersLayerRef = useRef<L.LayerGroup | null>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [locationLabel, setLocationLabel] = useState<string>('Amaravati / Vijayawada Region');
  const [facilities, setFacilities] = useState<FacilityMarkerData[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(false);
  const [detectingGPS, setDetectingGPS] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'all' | 'emergency' | 'phc' | 'hospital'>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Helper to create custom HTML icons
  const createUserPinIcon = () => {
    return L.divIcon({
      className: 'custom-user-map-pin',
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: map-pulse 2s infinite ease-out;"></div>
          <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  };

  const createFacilityPinIcon = (facility: FacilityMarkerData, isSelected: boolean) => {
    const color = LEVEL_COLORS[facility.level] || '#0d9488';
    const is24h = facility.emergencyOpen24h;
    const border = isSelected ? '#1e293b' : '#ffffff';
    const size = isSelected ? 38 : 32;

    return L.divIcon({
      className: 'custom-facility-map-pin',
      html: `
        <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.15s ease;">
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 8px;
            background: ${color};
            border: 2px solid ${border};
            box-shadow: 0 3px 8px rgba(0,0,0,0.28);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 700;
            font-size: ${isSelected ? '14px' : '12px'};
            font-family: sans-serif;
          ">
            ${is24h ? '+' : 'H'}
          </div>
          ${facility.distKm !== undefined ? `
            <div style="
              position: absolute;
              bottom: -16px;
              background: #0f172a;
              color: #f8fafc;
              font-size: 10px;
              font-weight: 600;
              padding: 1px 4px;
              border-radius: 3px;
              white-space: nowrap;
              border: 1px solid rgba(255,255,255,0.2);
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            ">
              ${facility.distKm} km
            </div>
          ` : ''}
        </div>
      `,
      iconSize: [size, size + 16],
      iconAnchor: [size / 2, size / 2]
    });
  };

  // Fetch facilities for a given coordinate
  const fetchFacilities = async (lat: number, lng: number, label?: string) => {
    setLoadingFacilities(true);
    try {
      // Auto-detect regional language if user hasn't pinned manual override
      fetch(`${BASE}/api/location/detect-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      }).then(r => r.json()).then(loc => {
        if (loc.language && !localStorage.getItem('al-lang-manual-override')) {
          setLang(loc.language);
        }
      }).catch(() => {});

      const res = await fetch(`${BASE}/api/distance?lat=${lat}&lng=${lng}`);
      const json = await res.json();
      const list: FacilityMarkerData[] = json.data || [];
      setFacilities(list);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));

      if (label) {
        setLocationLabel(label);
        onLocationChange?.(lat, lng, label);
      }
    } catch (err) {
      console.error('Failed to load facilities:', err);
    } finally {
      setLoadingFacilities(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentCoords.lat, currentCoords.lng],
      zoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors | NHM GIS'
    }).addTo(map);

    // Attribution subtle line
    L.control.attribution({ position: 'bottomright', prefix: 'NHM · OpenStreetMap' }).addTo(map);

    const facilityLayer = L.layerGroup().addTo(map);
    facilityMarkersLayerRef.current = facilityLayer;

    // Add user marker
    const userMarker = L.marker([currentCoords.lat, currentCoords.lng], {
      icon: createUserPinIcon(),
      draggable: true,
      title: 'Your Location'
    }).addTo(map);

    userMarker.on('dragend', () => {
      const pos = userMarker.getLatLng();
      setCurrentCoords({ lat: pos.lat, lng: pos.lng });
      const customLabel = `Pinned: ${pos.lat.toFixed(4)}°N, ${pos.lng.toFixed(4)}°E`;
      setLocationLabel(customLabel);
      fetchFacilities(pos.lat, pos.lng, customLabel);
    });

    userMarkerRef.current = userMarker;

    // Click anywhere on map to reposition user
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      userMarker.setLatLng([lat, lng]);
      setCurrentCoords({ lat, lng });
      const customLabel = `Map Clicked: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
      setLocationLabel(customLabel);
      fetchFacilities(lat, lng, customLabel);
    });

    mapInstanceRef.current = map;

    // Initial facilities load
    fetchFacilities(currentCoords.lat, currentCoords.lng, 'Amaravati / Vijayawada Region');

    // Auto-detect browser GPS on initial render if permitted
    if (navigator.geolocation && !localStorage.getItem('al_gps_attempted')) {
      localStorage.setItem('al_gps_attempted', '1');
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          setCurrentCoords({ lat: latitude, lng: longitude });
          userMarker.setLatLng([latitude, longitude]);
          map.setView([latitude, longitude], 13);
          fetchFacilities(latitude, longitude, 'Detected GPS Location');
        },
        () => {},
        { timeout: 6000 }
      );
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update facility markers when facilities or filter change
  useEffect(() => {
    if (!facilityMarkersLayerRef.current || !mapInstanceRef.current) return;
    const layer = facilityMarkersLayerRef.current;
    layer.clearLayers();

    const filtered = facilities.filter(f => {
      if (filterType === 'emergency') return f.emergencyOpen24h;
      if (filterType === 'phc') return f.level === 'phc' || f.level === 'sub_centre';
      if (filterType === 'hospital') return f.level === 'district_hospital' || f.level === 'rural_hospital' || f.level === 'civil_hospital' || f.level === 'aiims';
      return true;
    });

    filtered.forEach(f => {
      if (typeof f.lat !== 'number' || typeof f.lng !== 'number') return;
      const isSelected = selectedFacilityId === f.facilityId;
      const marker = L.marker([f.lat, f.lng], {
        icon: createFacilityPinIcon(f, isSelected),
        title: f.name
      });

      const displayName = currentLang === 'te' ? (f.nameTelugu || f.name)
        : currentLang === 'kn' ? (f.nameKannada || f.name)
        : currentLang === 'mr' ? (f.nameMarathi || f.name)
        : currentLang === 'hi' ? (f.nameHindi || f.name)
        : f.name;

      const levelTitle = LEVEL_LABELS[f.level]?.[currentLang] || f.level;

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b; min-width: 220px; max-width: 260px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="background: ${LEVEL_COLORS[f.level] || '#0d9488'}; color: #ffffff; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; text-transform: uppercase;">
              ${levelTitle}
            </span>
            ${f.emergencyOpen24h ? '<span style="background: #fee2e2; color: #b91c1c; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px;">24x7 EMERGENCY</span>' : ''}
          </div>
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
            ${displayName}
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
            ${f.address || f.city || f.district || ''}
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; margin-bottom: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <div>
              <span style="color: #64748b; font-size: 10px;">Distance:</span>
              <div style="font-weight: 700; color: #0d9488;">${f.distKm} km (~${f.travelMin}m)</div>
            </div>
            <div>
              <span style="color: #64748b; font-size: 10px;">Beds Free:</span>
              <div style="font-weight: 700; color: ${f.bedsAvailable > 0 ? '#15803d' : '#b91c1c'};">${f.bedsAvailable} / ${f.bedsTotal}</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <a href="#opd" style="flex: 1; text-align: center; background: #0d9488; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-decoration: none;">
              Book OP Token
            </a>
            ${f.phone ? `<a href="tel:${f.phone}" style="background: #f1f5f9; color: #334155; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-decoration: none; border: 1px solid #cbd5e1;">Call</a>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });
      marker.on('click', () => {
        onSelectFacility?.(f);
      });

      marker.addTo(layer);
    });
  }, [facilities, filterType, selectedFacilityId, currentLang]);

  // Handler for GPS Auto-detect
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setDetectingGPS(false);
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });
        if (userMarkerRef.current) userMarkerRef.current.setLatLng([latitude, longitude]);
        if (mapInstanceRef.current) mapInstanceRef.current.setView([latitude, longitude], 13);
        fetchFacilities(latitude, longitude, 'Detected GPS Location');
      },
      err => {
        setDetectingGPS(false);
        console.warn('GPS failed or denied:', err);
        // Fallback to default
        fetchFacilities(DEFAULT_LAT, DEFAULT_LNG, 'Amaravati / Vijayawada Region (GPS denied)');
      },
      { timeout: 8000 }
    );
  };

  // Handler for Pincode / Village search using OpenStreetMap Nominatim
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setSearching(true);
    try {
      // Check if it matches a numeric Indian 6-digit Pincode or text location
      const isPincode = /^\d{6}$/.test(query);
      const searchUrl = isPincode
        ? `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(query)}&country=India&format=json&limit=1`
        : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', India')}&format=json&limit=1`;

      const res = await fetch(searchUrl, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const display = item.display_name.split(',').slice(0, 3).join(',');

        setCurrentCoords({ lat, lng });
        if (userMarkerRef.current) userMarkerRef.current.setLatLng([lat, lng]);
        if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 13);
        fetchFacilities(lat, lng, display);
      } else {
        // Fallback check against preset names
        const presetMatch = QUICK_PRESETS.find(p => p.name.toLowerCase().includes(query.toLowerCase()));
        if (presetMatch) {
          setCurrentCoords({ lat: presetMatch.lat, lng: presetMatch.lng });
          if (userMarkerRef.current) userMarkerRef.current.setLatLng([presetMatch.lat, presetMatch.lng]);
          if (mapInstanceRef.current) mapInstanceRef.current.setView([presetMatch.lat, presetMatch.lng], 13);
          fetchFacilities(presetMatch.lat, presetMatch.lng, presetMatch.name);
        } else {
          alert(`Location "${query}" not found. Try entering a nearby town, district, or 6-digit pincode.`);
        }
      }
    } catch (err) {
      console.error('Search geocoding error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setCurrentCoords({ lat: preset.lat, lng: preset.lng });
    if (userMarkerRef.current) userMarkerRef.current.setLatLng([preset.lat, preset.lng]);
    if (mapInstanceRef.current) mapInstanceRef.current.setView([preset.lat, preset.lng], 13);
    fetchFacilities(preset.lat, preset.lng, preset.name);
  };

  const labels = {
    en: {
      mapTitle: 'Interactive Health Facility GIS Map',
      locationStatus: 'Active Patient Location',
      gpsBtn: 'Auto-Detect GPS',
      gpsDetecting: 'Acquiring GPS…',
      searchPlaceholder: 'Enter Village, Town, or 6-digit Pincode…',
      searchBtn: 'Search Area',
      all: 'All Facilities',
      emergency: '24x7 Emergency Only',
      phc: 'PHCs & Sub-Centres',
      hospitals: 'Hospitals & AIIMS',
      facilitiesNearby: 'Nearby Health Facilities',
      clickHint: 'Click anywhere on map or drag pin to change location',
      updated: 'Updated'
    },
    hi: {
      mapTitle: 'राष्ट्रीय स्वास्थ्य सुविधा इंटरेक्टिव नक्शा (GIS)',
      locationStatus: 'सक्रिय नागरिक लोकेशन',
      gpsBtn: 'ऑटो-डिटेक्ट GPS',
      gpsDetecting: 'GPS खोजा जा रहा है…',
      searchPlaceholder: 'गांव, कस्बा या 6-अंकीय पिनकोड दर्ज करें…',
      searchBtn: 'खोजें',
      all: 'सभी केंद्र',
      emergency: '24x7 आपातकालीन',
      phc: 'प्राथमिक स्वास्थ्य केंद्र (PHC)',
      hospitals: 'अस्पताल एवं एम्स',
      facilitiesNearby: 'निकटतम स्वास्थ्य केंद्र',
      clickHint: 'स्थान बदलने के लिए नक्शे पर क्लिक करें या पिन खींचें',
      updated: 'अपडेट'
    },
    mr: {
      mapTitle: 'आरोग्य सुविधा नकाशा व स्थान दर्शक (GIS)',
      locationStatus: 'सक्रिय नागरिक स्थान',
      gpsBtn: 'ऑटो-डिटेक्ट GPS',
      gpsDetecting: 'GPS शोधत आहे…',
      searchPlaceholder: 'गाव, शहर किंवा ६-अंकी पिनकोड टाका…',
      searchBtn: 'शोधा',
      all: 'सर्व आरोग्य केंद्रे',
      emergency: '२४x७ आणीबाणी',
      phc: 'प्राथमिक आरोग्य केंद्र (PHC)',
      hospitals: 'रुग्णालये व एम्स',
      facilitiesNearby: 'जवळची आरोग्य केंद्रे',
      clickHint: 'स्थान बदलण्यासाठी नकाशावर क्लिक करा किंवा पिन ड्रॅग करा',
      updated: 'अपडेट'
    },
    te: {
      mapTitle: 'లైవ్ హెల్త్ ఫెసిలిటీ మ్యాప్ (GIS నెట్‌వర్క్)',
      locationStatus: 'ప్రస్తుత రోగి స్థానం',
      gpsBtn: 'ఆటో-డిటెక్ట్ GPS',
      gpsDetecting: 'GPS గుర్తిస్తోంది…',
      searchPlaceholder: 'గ్రామం, ప్రాంతం లేదా 6-అంకెల పిన్‌కోడ్ నమోదు చేయండి…',
      searchBtn: 'వెతకండి',
      all: 'అన్ని కేంద్రాలు',
      emergency: '24x7 అత్యవసర సేవలు',
      phc: 'PHC & ఉప-కేంద్రాలు',
      hospitals: 'ఆసుపత్రులు & ఎయిమ్స్',
      facilitiesNearby: 'సమీప ఆరోగ్య సదుపాయాలు',
      clickHint: 'స్థానాన్ని మార్చడానికి మ్యాప్‌పై క్లిక్ చేయండి లేదా పిన్‌ను తరలించండి',
      updated: 'తాజాకరించబడింది'
    },
    kn: {
      mapTitle: 'ಆರೋಗ್ಯ ಸೌಲಭ್ಯಗಳ ಲೈವ್ ನಕ್ಷೆ (GIS)',
      locationStatus: 'ಪ್ರಸ್ತುತ ನಾಗರಿಕ ಸ್ಥಳ',
      gpsBtn: 'ಆಟೋ-ಡಿಟೆಕ್ಟ್ GPS',
      gpsDetecting: 'GPS ಪಡೆಯಲಾಗುತ್ತಿದೆ…',
      searchPlaceholder: 'ಗ್ರಾಮ, ಪಟ್ಟಣ ಅಥವಾ 6-ಅಂಕಿಯ ಪಿನ್‌ಕೋಡ್ ನಮೂದಿಸಿ…',
      searchBtn: 'ಹುಡುಕಿ',
      all: 'ಎಲ್ಲಾ ಕೇಂದ್ರಗಳು',
      emergency: '24x7 ತುರ್ತು ಮಾತ್ರ',
      phc: 'PHC ಮತ್ತು ಉಪ-ಕೇಂದ್ರಗಳು',
      hospitals: 'ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ಏಮ್ಸ್',
      facilitiesNearby: 'ಸಮೀಪದ ಆರೋಗ್ಯ ಸೌಲಭ್ಯಗಳು',
      clickHint: 'ಸ್ಥಳ ಬದಲಾಯಿಸಲು ನಕ್ಷೆಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಪಿನ್ ಎಳೆಯಿರಿ',
      updated: 'ನವೀಕರಿಸಲಾಗಿದೆ'
    }
  };

  const l = labels[currentLang] || labels.en;

  return (
    <div className="card" style={{ overflow: 'hidden', border: '1px solid var(--col-border)' }}>
      {/* Header bar */}
      <div className="card-header" style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid var(--col-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--col-teal)" strokeWidth="2" width="18" height="18">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          <strong style={{ fontSize: '0.875rem', color: 'var(--col-teal-dark)' }}>{l.mapTitle}</strong>
          {loadingFacilities && (
            <span className="badge badge-info" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Loading…</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={handleUseGPS}
            disabled={detectingGPS}
            className="btn btn-sm btn-ghost"
            style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ffffff', border: '1px solid var(--col-border)' }}
            title="Detect location automatically via browser GPS"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="2" x2="12" y2="6"/>
              <line x1="12" y1="18" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="6" y2="12"/>
              <line x1="18" y1="12" x2="22" y2="12"/>
            </svg>
            {detectingGPS ? l.gpsDetecting : l.gpsBtn}
          </button>
        </div>
      </div>

      {/* Active Location Info & Search */}
      {showSearch && (
        <div style={{ padding: '8px 12px', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
          {/* Active location chip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }}></span>
              <span style={{ color: 'var(--col-ink-muted)', fontSize: '0.75rem' }}>{l.locationStatus}:</span>
              <strong style={{ color: 'var(--col-ink)', fontSize: '0.8125rem' }}>{locationLabel}</strong>
            </div>
            {lastUpdated && (
              <span style={{ fontSize: '0.7rem', color: 'var(--col-ink-muted)' }}>
                {l.updated} {lastUpdated}
              </span>
            )}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input
              type="text"
              className="form-control"
              placeholder={l.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '4px 10px', height: 32 }}
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="btn btn-sm btn-primary"
              style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap', height: 32 }}
            >
              {searching ? '…' : l.searchBtn}
            </button>
          </form>

          {/* Quick presets pills */}
          {!compact && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--col-ink-muted)' }}>Quick Presets:</span>
              {QUICK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="badge badge-neutral"
                  style={{ cursor: 'pointer', fontSize: '0.7rem', border: '1px solid #e2e8f0', background: '#f8fafc', padding: '2px 6px' }}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Chips */}
      <div style={{ padding: '6px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {[
          { id: 'all', label: `${l.all} (${facilities.length})` },
          { id: 'emergency', label: l.emergency },
          { id: 'phc', label: l.phc },
          { id: 'hospital', label: l.hospitals }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id as typeof filterType)}
            className={`btn btn-sm ${filterType === f.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.72rem', padding: '2px 8px', height: 24, whiteSpace: 'nowrap' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          width: '100%',
          position: 'relative',
          zIndex: 1,
          background: '#e5e7eb'
        }}
      />

      {/* Bottom status line */}
      <div style={{ padding: '6px 12px', background: '#ffffff', borderTop: '1px solid var(--col-border)', fontSize: '0.75rem', color: 'var(--col-ink-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📍 {l.clickHint}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: LEVEL_COLORS.phc }}></span> PHC
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: LEVEL_COLORS.rural_hospital }}></span> Area/RH
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: LEVEL_COLORS.district_hospital }}></span> District/AIIMS
          </span>
        </div>
      </div>
    </div>
  );
};
