import { useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Button, Dialog } from '@mui/material';
import type { LatLngTuple, LatLngBoundsExpression } from 'leaflet';
import axios from 'axios';
import { buildApiUrl } from '../../utils/api';
import { useEffect } from 'react';
import React from 'react';
// RobotWriter: Animated letter-by-letter text with blinking cursor
const RobotWriter = ({ text, speed = 30, cursor = true, sx = {} }: { text: string; speed?: number; cursor?: boolean; sx?: any }) => {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  React.useEffect(() => {
    let i = 0;
    setDisplayed('');
    setShowCursor(true);
    const interval = setInterval(() => {
      setDisplayed((prev) => text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
      }
    }, speed);
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => {
      clearInterval(interval);
      clearInterval(cursorInterval);
    };
  }, [text, speed]);
  return (
    <span style={{ fontFamily: 'monospace', ...sx }}>
      {displayed}
      {cursor && showCursor && <span style={{ color: '#1976d2', fontWeight: 'bold' }}>|</span>}
    </span>
  );
};
// RobotWriterList: Animates lines one by one using RobotWriter
const RobotWriterList = ({ lines, speed = 90, sx = {} }: { lines: string[]; speed?: number; sx?: any }) => {
  const [visibleCount, setVisibleCount] = useState(1);
  React.useEffect(() => {
    setVisibleCount(1);
    if (lines.length === 0) return;
    let idx = 1;
    let timers: NodeJS.Timeout[] = [];
    function showNext() {
      if (idx < lines.length) {
        setVisibleCount(idx + 1);
        idx++;
        timers.push(setTimeout(showNext, lines[idx - 1].length * speed + 400));
      }
    }
    timers.push(setTimeout(showNext, lines[0].length * speed + 400));
    return () => timers.forEach(clearTimeout);
  }, [lines, speed]);
  return (
    <>
      {lines.slice(0, visibleCount).map((line, i) => (
        <RobotWriter key={i} text={line} speed={speed} sx={sx} />
      ))}
    </>
  );
};

// Bounding box for the "red zone" (e.g., eastern Libya, Benghazi area)
// Adjust these coordinates to match your desired "red zone" area
// Bounding box for most of Libya (covers the country, not just a region)
// Adjusted bounding box to optimally center and show the full Libyan map
const LIBYA_BBOX = '9.5%2C19.5%2C25.0%2C34.0'; // minLon,minLat,maxLon,maxLat

// Removed colored square overlay. If you want to show Libya's real shape, use a GeoJSON for Libya's borders.


// All fields from GL (YearTran) and COA (Master)
type GL = {
  Ind: number;
  Acc_No: string;
  KidNoT: string;
  Date: string;
  Cridt: string;
  Dibt: string;
  Note: string;
  NUM_FACTURE: string;
  ENTETE: string;
  SOURCE: string;
  is_closed: boolean;
  check_number: string;
  usr: number;
  ref_emp: number;
  num_sarf: number;
  DATE_FACT: string;
  fl: boolean;
  Cridt_Curr: string;
  Dibt_Curr: string;
  id_Well: number;
  Id_Area: number;
  Id_Cost_Center: number;
  id_supp_cuss: number;
  sor: number;
  Elements: number;
  Cridt_Curr_A: string;
  Dibt_Curr_A: string;
  Cridt_Curr_B: string;
  Dibt_Curr_B: string;
  rate: number;
  date_effect: string;
  sor_1: number;
  fll: boolean;
  original_value_cridt: string;
  original_value_dibt: string;
  Curr_riginal_value: string;
  MrkzName: string;
  NUM_SARFF: string;
  coa?: {
    IND: number;
    Acc_No: string;
    Name_M: string;
    Date_m: string;
    State: boolean;
    solde_initiale: string;
    type_acc: string;
    ancien_acc_no: string;
    percent_budget: number;
    solde_by_currency: string;
    d1: string;
    d2: string;
    L10: number;
  };
};
///DsFinance

