import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import { buildApiUrl } from '../../utils/api';

interface ProductSummary {
  count: number;
  totalByCurrency: { [currency: string]: number };
  totalLYD: number;
}

const ProductSummaryBox = ({ cardBorder }: { cardBorder: string }) => {
  const [summary, setSummary] = useState<ProductSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const REFRESH_INTERVAL_MS = 10000; // 10s
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchSummary = async (opts?: { showLoading?: boolean }) => {
      const showLoading = opts?.showLoading ?? false;
      if (showLoading) setLoading(true); else setRefreshing(true);
      try {
        const token = localStorage.getItem('token');
            const res = await fetch(buildApiUrl('/bonentrer/summary'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
        setSummary(json);
        setError(null);
        setLastUpdated(new Date());
      } catch (e: any) {
        setError(typeof e?.message === 'string' ? e.message : 'Failed to load');
      } finally {
        if (showLoading) setLoading(false); else setRefreshing(false);
      }
    };
    fetchSummary({ showLoading: true });
    if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = window.setInterval(() => fetchSummary({ showLoading: false }), REFRESH_INTERVAL_MS);
    return () => {
      if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current);
    };
  }, []);

  return (
    <Box
      flex={{ xs: 'unset', sm: 1 }}
      minWidth={0}
      sx={{ bgcolor: 'inherit', border: cardBorder, borderRadius: 2, p: 1.25, display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}
    >
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ px: 1, pb: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
              Warehouse Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: refreshing ? 'success.main' : 'success.light' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {lastUpdated ? `updated ${lastUpdated.toLocaleTimeString()}` : 'live'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minHeight: 60, position: 'relative' }}>
          {loading ? (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Loading...
            </Box>
          ) : error ? (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
              {error}
            </Box>
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1,mb:3 }}>
                <WarehouseOutlinedIcon color="secondary" fontSize="large" />
                <Typography variant="h3" component="div" fontWeight={800}>
                  {summary?.count ?? 0} 
                </Typography>
                 <Typography variant="h6" component="div" fontWeight={500}>
                  {' Products'} 
                </Typography>
              </Box>
              {/* Currency totals */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 0.75, alignItems: 'center', width: '100%', mt: 1.5 }}>
                {summary && Object.entries(summary.totalByCurrency).map(([curr, total]) => (
                  <Box key={curr} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, justifyContent: 'center', px: 1, py: 0.75, borderRadius: 2, bgcolor: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.18)' }}>
                    <Typography component="span" variant="caption" sx={{ fontWeight: 700 }}>{curr}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{Number(total).toLocaleString()}</Typography>
                  </Box>
                ))}
              </Box>
             
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ProductSummaryBox;
