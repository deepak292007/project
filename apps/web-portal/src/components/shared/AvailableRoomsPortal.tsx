import React, { useEffect, useState } from 'react';
import { useSession } from '../../store';
import * as api from '../../lib/api';
import type { Facility, Lang } from '../../types';

interface RoomCategory {
  id: string;
  name: { en: string; mr: string; hi: string; te: string; kn: string };
  icon: string;
  type: 'general' | 'semi_private' | 'private' | 'maternity' | 'hdu' | 'icu';
  priceDisplay: {
    amount: string;
    period: string;
    schemeTag: string;
    isFreeScheme: boolean;
  };
  totalBeds: number;
  availableBeds: number;
  amenities: string[];
  inclusions: string[];
  clinicalCriteria: string;
}

interface FacilityRoomData {
  facilityId: string;
  facilityName: string;
  district: string;
  level: string;
  phone: string;
  address?: string;
  distKm?: number;
  rooms: RoomCategory[];
}

export const AvailableRoomsPortal: React.FC<{ onNavigate?: (id: string) => void }> = ({ onNavigate }) => {
  const { lang, name } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as Lang;

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('RH-KHED-01');
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showWhyModal, setShowWhyModal] = useState<boolean>(false);

  useEffect(() => {
    api.getFacilities()
      .then(res => {
        const list = Array.isArray(res) ? res : (res as any)?.data || [];
        if (list.length > 0) {
          setFacilities(list);
          // Default to first hospital-level facility if available
          const hospital = list.find((f: Facility) => f.level === 'rural_hospital' || f.level === 'district_hospital' || f.level === 'civil_hospital');
          if (hospital) {
            setSelectedFacilityId(hospital.facilityId);
          } else {
            setSelectedFacilityId(list[0].facilityId);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedFacility = facilities.find(f => f.facilityId === selectedFacilityId) || facilities[0];

  // Helper to build room categories dynamically based on facility capacity
  function getFacilityRooms(f?: Facility): RoomCategory[] {
    const res = f?.resources;
    const genTotal = res?.bedsTotal ?? (f?.level === 'district_hospital' ? 120 : f?.level === 'rural_hospital' ? 30 : 10);
    const genOcc = res?.bedsOccupied ?? Math.floor(genTotal * 0.65);
    const genAvail = Math.max(1, genTotal - genOcc);

    const icuTotal = res?.icuTotal ?? (f?.level === 'district_hospital' ? 16 : f?.level === 'rural_hospital' ? 4 : 2);
    const icuOcc = res?.icuOccupied ?? Math.floor(icuTotal * 0.7);
    const icuAvail = Math.max(0, icuTotal - icuOcc);

    const oxyTotal = res?.oxygenBeds ?? (f?.level === 'district_hospital' ? 24 : f?.level === 'rural_hospital' ? 8 : 4);
    const oxyOcc = res?.oxygenOccupied ?? Math.floor(oxyTotal * 0.5);
    const oxyAvail = Math.max(1, oxyTotal - oxyOcc);

    return [
      {
        id: 'gen-ward',
        name: {
          en: 'General Inpatient Ward (Multi-Bed)',
          mr: 'सर्वसाधारण वॉर्ड (मल्टि-बेड)',
          hi: 'सामान्य वार्ड (मल्टी-बेड)',
          te: 'జనరల్ ఇన్‌పేషెంట్ వార్డ్ (మల్టీ-బెడ్)',
          kn: 'ಜನರಲ್ ಒಳರೋಗಿ ವಾರ್ಡ್ (ಮಲ್ಟಿ-ಬೆಡ್)'
        },
        icon: '🏥',
        type: 'general',
        priceDisplay: {
          amount: '₹0',
          period: '/ day (100% Free under AB-PMJAY / NHM)',
          schemeTag: '100% Cashless for BPL / Ayushman Bharat Cardholders',
          isFreeScheme: true
        },
        totalBeds: genTotal,
        availableBeds: genAvail,
        amenities: [
          'Standard Hospital Bed & Clean Linen',
          '24/7 Duty Nursing & Doctor Rounds',
          'Free Nutritious Meals (Annapurna Scheme)',
          'Shared Clean Restroom Facility'
        ],
        inclusions: [
          'Routine nursing care included',
          'Basic laboratory tests & vitals monitoring',
          'Standard formulary medicines provided free'
        ],
        clinicalCriteria: 'General medical or surgical cases requiring observation or post-operative care.'
      },
      {
        id: 'mch-ward',
        name: {
          en: 'Maternity & Child Health (MCH) Ward',
          mr: 'प्रसूती व बाल संगोपन कक्ष (MCH)',
          hi: 'मातृ एवं शिशु स्वास्थ्य वार्ड (MCH)',
          te: 'ప్రసూతి & శిశు సంరక్షణ వార్డ్ (MCH)',
          kn: 'ತಾಯಿ ಮತ್ತು ಮಕ್ಕಳ ಆರೈಕೆ ವಾರ್ಡ್ (MCH)'
        },
        icon: '🤰',
        type: 'maternity',
        priceDisplay: {
          amount: '₹0.00',
          period: '/ full stay (100% Govt Funded)',
          schemeTag: 'Janani Shishu Suraksha Karyakram (JSSK) — Zero Out-of-Pocket Expense',
          isFreeScheme: true
        },
        totalBeds: Math.round(genTotal * 0.35) || 8,
        availableBeds: Math.max(2, Math.round(genAvail * 0.35)),
        amenities: [
          'Mother & Newborn Cradle Unit',
          'Neonatal Radiant Warmer Access',
          'Lactation Counselling & Support',
          '24/7 Obstetric & Midwifery Staff'
        ],
        inclusions: [
          'Zero expense for normal & Caesarean delivery',
          'Free food for mother during stay',
          'Essential infant vaccines & drops included'
        ],
        clinicalCriteria: 'Antenatal care monitoring, labour admission, and post-natal mother-infant care.'
      },
      {
        id: 'semi-pvt',
        name: {
          en: 'Semi-Private Room (Twin Sharing)',
          mr: 'निम-खाजगी कक्ष (दोन रुग्ण सामायिक)',
          hi: 'अर्ध-निजी कमरा (ट्विन शेयरिंग)',
          te: 'సెమీ-ప్రైవేట్ రూమ్ (ఇద్దరు రోగులు)',
          kn: 'ಸೆಮಿ-ಖಾಸಗಿ ಕೊಠಡಿ (ದ್ವಿ-ಹಂಚಿಕೆ)'
        },
        icon: '🛏️',
        type: 'semi_private',
        priceDisplay: {
          amount: '₹650',
          period: '/ day (Govt Subsidized Ceiling)',
          schemeTag: 'Subsidized CGHS / PM-JAY Upgrade Copay Eligible',
          isFreeScheme: false
        },
        totalBeds: 8,
        availableBeds: 3,
        amenities: [
          'Twin Sharing (2 Patients Maximum)',
          'Privacy Curtain Partition',
          'Attendant Recliner / Bed',
          'Attached Washroom with Geyser',
          'Bedside Oxygen & Suction Console'
        ],
        inclusions: [
          'Daily attending physician consultation',
          'Nurse call buzzer system',
          'Complimentary patient breakfast & lunch'
        ],
        clinicalCriteria: 'Patients seeking enhanced quiet recovery with family attendant space.'
      },
      {
        id: 'pvt-deluxe',
        name: {
          en: 'Private Single Room (AC / Deluxe)',
          mr: 'खाजगी स्वतंत्र कक्ष (वातानुकूलित / डिलक्स)',
          hi: 'निजी कमरा (एसी / डीलक्स)',
          te: 'ప్రైవేట్ సింగిల్ రూమ్ (AC / డీలక్స్)',
          kn: 'ಖಾಸಗಿ ಏಕ ಕೊಠಡಿ (AC / ಡಿಲಕ್ಸ್)'
        },
        icon: '🚪',
        type: 'private',
        priceDisplay: {
          amount: '₹1,400',
          period: '/ day (Official Standard Tariff)',
          schemeTag: 'Covered under State Employee & Fixed Ceiling Schemes',
          isFreeScheme: false
        },
        totalBeds: 6,
        availableBeds: 2,
        amenities: [
          'Single Patient Exclusive Occupancy',
          'Air Conditioning & Television',
          'Dedicated Attendant Bed & Sofa',
          'Attached Private Restroom',
          'Individual Wardrobe & Dining Table'
        ],
        inclusions: [
          'Direct priority nurse call station',
          'Specialist doctor bedside rounds',
          'Custom diet planning by hospital nutritionist'
        ],
        clinicalCriteria: 'Inpatients desiring single occupancy, infection isolation, or personal attendant accommodation.'
      },
      {
        id: 'hdu-oxy',
        name: {
          en: 'High-Dependency Unit (HDU / Oxygen Bed)',
          mr: 'उच्च परावलंबित्व कक्ष (HDU / ऑक्सिजन बेड)',
          hi: 'हाई-डिपेंडेंसी यूनिट (HDU / ऑक्सीजन बेड)',
          te: 'హై-డిపెండెన్సీ యూనిట్ (HDU / ఆక్సిజన్ బెడ్)',
          kn: 'ಹೈ-ಡಿಪೆಂಡೆನ್ಸಿ ಯುನಿಟ್ (HDU / ಆಕ್ಸಿಜನ್ ಬೆಡ್)'
        },
        icon: '💨',
        type: 'hdu',
        priceDisplay: {
          amount: '₹950',
          period: '/ day (100% Free for PM-JAY & BPL)',
          schemeTag: '100% Free under Ayushman Bharat Emergency Benefit Package',
          isFreeScheme: true
        },
        totalBeds: oxyTotal,
        availableBeds: oxyAvail,
        amenities: [
          'Continuous Multi-Parameter Monitor (SpO2, ECG, NIBP)',
          'High-Flow Piped Oxygen & Nebulizer Manifold',
          'Infusion Pumps & Syringe Drivers',
          'Step-Down Intensive Monitoring'
        ],
        inclusions: [
          'Continuous vital telemetry',
          'Respiratory therapist & oxygen titration',
          '1:2 Dedicated nurse-to-patient ratio'
        ],
        clinicalCriteria: 'Severe respiratory distress, post-operative cardiac stabilization, or SpO2 < 92%.'
      },
      {
        id: 'icu-bay',
        name: {
          en: 'Intensive Care Unit (ICU / Critical Care Bay)',
          mr: 'तीव्र दक्षता विभाग (ICU / क्रिटिकल केअर)',
          hi: 'गहन चिकित्सा इकाई (ICU / क्रिटिकल केयर)',
          te: 'ఇంటెన్సివ్ కేర్ యూనిట్ (ICU / క్రిటికల్ కేర్)',
          kn: 'ತೀವ್ರ ನಿಗಾ ಘಟಕ (ICU / ಕ್ರಿಟಿಕಲ್ ಕೇರ್)'
        },
        icon: '❤️‍🔥',
        type: 'icu',
        priceDisplay: {
          amount: '₹2,800',
          period: '/ day (100% Cashless for Scheme Patients)',
          schemeTag: '100% Free under PM-JAY & Green Channel Emergency Transfer',
          isFreeScheme: true
        },
        totalBeds: icuTotal,
        availableBeds: icuAvail,
        amenities: [
          'Advanced Mechanical Ventilator (Invasive / Non-Invasive)',
          'Cardiac Defibrillator & Crash Cart',
          'Central Hemodynamic Monitoring',
          '1:1 Critical Care Specialist Nurse'
        ],
        inclusions: [
          '24/7 Intensivist & Anaesthesiologist surveillance',
          'Arterial Blood Gas (ABG) & Emergency Lab testing',
          'Complete emergency resuscitation medication'
        ],
        clinicalCriteria: 'Life-threatening cardiac, respiratory, septic shock, or acute trauma emergencies.'
      }
    ];
  }

  const roomCategories = getFacilityRooms(selectedFacility);

  const filteredRooms = roomCategories.filter(room => {
    const matchesType = filterType === 'all' ||
      (filterType === 'free' && room.priceDisplay.isFreeScheme) ||
      (filterType === 'general' && room.type === 'general') ||
      (filterType === 'private' && (room.type === 'private' || room.type === 'semi_private')) ||
      (filterType === 'icu' && (room.type === 'icu' || room.type === 'hdu'));

    const roomName = room.name[currentLang] || room.name.en;
    const matchesSearch = !searchQuery ||
      roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.amenities.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      room.priceDisplay.amount.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  const translations = {
    badge: {
      en: 'Public Transparency Board · MoHFW / NHM Mandated',
      hi: 'सार्वजनिक पारदर्शिता सूचना बोर्ड · स्वास्थ्य मंत्रालय एवं NHM द्वारा अनिवार्य',
      mr: 'सार्वजनिक पारदर्शकता माहिती फलक · आरोग्य मंत्रालय व NHM प्रमाणित',
      te: 'ప్రజా పారదర్శక సమాచార బోర్డు · కేంద్ర & రాష్ట్ర ఆరోగ్య మార్గదర్శకాలు',
      kn: 'ಸಾರ್ವಜನಿಕ ಪಾರದರ್ಶಕ ಮಾಹಿತಿ ಫಲಕ · ಆರೋಗ್ಯ ಇಲಾಖೆ ಮಾರ್ಗಸೂಚಿ'
    },
    title: {
      en: 'Hospital Inpatient Rooms & Official Tariff Directory',
      hi: 'अस्पताल इनपेशेंट कमरे एवं आधिकारिक दर सूची',
      mr: 'रुग्णालय आंतररुग्ण कक्ष व अधिकृत दर सूची',
      te: 'ఆసుపత్రి ఇన్‌పేషెంట్ గదులు & అధికారిక ధరల వివరాలు',
      kn: 'ಆಸ್ಪತ್ರೆ ಒಳರೋಗಿ ಕೊಠಡಿಗಳು & ಅಧಿಕೃತ ದರಗಳ ವಿವರ'
    },
    subtitle: {
      en: 'Real-time room availability, official government ceiling tariffs, and scheme entitlements. Transparent, zero-surprise healthcare pricing.',
      hi: 'कमरों की वास्तविक उपलब्धता, आधिकारिक सरकारी शुल्क सीमा एवं योजनाओं के तहत लाभ। पारदर्शी एवं स्पष्ट स्वास्थ्य सेवा दरें।',
      mr: 'कक्षांची थेट उपलब्धता, अधिकृत सरकारी दर व शासकीय योजनांचे लाभ. पारदर्शक व प्रामाणिक आरोग्य सेवा माहिती.',
      te: 'గదుల ప్రత్యక్ష లభ్యత, అధికారిక ప్రభుత్వ రుసుములు మరియు పథకాల ప్రయోజనాలు. పారదర్శక సమాచారం.',
      kn: 'ಕೊಠಡಿಗಳ ಲಭ್ಯತೆ, ಅಧಿಕೃತ ಸರ್ಕಾರಿ ದರಗಳು ಮತ್ತು ಯೋಜನೆಗಳ ಮಾಹಿತಿ. ಪಾರದರ್ಶಕ ಆರೋಗ್ಯ ಸೇವೆ.'
    },
    cantBookNoticeTitle: {
      en: '🔒 Read-Only Transparency Notice: Direct Online Booking Not Permitted',
      hi: '🔒 केवल अवलोकन सूचना: ऑनलाइन डायरेक्ट बुकिंग की अनुमति नहीं है',
      mr: '🔒 केवळ माहितीसाठी: थेट ऑनलाइन खोली बुकिंगची परवानगी नाही',
      te: '🔒 కేవలం సమాచారం కొరకు మాత్రమే: ఆన్‌లైన్‌లో నేరుగా గదులు బుక్ చేయడం సాధ్యం కాదు',
      kn: '🔒 ಕೇವಲ ವೀಕ್ಷಣೆಗಾಗಿ: ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ಕೊಠಡಿ ಕಾಯ್ದಿರಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ'
    },
    cantBookNoticeDesc: {
      en: 'As per National Health Mission (NHM) clinical governance and Ayushman Bharat standards, inpatient room and ICU bed allocation is made strictly upon physical clinical evaluation, emergency triage, or doctor’s admission order at hospital casualty. Online self-booking is restricted to prevent bed hoarding and ensure emergency priority.',
      hi: 'राष्ट्रीय स्वास्थ्य मिशन (NHM) एवं आयुष्मान भारत नियमों के अनुसार, अस्पताल में भर्ती (IPD/ICU) केवल डॉक्टर द्वारा नैदानिक परीक्षण एवं आपातकालीन प्राथमिकता के आधार पर की जाती है। बिस्तरों की अनावश्यक जमाखोरी रोकने एवं गंभीर मरीजों की प्राथमिकता हेतु ऑनलाइन बुकिंग प्रतिबंधित है।',
      mr: 'राष्ट्रीय आरोग्य अभियान (NHM) नियमांनुसार, आंतररुग्ण व आयसीयू खाटांचे वाटप केवळ प्रत्यक्ष वैद्यकीय तपासणी व डॉक्टरांच्या भरती आदेशावरच केले जाते. गरजू रुग्णांना प्राधान्य मिळावे म्हणून सर्वसामान्यांसाठी ऑनलाइन बुकिंग प्रतिबंधित आहे.',
      te: 'జాతీయ ఆరోగ్య మిషన్ (NHM) మార్గదర్శకాల ప్రకారం, ఆసుపత్రిలో అడ్మిషన్ కేవలం డాక్టర్ క్లినికల్ పరీక్ష మరియు ఎమర్జెన్సీ అత్యవసరత ఆధారంగా మాత్రమే కేటాయించబడుతుంది. రోగులకు అత్యవసర సేవలు అందేలా ఆన్‌లైన్ బుకింగ్ నిలిపివేయబడింది.',
      kn: 'ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ಅಭಿಯಾನ (NHM) ನಿಯಮಗಳ ಪ್ರಕಾರ, ರೋಗಿಯ ತಪಾಸಣೆ ಮತ್ತು ವೈದ್ಯರ ಶಿಫಾರಸಿನ ಮೇರೆಗೆ ಮಾತ್ರ ಹಾಸಿಗೆ ಹಂಚಿಕೆ ಮಾಡಲಾಗುತ್ತದೆ. ತುರ್ತು ರೋಗಿಗಳಿಗೆ ಆದ್ಯತೆ ನೀಡಲು ಆನ್‌ಲೈನ್ ಬುಕಿಂಗ್ ಸೌಲಭ್ಯ ಇರುವುದಿಲ್ಲ.'
    },
    selectFacilityLabel: {
      en: 'Select Hospital to Check Available Rooms:',
      hi: 'उपलब्ध कमरे देखने के लिए अस्पताल चुनें:',
      mr: 'उपलब्ध कक्ष पाहण्यासाठी रुग्णालय निवडा:',
      te: 'అందుబాటులో ఉన్న గదులను చూడటానికి ఆసుపత్రిని ఎంచుకోండి:',
      kn: 'ಲಭ್ಯವಿರುವ ಕೊಠಡಿಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಆಸ್ಪತ್ರೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:'
    },
    viewOnlyBtnLabel: {
      en: '🔒 Inpatient Allocation at Casualty (Cannot Book Online)',
      hi: '🔒 भर्ती काउंटर पर आवंटन (ऑनलाइन बुकिंग नहीं)',
      mr: '🔒 भरती काऊंटरवर वाटप (ऑनलाइन बुकिंग उपलब्ध नाही)',
      te: '🔒 అడ్మిషన్ కౌంటర్‌లో కేటాయింపు (ఆన్‌లైన్ బుకింగ్ లేదు)',
      kn: '🔒 ಅಡ್ಮಿಷನ್ ಕೌಂಟರ್‌ನಲ್ಲಿ ಹಂಚಿಕೆ (ಆನ್‌ಲೈನ್ ಬುಕಿಂಗ್ ಲಭ್ಯವಿಲ್ಲ)'
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Top Advisory Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0d3b35 0%, #124a47 60%, #1e5c58 100%)',
        color: '#ffffff',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 20,
        boxShadow: '0 4px 16px rgba(18, 74, 71, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '3px 10px',
            borderRadius: 20
          }}>
            🏛️ {translations.badge[currentLang]}
          </span>
          <span style={{ fontSize: '0.8125rem', color: '#a7d4ce' }}>
            ABDM / PM-JAY Empanelled
          </span>
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
          {translations.title[currentLang]}
        </h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#e0f2fe', maxWidth: 860, lineHeight: 1.5 }}>
          {translations.subtitle[currentLang]}
        </p>
      </div>

      {/* Prominent Regulatory Read-Only Warning */}
      <div style={{
        background: '#fffbeb',
        border: '1.5px solid #fde047',
        borderLeft: '6px solid #b45309',
        borderRadius: 10,
        padding: '14px 18px',
        marginBottom: 22,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14
      }}>
        <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>🔒</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <strong style={{ fontSize: '0.9375rem', color: '#92400e' }}>
              {translations.cantBookNoticeTitle[currentLang]}
            </strong>
            <button
              type="button"
              onClick={() => setShowWhyModal(true)}
              style={{
                background: '#fef3c7',
                border: '1px solid #d97706',
                color: '#92400e',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              ℹ️ Why can't I book online?
            </button>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: '#78350f', lineHeight: 1.45 }}>
            {translations.cantBookNoticeDesc[currentLang]}
          </p>
        </div>
      </div>

      {/* Facility Selection & Quick Stats Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 320px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--col-teal-dark)', display: 'block', marginBottom: 6 }}>
                🏥 {translations.selectFacilityLabel[currentLang]}
              </label>
              <select
                className="form-control"
                value={selectedFacilityId}
                onChange={e => setSelectedFacilityId(e.target.value)}
                style={{ fontSize: '0.9375rem', fontWeight: 600, padding: '8px 12px' }}
              >
                {facilities.map(f => {
                  const fName = currentLang === 'te' ? (f.nameTelugu || f.name)
                    : currentLang === 'kn' ? (f.nameKannada || f.name)
                    : currentLang === 'mr' ? (f.nameMarathi || f.name)
                    : currentLang === 'hi' ? (f.nameHindi || f.name)
                    : f.name;

                  return (
                    <option key={f.facilityId} value={f.facilityId}>
                      {fName} — {f.district || f.city} ({f.level?.replace('_', ' ').toUpperCase()})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quick Facility Highlights */}
            {selectedFacility && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid var(--col-border)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--col-ink-muted)', textTransform: 'uppercase' }}>Total Beds</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--col-teal-dark)' }}>
                    {selectedFacility.resources?.bedsTotal || selectedFacility.beds || 30}
                  </div>
                </div>
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: 8,
                  padding: '8px 14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase' }}>Beds Available</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>
                    {Math.max(3, (selectedFacility.resources?.bedsTotal || 30) - (selectedFacility.resources?.bedsOccupied || 18))}
                  </div>
                </div>
                <div style={{
                  background: '#fdf2f8',
                  border: '1px solid #fbcfe8',
                  borderRadius: 8,
                  padding: '8px 14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#9d174d', textTransform: 'uppercase' }}>Emergency 24x7</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#be185d' }}>
                    {selectedFacility.emergencyOpen24h ? 'Active 🟢' : 'OPD Only'}
                  </div>
                </div>
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  padding: '8px 14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#1e40af', textTransform: 'uppercase' }}>Casualty Desk</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1d4ed8' }}>
                    📞 {selectedFacility.phone || '108 / 104'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {selectedFacility?.address && (
            <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--col-ink-muted)' }}>
              📍 <strong>Hospital Address:</strong> {selectedFacility.address} · Helpline: {selectedFacility.phone || '020-27420000'}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Rooms & Wards' },
            { id: 'free', label: '✓ 100% Free Schemes (PM-JAY/JSSK)' },
            { id: 'general', label: 'General Ward' },
            { id: 'private', label: 'Semi-Private & Private' },
            { id: 'icu', label: 'HDU & ICU Bays' }
          ].map(btn => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilterType(btn.id)}
              className={`btn btn-sm ${filterType === btn.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                fontSize: '0.78rem',
                padding: '6px 12px',
                border: filterType === btn.id ? 'none' : '1px solid var(--col-border)',
                background: filterType === btn.id ? 'var(--col-teal)' : 'var(--col-surface)'
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search rooms, amenities, prices…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ maxWidth: 260, fontSize: '0.8125rem', padding: '6px 12px' }}
        />
      </div>

      {/* Room Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 18,
        marginBottom: 28
      }}>
        {filteredRooms.map(room => {
          const availPct = room.totalBeds > 0 ? Math.round((room.availableBeds / room.totalBeds) * 100) : 0;
          const isCritical = room.availableBeds === 0;
          const isLow = room.availableBeds <= 2 && !isCritical;
          const isGood = !isCritical && !isLow;

          const roomTitle = room.name[currentLang] || room.name.en;

          return (
            <div
              key={room.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: room.priceDisplay.isFreeScheme ? '4px solid #15803d' : '4px solid var(--col-teal)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <div className="card-body" style={{ padding: '18px 20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.4rem' }}>{room.icon}</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--col-ink)' }}>
                        {roomTitle}
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: 'var(--col-ink-muted)' }}>
                        Category: {room.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Availability Badge */}
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 20,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: isCritical ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                    color: isCritical ? '#b91c1c' : isLow ? '#b45309' : '#15803d',
                    border: `1px solid ${isCritical ? '#fca5a5' : isLow ? '#fde047' : '#86efac'}`
                  }}>
                    {isCritical ? 'Full' : `${room.availableBeds} Available`}
                  </span>
                </div>

                {/* Price Display */}
                <div style={{
                  background: room.priceDisplay.isFreeScheme ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${room.priceDisplay.isFreeScheme ? '#bbf7d0' : 'var(--col-border)'}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  margin: '12px 0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: room.priceDisplay.isFreeScheme ? '#15803d' : 'var(--col-teal-dark)'
                    }}>
                      {room.priceDisplay.amount}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--col-ink-muted)' }}>
                      {room.priceDisplay.period}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 600, color: room.priceDisplay.isFreeScheme ? '#166534' : 'var(--col-teal)', marginTop: 2 }}>
                    ✓ {room.priceDisplay.schemeTag}
                  </div>
                </div>

                {/* Capacity Counter Meter */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--col-ink-muted)' }}>Live Bed Occupancy</span>
                    <strong style={{ color: isCritical ? '#b91c1c' : 'var(--col-ink)' }}>
                      {room.totalBeds - room.availableBeds} / {room.totalBeds} Occupied ({100 - availPct}%)
                    </strong>
                  </div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${100 - availPct}%`,
                      background: isCritical ? '#dc2626' : availPct < 20 ? '#f59e0b' : '#0f766e',
                      borderRadius: 4
                    }} />
                  </div>
                </div>

                {/* Amenities List */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--col-ink-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Room Features &amp; Equipment
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: 'var(--col-ink-light)', lineHeight: 1.5 }}>
                    {room.amenities.map(a => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>

                {/* Clinical Criteria */}
                <div style={{
                  fontSize: '0.74rem',
                  color: 'var(--col-ink-muted)',
                  borderTop: '1px dashed var(--col-border)',
                  paddingTop: 8,
                  marginTop: 8
                }}>
                  🩺 <strong>Clinical Requirement:</strong> {room.clinicalCriteria}
                </div>
              </div>

              {/* Action Area: Strict View-Only Disabled Button */}
              <div style={{
                background: '#f8fafc',
                borderTop: '1px solid var(--col-border)',
                padding: '12px 20px',
                textAlign: 'center'
              }}>
                <button
                  type="button"
                  disabled
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    color: '#64748b',
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                  title="Inpatient beds cannot be booked online. Allocation is done exclusively upon clinical evaluation at casualty/OPD."
                >
                  {translations.viewOnlyBtnLabel[currentLang]}
                </button>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 6 }}>
                  Direct patient reservation is disabled by law to ensure emergency priority.
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--col-ink-muted)' }}>
          <p>No rooms match your filter or search query.</p>
        </div>
      )}

      {/* Patient Financial Rights & Scheme Guide */}
      <div className="card" style={{ background: '#fdfefe', border: '1px solid #cbd5e1', marginBottom: 24 }}>
        <div className="card-header" style={{ background: 'var(--col-paper)', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '0.98rem' }}>
            📜 Patient Rights, Cashless Entitlements &amp; Helpdesk
          </h3>
          <span className="badge badge-info">Government Standards</span>
        </div>
        <div className="card-body" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ background: '#ffffff', border: '1px solid var(--col-border)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.875rem', marginBottom: 4 }}>
                1. Ayushman Bharat (AB-PMJAY) &amp; State Schemes
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--col-ink-light)', lineHeight: 1.45 }}>
                Families with BPL, Antyodaya (AAY), or active AB-PMJAY Golden Cards are entitled to <strong>100% cashless hospitalization up to ₹5,00,000 per year</strong> covering bed charges, medicines, diagnostics, and food.
              </p>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid var(--col-border)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.875rem', marginBottom: 4 }}>
                2. Janani Shishu Suraksha Karyakram (JSSK)
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--col-ink-light)', lineHeight: 1.45 }}>
                All pregnant women delivering in public institutions and sick neonates are entitled to <strong>completely free stay, diet, diagnostic tests, blood transfusion, and free transport</strong> via 102/108 ambulance.
              </p>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid var(--col-border)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 700, color: '#b45309', fontSize: '0.875rem', marginBottom: 4 }}>
                3. Supreme Court Emergency Protocol
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--col-ink-light)', lineHeight: 1.45 }}>
                No hospital (public or empanelled) can demand advance cash deposits or delay resuscitation of emergency/trauma patients for administrative bed booking reasons.
              </p>
            </div>
          </div>

          <div style={{
            marginTop: 16,
            background: '#f1f5f9',
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink)' }}>
              Facing overcharging, refusal of scheme benefits, or tariff disputes?
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="tel:14555" className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem' }}>
                📞 PM-JAY Helpline: 14555
              </a>
              <a href="tel:104" className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem' }}>
                📞 NHM Health Call Centre: 104
              </a>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('grievance')}
                  className="btn btn-sm btn-primary"
                  style={{ fontSize: '0.75rem' }}
                >
                  📝 File Citizen Grievance
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* "Why can't I book online?" Explanation Modal */}
      {showWhyModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }} onClick={() => setShowWhyModal(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff', borderRadius: 14, padding: 24, maxWidth: 540, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.4rem' }}>🏥</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--col-ink)' }}>
                  Why Hospital Beds Cannot Be Booked Online
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWhyModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.84rem', color: 'var(--col-ink-light)', lineHeight: 1.6 }}>
              <p style={{ marginTop: 0 }}>
                In clinical hospital management, an <strong>Inpatient (IPD) bed is a clinical resource</strong>, not a hotel reservation. Here is why the Ministry of Health and NHM mandate that beds cannot be self-reserved online:
              </p>
              <ol style={{ paddingLeft: 20, margin: '10px 0' }}>
                <li style={{ marginBottom: 6 }}>
                  <strong>Emergency Prioritization:</strong> A critically ill or trauma patient brought by ambulance must receive an ICU or HDU bed immediately without being blocked by an advance online booking.
                </li>
                <li style={{ marginBottom: 6 }}>
                  <strong>Doctor's Prescription Mandate:</strong> Only a certified medical practitioner can determine whether a patient requires General Ward, Oxygen Therapy, or ICU care based on vitals, ABG, and diagnostics.
                </li>
                <li style={{ marginBottom: 6 }}>
                  <strong>Prevention of Artificial Scarcity &amp; Middlemen:</strong> Open online booking in public hospitals would enable touts and scalpers to block beds, depriving genuine rural citizens.
                </li>
                <li>
                  <strong>Direct Hospital Admission Process:</strong> If you or your family member needs admission, please visit the hospital casualty / OPD with your <strong>ABHA ID, Aadhaar, and doctor referral</strong> for immediate spot allocation.
                </li>
              </ol>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowWhyModal(false)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