type Account = {
  IND: number;
  Acc_No: string | null;
  Name_M: string | null;
  
};
// Crew locations
const crews = [
  {
    name: 'Crew 101',
    lat: 32.6797474309963,
    lon: 13.259956231714677,
    label: 'Tripoli (طرابلس)'
  },
  {
    name: 'Crew 203',
    lat: 29.587346696083,
    lon: 19.660632727431924,
    label: ''
  },
  {
    name: 'Crew 206',
    lat: 28.931939488714683,
    lon: 21.501669654766864,
    label: ''
  }
];

// Libya bounding box for initial map view (covers all of Libya)
const minLat = 19.5;
const maxLat = 34.0;
const minLon = 9.5;
const maxLon = 25.0;

// Center the map on Libya (geographic center)
const mapCenter: LatLngTuple = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
const mapBounds: LatLngBoundsExpression = [
  [minLat, minLon] as LatLngTuple,
  [maxLat, maxLon] as LatLngTuple
];

// Helper to get total expenses for each crew (Acc_No starts with '6')
function getCrewTotalExpense(crewName: string, data: GL[]) {
  const crewData = data.filter(
    (item) => item.MrkzName && item.MrkzName.toString().includes(crewName.split(' ')[1])
  );
  let total = 0;
  crewData.forEach((item) => {
    if (item.Acc_No && item.Acc_No.startsWith('6')) {
      total += (parseFloat(item.Dibt) || 0) - (parseFloat(item.Cridt) || 0);
    }
  });
  return total;
}

// Helper to get crew account details (frontend version of SQL)
// Updated: Get crew account details using COA and GL data, with advanced filtering
function getCrewAccountDetails(
  crewNum: string,
  year: number,
  data: GL[],
  coaList: Account[]
): { Acc_No: string; Name_M: string; total_expense: number }[] {
  // 1. Filter COA accounts: Acc_No starts with '6' and length < 10
  const filteredCoa = coaList.filter(
    (acc) => acc.Acc_No && acc.Acc_No.startsWith('6') && acc.Acc_No.length < 10
  );

  // 2. For each COA account, sum (Dibt - Cridt) from GL where LEFT(GL.Acc_No, len(coa.Acc.No)) === coa.Acc_No
  return filteredCoa.map((coaAcc) => {
    const accNo = coaAcc.Acc_No || '';
    // For each GL, check if left(GL.Acc_No, accNo.length) === accNo
    const total_expense = data
      .filter((item) =>
        item.Acc_No &&
        item.Acc_No.substring(0, accNo.length) === accNo &&
        item.MrkzName && item.MrkzName.toString().includes(crewNum) &&
        item.Date && new Date(item.Date).getFullYear() === year &&
        item.SOURCE !== 'cls'
      )
      .reduce((sum, item) => sum + ((parseFloat(item.Dibt) || 0) - (parseFloat(item.Cridt) || 0)), 0);

    // Add balance from COA if available
    const balance = 0 || null;

    return {
      Acc_No: accNo,
      Name_M: coaAcc.Name_M || '',
      total_expense,
      balance
    };
  }).filter(row => row.total_expense !== 0);
}

