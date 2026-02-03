import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, ButtonGroup, Typography } from '@mui/material';
import { buildApiUrl } from '../../utils/api';
 

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

interface SummaryResponse {
  period: Period;
  from: string | null;
  to: string | null;
  data: {
    checkPayment: number;
    cashPayment: number;
    currencyPayment: number;
  };
  counts?: { checks: number; cash: number; currency: number };
  meta?: {
    minDates: { Chash_Book_Check: string | null; Sarf_cash: string | null; Sarf_etr_loc: string | null };
    maxDates: { Chash_Book_Check: string | null; Sarf_cash: string | null; Sarf_etr_loc: string | null };
    globalMin: string | null;
    globalMax: string | null;
  };
}

const PaymentPieBox = ({ cardBorder }: { cardBorder: string }) => {
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
    const url = `${buildApiUrl('/payments/summary')}?period=${period}`;
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

  // initial load + periodic refresh and cleanup
  useEffect(() => {
    fetchSummary({ showLoading: true });
    if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = window.setInterval(() => fetchSummary({ showLoading: false }), REFRESH_INTERVAL_MS);
    return () => {
      if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchSummary]);

  // refresh when window gains focus or tab becomes visible
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

  // chart removed in favor of centered live values

  return (
    <Box
      flex={{ xs: 'unset', sm: 1 }}
      minWidth={0}
      sx={{
        bgcolor: 'inherit',
        border: cardBorder,
        borderRadius: 2,
      //  boxShadow: 1,
        p: 1.25,
       // height: { xs: 200, sm: 230 },
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header with live indicator; buttons on a new line */}
        <Box sx={{ px: 1, pb: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
              Payments Breakdown
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: refreshing ? 'success.main' : 'success.light' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {lastUpdated ? `updated ${lastUpdated.toLocaleTimeString()}` : 'live'}
              </Typography>
            </Box>
          </Box>
          <ButtonGroup size="small" variant="contained" color="secondary" sx={{ mt: 0.5, flexWrap: 'wrap', borderRadius: 2,   }}>
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
          ) : (() => {
            const total = (summary?.data?.checkPayment ?? 0) + (summary?.data?.cashPayment ?? 0) + (summary?.data?.currencyPayment ?? 0);
            if (!total) {
              return (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', color: 'text.secondary', flexDirection: 'column', gap: 0.5 }}>
                  <div>No data for selected period</div>
                  <div style={{ fontSize: 12 }}>Period: {summary?.period} | From: {summary?.from ? new Date(summary.from).toLocaleDateString() : 'N/A'} | To: {summary?.to ? new Date(summary.to).toLocaleDateString() : 'N/A'}</div>
                  {summary?.counts && (
                    <div style={{ fontSize: 12 }}>Rows - Check: {summary.counts.checks}, Cash: {summary.counts.cash}, Currency: {summary.counts.currency}</div>
                  )}
                  {summary?.meta && (
                    <div style={{ fontSize: 11, marginTop: 4 }}>
                      Data dates — Global: {summary.meta.globalMin ? new Date(summary.meta.globalMin).toLocaleDateString() : 'N/A'} → {summary.meta.globalMax ? new Date(summary.meta.globalMax).toLocaleDateString() : 'N/A'}
                    </div>
                  )}
                </Box>
              );
            }
            // Helper for currency formatting: LYD for Check & Cash, USD for Currency
            const money = (value: number, currency: 'LYD' | 'USD') => {
              const frac = currency === 'USD' ? 2 : 3;
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
                minimumFractionDigits: frac,
                maximumFractionDigits: frac,
              }).format(Number(value || 0));
            };

            return (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 1,
                  fontSize: 14,
                  fontWeight: 600,
                 // color: 'text.primary',
                 mt:1,
                  px: 1,
                  textAlign: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ mx: 0.5, display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 999, bgcolor: 'rgba(54, 162, 235, 0.12)', border: '1px solid rgba(54, 162, 235, 0.25)' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(54, 162, 235, 0.9)' }} />
                  <Typography component="span" sx={{ fontWeight: 700 }}>Check:</Typography>
                  <Typography component="span">{money(summary?.data?.checkPayment ?? 0, 'LYD')}</Typography>
                </Box>
                <Box sx={{ mx: 0.5, display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 999, bgcolor: 'rgba(255, 206, 86, 0.15)', border: '1px solid rgba(255, 206, 86, 0.35)' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255, 206, 86, 0.95)' }} />
                  <Typography component="span" sx={{ fontWeight: 700 }}>Cash:</Typography>
                  <Typography component="span">{money(summary?.data?.cashPayment ?? 0, 'LYD')}</Typography>
                </Box>
                <Box sx={{ mx: 0.5, display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 999, bgcolor: 'rgba(75, 192, 192, 0.14)', border: '1px solid rgba(75, 192, 192, 0.32)' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(75, 192, 192, 0.95)' }} />
                  <Typography component="span" sx={{ fontWeight: 700 }}>Currency:</Typography>
                  <Typography component="span">{money(summary?.data?.currencyPayment ?? 0, 'USD')}</Typography>
                </Box>
              </Box>
            );
          })()}
        </Box>
      </Box>
    </Box>
  );
};

export default PaymentPieBox;
