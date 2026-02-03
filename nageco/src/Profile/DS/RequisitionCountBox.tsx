import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { buildApiUrl } from '../../utils/api';

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

interface SummaryResponse {
  period: Period;
  from: string | null;
  to: string | null;
  total: number;
  byCategory?: { 'Is Approved': number; 'Is Refused': number; 'Pending': number };
}

const RequisitionCountBox = ({ cardBorder }: { cardBorder: string }) => {
  const [period, setPeriod] = useState<Period>('week');
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const REFRESH_INTERVAL_MS = 15000; // 15s
  const refreshTimerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchSummary = useCallback(async (opts?: { showLoading?: boolean }) => {
    const showLoading = opts?.showLoading ?? false;
    const token = localStorage.getItem('token');
    const url = `${buildApiUrl('/requisitions/summary')}?period=${period}`;
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    if (showLoading) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: ac.signal });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
      setSummary(json);
      setError(null);
      setLastUpdated(new Date());
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setError(typeof e?.message === 'string' ? e.message : 'Failed to load');
      }
    } finally {
      if (showLoading) setLoading(false); else setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSummary({ showLoading: true });
    if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = window.setInterval(() => fetchSummary({ showLoading: false }), REFRESH_INTERVAL_MS);
    return () => {
      if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchSummary]);

  useEffect(() => {
    const onFocus = () => fetchSummary({ showLoading: false });
    const onVis = () => { if (!document.hidden) fetchSummary({ showLoading: false }); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [fetchSummary]);

  return (
    <Box
      flex={{ xs: 'unset', sm: 1 }}
      minWidth={0}
      sx={{ bgcolor: 'inherit', border: cardBorder, borderRadius: 2, p: 1.25, display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}
    >
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 1, pb: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
              Requisitions
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: refreshing ? 'success.main' : 'success.light' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {lastUpdated ? `updated ${lastUpdated.toLocaleTimeString()}` : 'live'}
              </Typography>
            </Box>
          </Box>
          <ButtonGroup size="small" variant="contained" color="secondary" sx={{ mt: 0.5, flexWrap: 'wrap', borderRadius: 2, alignSelf: 'center' }}>
            {(['day', 'week', 'month', 'year', 'all'] as Period[]).map((p) => (
              <Button key={p} onClick={() => setPeriod(p)} disabled={period === p} sx={{ textTransform: 'uppercase' }}>
                {p}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
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
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentOutlinedIcon color="secondary" fontSize="large" />
                <Typography variant="h3" component="div" fontWeight={800}>
                  {summary?.total ?? 0}
                </Typography>
              </Box>
            
              {/* Grouped categories forced into a single row (3 equal columns) */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, alignItems: 'center', width: '100%', mt: 0.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, justifyContent: 'center', px: 1, py: 0.5, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.12)', border: '1px solid rgba(76, 175, 80, 0.25)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(76, 175, 80, 0.9)' }} />
                    <Typography component="span" variant="caption" sx={{ fontWeight: 700 }}>Approved</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{summary?.byCategory?.['Is Approved'] ?? 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, justifyContent: 'center', px: 1, py: 0.5, borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.10)', border: '1px solid rgba(244, 67, 54, 0.25)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(244, 67, 54, 0.9)' }} />
                    <Typography component="span" variant="caption" sx={{ fontWeight: 700 }}>Refused</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{summary?.byCategory?.['Is Refused'] ?? 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, justifyContent: 'center', px: 1, py: 0.5, borderRadius: 2, bgcolor: 'rgba(33, 150, 243, 0.10)', border: '1px solid rgba(33, 150, 243, 0.25)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(33, 150, 243, 0.9)' }} />
                    <Typography component="span" variant="caption" sx={{ fontWeight: 700 }}>Pending</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{summary?.byCategory?.['Pending'] ?? 0}</Typography>
                </Box>
              </Box>
            
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default RequisitionCountBox;