const LibyaMapBox = () => {

  const [data, setData] = useState<GL[]>([]);
  const [rawCoa, setRawCoa] = useState<Account[]>([]);
  const [datacoa, setDatacoa] = useState<Account[]>([]);
  const apiUrlcoa = buildApiUrl('/coas');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsData, setDetailsData] = useState<any[]>([]);
  const [detailsCrew, setDetailsCrew] = useState<string>('');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const detailsAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const apiUrl = buildApiUrl('/DsFinance');
  // Fetch COA accounts (Acc_No length < 10), no calculation here
  const fetchDatacoa = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get<Account[]>(`${apiUrlcoa}/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filtered = (response.data || []).filter(acc => acc.Acc_No && acc.Acc_No.startsWith('6') && acc.Acc_No.length < 10 );
      setRawCoa(filtered);
    } catch (error) {
      console.error('Error fetching COA:', error);
      setRawCoa([]);
    }
  };

  // Fetch COA accounts on mount
  useEffect(() => {
    fetchDatacoa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate datacoa with totals whenever GL data or COA changes
  useEffect(() => {
    if (!Array.isArray(rawCoa) || !Array.isArray(data) || rawCoa.length === 0 || data.length === 0) {
      setDatacoa([]);
      return;
    }
    // For each crew, calculate per-account expenses filtered by MrkzName
    // If you want to aggregate for all crews, you can loop crews here
    // For now, aggregate for all data (all crews)
    const calculated = rawCoa.map(coaAcc => {
      const accNo = coaAcc.Acc_No || '';
      // Optionally, filter by crew: item.MrkzName === crewName
      // If you want to filter for a specific crew, pass crewName as param
      const total_expense = data.filter(item =>
        item.Acc_No && item.Acc_No.substring(0, accNo.length) === accNo &&
        item.Acc_No.startsWith('6') &&
        item.SOURCE !== 'Cls' &&
        item.MrkzName // Only include if MrkzName is present
      ).reduce((sum, item) => sum + ((parseFloat(item.Dibt) || 0) - (parseFloat(item.Cridt) || 0)), 0);
      return {
        ...coaAcc,
        total_expense
      };
    });
    setDatacoa(calculated);

  
  }, [rawCoa, data]);

  // Compute all crew totals and grand total (must be inside component to access 'data')
  const crewTotals = crews.map((crew) => getCrewTotalExpense(crew.name, data));
  const grandTotal = crewTotals.reduce((a, b) => a + Math.abs(b), 0) || 1;

  // Custom animated marker icon (pulsing effect, scalable)
  function getPulsingIcon(percentage: number, percentLabel: string, crewName?: string) {
    // Scale diameter: min 48px, max 140px (larger circles)
    const minSize = 48;
    const maxSize = 140;
    const size = Math.round(minSize + (maxSize - minSize) * percentage);
    // Use a unique id for each crew button
    const btnId = `show-details-btn-${crewName?.replace(/\s/g, '') || ''}`;
    // Dynamic color for infoBox text: white for dark map, black for others
    const infoBoxTextColor = mapType === 'dark' ? '#fff' : '#fff';
    let infoBox = `<div style=\"margin-top:-10px;color:${infoBoxTextColor};font-weight:700;font-size:12px;text-align:left;line-height:1;width:${Math.max(crewName ? crewName.length * 11 : 120, 160)}px;max-width:320px;word-break:break-word;background:#9c27b0;border-radius:12px;padding:5px 7px;box-shadow:0 2px 8px rgba(30,64,175,0.08);border:1px solid #90caf9;\">${crewName ? crewName + '</br> Expenses % :' + percentLabel : percentLabel}
         </div>`;
    let markerHtml;
    if (crewName === 'Crew 101' || crewName === 'Crew 203') {
      markerHtml = `
        ${infoBox}
        <div style=\"width:${size}px;height:${size + 20}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;\">
          <div style=\"width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,0,0,0.4);border:2px solid #ff0000;animation:pulse 1.2s infinite;display:flex;align-items:center;justify-content:center;position:relative;\">
            <span style='color:#fff;font-weight:bold;font-size:${Math.round(size / 3)}px;'>📍</span>
          </div>
        </div>
      `;
    } else if (crewName === 'Crew 206') {
      markerHtml = `
        <div style=\"width:${size}px;height:${size + 20}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;\">
          <div style=\"width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,0,0,0.4);border:2px solid #ff0000;animation:pulse 1.2s infinite;display:flex;align-items:center;justify-content:center;position:relative;\">
            <span style='color:#fff;font-weight:bold;font-size:${Math.round(size / 3)}px;'>📍</span>
          </div>
        </div>
        ${infoBox}
      `;
    } else {
      markerHtml = `
        <div style=\"width:${size}px;height:${size + 20}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;\">
          <div style=\"width:${size}px;height:${size}px;border-radius:50%;background:rgba(255,0,0,0.4);border:2px solid #ff0000;animation:pulse 1.2s infinite;display:flex;align-items:center;justify-content:center;position:relative;\">
            <span style='color:#fff;font-weight:bold;font-size:${Math.round(size / 3)}px;'>📍</span>
          </div>
        </div>
      `;
    }
    return L.divIcon({
      className: '',
      html: `
        ${markerHtml}
        <style>@keyframes pulse {0%{box-shadow:0 0 0 0 rgba(255,0,0,0.7);}70%{box-shadow:0 0 0 ${Math.round(size / 2)}px rgba(255,0,0,0);}100%{box-shadow:0 0 0 0 rgba(255,0,0,0);}}</style>
      `,
      iconSize: [size, size + 28],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
    });
  }

  // Fetch GLs with all fields from GL and COA (joined)
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const currentYear = new Date().getFullYear();
    try {
      // This endpoint should return GLs with all fields from GL and joined COA (as 'coa')
      const response = await axios.get(`${apiUrl}/all?year_date=${currentYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.filter((item: GL) => item.Acc_No && item.Acc_No.startsWith('6')));


 

 

    } catch (error) {
      console.error('Error fetching GL+COA data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [mapType, setMapType] = useState<'dark' | 'osm' | 'satellite'>('satellite');

  const tileLayers = {
    dark: {
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    },
    osm: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    },
    satellite: {
      attribution: 'Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    },
  };

  const mapContent = (
    <MapContainer
      center={mapCenter}
      zoom={5}
      style={{ width: '100%', height: '100%', minHeight: 200 }}
      scrollWheelZoom={true}
      bounds={mapBounds}
      maxBounds={mapBounds}
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        attribution={tileLayers[mapType].attribution}
        url={tileLayers[mapType].url}
      />
      {/* Libya colored polygon overlay removed. */}
      {crews.map((crew, idx) => {
        const total = crewTotals[idx];
        const percent = Math.abs(total) / grandTotal;
        const percentLabel = ` ${Math.round(percent * 100)}%`;
        // Use unique button id for each marker
        const btnId = `show-details-btn-${crew.name.replace(/\s/g, '')}`;
        return (
          <Marker key={crew.name} position={[crew.lat, crew.lon]} icon={getPulsingIcon(percent, percentLabel, crew.name)}>
            <Popup autoClose closeOnClick closeButton minWidth={260} maxWidth={340}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>
                {crew.name}<br />{crew.label}
                <div style={{ fontWeight: 400, color: '#1976d2', marginTop: 4 }}>
                  <b>{Math.round(total).toLocaleString()}</b> ({percentLabel})
                </div>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 1, background: '#1976d2', color: '#fff', fontWeight: 700, borderRadius: 1 }}
                  onClick={async (ev) => {
                    ev.stopPropagation();
                    setDetailsLoading(true);
                    setDetailsCrew(crew.name);
                    setDetailsOpen(true);
                    try {
                      // Use year 2025 as requested
                      const crewNum = crew.name.split(' ')[1];
                      const details = getCrewAccountDetails(crewNum, 2025, data, datacoa);
                      setDetailsData(details);
                    } catch (err) {
                      setDetailsData([]);
                    }
                    setDetailsLoading(false);
                  }}
                >
                   Show Crew Details
                </Button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 200, borderRadius: 2, overflow: 'hidden', position: 'relative', display: 'flex' }}>
      {/* Crew marker/label at top center with fade-in animation, only when a crew is selected */}
      {detailsOpen && detailsCrew && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1301,
            bgcolor: 'red',
            color: '#fff',
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: 700,
            fontSize: 18,
            boxShadow: 2,
            minWidth: 180,
            textAlign: 'center',
            letterSpacing: 1,
            animation: 'fadeInCrewLabel 0.7s',
          }}
        >
          <style>
            {`@keyframes fadeInCrewLabel { from { opacity: 0; transform: translateY(-16px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }`}
          </style>

          &nbsp;<span style={{ fontWeight: 800 }}>{detailsCrew}</span>
        </Box>
      )}
      {/* Aria-styled details panel at left, always visible when detailsOpen */}
      {detailsOpen && (
        <Box sx={{ width: 340, minWidth: 260, maxWidth: 400, bgcolor: '#f5f5f5', borderRight: '2px solid #1976d2', p: 2, position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 1300, boxShadow: 2, display: 'flex', flexDirection: 'column', gap: 2 }} aria-label="Crew Account Details Panel" role="region" tabIndex={0}>
          <Box sx={{ fontWeight: 700, fontSize: 18, mb: 2, color: '#1976d2' }}>
            {detailsCrew} - Account Details
          </Box>
          {/* Summary section */}
          {!detailsLoading && detailsData.length > 0 && (
            <Box sx={{ mb: 2, p: 1, bgcolor: '#e3f2fd', borderRadius: 1, fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <span>Total Accounts: {detailsData.length}</span>
              <span>
                Total Expenses:   <b>{detailsData
                  .filter(row =>  row.Acc_No.startsWith('6') && row.Acc_No.length === 1)
                  .reduce((sum, row) => sum + (row.total_expense || 0), 0)
                  .toLocaleString()} LYD</b>
              </span>
              <Button
                variant="contained"
                size="small"
                sx={{ mt: 1, background: '#1976d2', color: '#fff', fontWeight: 700, borderRadius: 1, alignSelf: 'flex-end' }}
                onClick={() => setDetailsOpen(false)}
              >
                Close
              </Button>
            </Box>
          )}
          {detailsLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>Loading...</Box>
          ) : (
            <Box sx={{ border: '1px solid #eee', borderRadius: 2, p: 2, bgcolor: '#fafafa', flex: 1, overflowY: 'auto' }}>
              {detailsData.length === 0 ? (
                <Box sx={{ textAlign: 'center', color: '#888' }}>No data found.</Box>
              ) : (
                <RobotWriterList
                  lines={detailsData.map(row => `Acc_No: ${row.Acc_No} | Name: ${row.Name_M} | Total: ${row.total_expense?.toLocaleString()}${row.balance !== undefined && row.balance !== null ? ` | Balance: ${row.balance}` : ''}`)}
                  speed={5}
                  sx={{ fontWeight: 700, color: '#333', fontSize: 15, display: 'block', marginBottom: 8, whiteSpace: 'pre-line' }}
                />
              )}
            </Box>
          )}
        </Box>
      )}
      {/* Map content */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {mapContent}
      </Box>
      <Button
        variant="contained"
        size="small"
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1200, background: 'red', color: '#fff', fontWeight: 700 }}
        onClick={() => setOpen(true)}
      >
        Open in Full Screen
      </Button>
      <Button
        variant="outlined"
        size="small"
        sx={{ position: 'absolute', top: 8, left: 64, zIndex: 1200, background: mapType === 'dark' ? '#222' : '#fff', color: mapType === 'satellite' ? 'green' : mapType === 'osm' ? 'black' : '#fff', fontWeight: 700, borderColor: mapType === 'satellite' ? 'green' : 'black' }}
        onClick={() => setMapType(mapType === 'dark' ? 'osm' : mapType === 'osm' ? 'satellite' : 'dark')}
      >
        {mapType === 'dark' ? 'Light Map' : mapType === 'osm' ? 'Satellite' : 'Dark Map'}
      </Button>
      {mapContent}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { height: '90vh', width: '90vw', background: 'transparent', boxShadow: 'none' } }}
      >
        <Box sx={{ width: '100%', height: '100%', background: '#fff', borderRadius: 2, position: 'relative', border: '4px solid #1976d2' }}>
          <Button
            variant="contained"
            size="small"
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1200, background: 'red', color: '#fff', fontWeight: 700 }}
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{ position: 'absolute', top: 8, left: 64, zIndex: 1200, background: mapType === 'dark' ? '#222' : '#fff', color: mapType === 'satellite' ? 'green' : mapType === 'osm' ? 'black' : '#fff', fontWeight: 700, borderColor: mapType === 'satellite' ? 'green' : 'black' }}
            onClick={() => setMapType(mapType === 'dark' ? 'osm' : mapType === 'osm' ? 'satellite' : 'dark')}
          >
            {mapType === 'dark' ? 'Light Map' : mapType === 'osm' ? 'Satellite' : 'Dark Map'}
          </Button>
          <Box sx={{ width: '100%', height: '100%' }}>
            <MapContainer
              center={mapCenter}
              zoom={5}
              style={{ width: '100%', height: '100%', minHeight: 200 }}
              scrollWheelZoom={true}
              bounds={mapBounds}
              maxBounds={mapBounds}
              maxBoundsViscosity={1.0}
            >
              <TileLayer
                attribution={tileLayers[mapType].attribution}
                url={tileLayers[mapType].url}
              />
              {/* Libya colored polygon overlay removed. */}
              {crews.map((crew, idx) => {
                const total = crewTotals[idx];
                const percent = Math.abs(total) / grandTotal;
                const percentLabel = `${Math.round(percent * 100)}%`;
                return (
                  <Marker key={crew.name} position={[crew.lat, crew.lon]} icon={getPulsingIcon(percent, percentLabel, crew.name)}>
                    <Popup autoClose closeOnClick closeButton minWidth={260} maxWidth={340}>
                      <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>
                        {crew.name}<br />{crew.label}
                        <div style={{ fontWeight: 400, color: '#1976d2', marginTop: 4 }}>
                          <b>{Math.round(total).toLocaleString()}</b> ({percentLabel})
                        </div>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{ mt: 1, background: '#1976d2', color: '#fff', fontWeight: 500, borderRadius: 1 }}
                          onClick={async (ev) => {
                            ev.stopPropagation();
                            setDetailsLoading(true);
                            setDetailsCrew(crew.name);
                            setDetailsOpen(true);
                            try {
                              // Use year 2025 as requested
                              const crewNum = crew.name.split(' ')[1];
                              const details = getCrewAccountDetails(crewNum, 2025, data, datacoa);
                              setDetailsData(details);
                            } catch (err) {
                              setDetailsData([]);
                            }
                            setDetailsLoading(false);
                          }}
                        >
                          Show Crew Details
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </Box>
        </Box>
      </Dialog>
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 2, minHeight: 220 }}>
          <Box sx={{ fontWeight: 700, fontSize: 18, mb: 2, color: 'inherit' }}>
             {detailsCrew} - Account Details
          </Box>
          {/* Summary section */}
          {!detailsLoading && detailsData.length > 0 && (
            <Box sx={{    bgcolor: 'inherit', borderRadius: 1, fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
              <span>Total Accounts: {detailsData.length}</span>
              <span>
                  Total Expenses:   <b>{detailsData
                  .filter(row =>  row.Acc_No.startsWith('6') && row.Acc_No.length === 1)
                  .reduce((sum, row) => sum + (row.total_expense || 0), 0)
                  .toLocaleString()} LYD</b>
                  
                  </span>
             
            </Box>
          )}
          {detailsLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>Loading...</Box>
          ) : (
            <Box sx={{ border: '1px solid #eee', borderRadius: 2, p: 2, bgcolor: 'inherit' }}>
              {detailsData.length === 0 ? (
                <Box sx={{ textAlign: 'center', color: 'inherit' }}>No data found.</Box>
              ) : (
                <RobotWriterList
                  lines={detailsData.map(row => `Account: ${row.Acc_No} - ${row.Name_M} | Total: ${row.total_expense?.toLocaleString()} LYD` )}
                  speed={5}
                  sx={{ fontWeight: 700, color: 'inherit', fontSize: 15, display: 'block', marginBottom: 8, whiteSpace: 'pre-line' }}
                />
              )}
            </Box>
          )}
          <Box sx={{ textAlign: 'right', mt: 2 }}>
            <Button variant="contained" color="primary" onClick={() => setDetailsOpen(false)}>Close</Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
};

export default LibyaMapBox;