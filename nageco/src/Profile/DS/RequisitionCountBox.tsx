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

type CategoryCounts = { 'Is Approved': number; 'Is Refused': number; Pending: number };

const SCAN_MAX_KEY = 'requisitionDashboard.scanMaxRequestNo';
const SCAN_CACHE_PREFIX = 'requisitionDashboard.quoteFallback.';
const SCAN_CACHE_TTL_MS = 60 * 1000;
const SCAN_WINDOW = 260;

const asNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getRange = (period: Period) => {
  const now = new Date();
  const ms = 1000 * 60 * 60 * 24;
  switch (period) {
    case 'day':
      return { from: new Date(now.getTime() - 1 * ms), to: now };
    case 'week':
      return { from: new Date(now.getTime() - 7 * ms), to: now };
    case 'month':
      return { from: new Date(now.getTime() - 30 * ms), to: now };
    case 'year':
      return { from: new Date(now.getTime() - 365 * ms), to: now };
    case 'all':
      return { from: null, to: null };
    default:
      return { from: new Date(now.getTime() - 7 * ms), to: now };
  }
};

const toYmd = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

const normalizeSummaryResponse = (raw: any): SummaryResponse | null => {
  if (!raw || typeof raw !== 'object') return null;

  const total = asNumber(raw.total);
  const byCategory = raw.byCategory;
  if (!Number.isFinite(total) || !byCategory || typeof byCategory !== 'object') {
    return null;
  }

  return {
    period: (raw.period as Period) || 'week',
    from: raw.from ? String(raw.from) : null,
    to: raw.to ? String(raw.to) : null,
    total,
    byCategory: {
      'Is Approved': asNumber(byCategory['Is Approved']),
      'Is Refused': asNumber(byCategory['Is Refused']),
      Pending: asNumber(byCategory['Pending']),
    },
  };
};

const parseDateOrNull = (value: unknown): Date | null => {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
};

const isInRange = (date: Date | null, period: Period) => {
  if (!date) return false;
  const range = getRange(period);
  if (!range.from || !range.to) return true;
  return date >= range.from && date <= range.to;
};

const categorizeStatus = (status: unknown): keyof CategoryCounts => {
  const s = String(status ?? '').trim().toLowerCase();
  if (s.includes('approve')) return 'Is Approved';
  if (s.includes('refus') || s.includes('reject')) return 'Is Refused';
  return 'Pending';
};

const readCache = (period: Period): SummaryResponse | null => {
  try {
    const raw = localStorage.getItem(`${SCAN_CACHE_PREFIX}${period}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const ts = asNumber(parsed.ts);
    if (!ts || Date.now() - ts > SCAN_CACHE_TTL_MS) return null;
    return normalizeSummaryResponse(parsed.data);
  } catch {
    return null;
  }
};

const writeCache = (period: Period, data: SummaryResponse) => {
  try {
    localStorage.setItem(`${SCAN_CACHE_PREFIX}${period}`, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // ignore storage quota/privacy failures
  }
};

const readScanMax = () => {
  try {
    const n = Number(localStorage.getItem(SCAN_MAX_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  } catch {
    return null;
  }
};

const writeScanMax = (value: number) => {
  try {
    localStorage.setItem(SCAN_MAX_KEY, String(Math.floor(value)));
  } catch {
    // ignore storage quota/privacy failures
  }
};

const fetchQuoteRequisition = async (
  requestNo: number,
  headers: Record<string, string>,
  signal: AbortSignal
) => {
  const url = `${buildApiUrl(`/quote-requests/from-requisition/${requestNo}/items`)}`;
  const res = await fetch(url, { headers, signal });
  const text = await res.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
  if (!json || typeof json !== 'object') throw new Error('Invalid quote requisition payload');
  return json;
};

const buildSummaryFromQuoteFallback = async (
  period: Period,
  headers: Record<string, string>,
  signal: AbortSignal
): Promise<SummaryResponse> => {
  const cached = readCache(period);
  if (cached) return cached;

  const storedMax = readScanMax();
  const seeds = [storedMax, 2200, 2100, 2000, 1900, 1800, 1700, 1600]
    .filter((v): v is number => Number.isFinite(v as number));

  let maxExisting: number | null = null;
  for (const seed of seeds) {
    const payload = await fetchQuoteRequisition(seed, headers, signal);
    if (payload) {
      maxExisting = seed;
      break;
    }
  }

  if (maxExisting === null) {
    const range = getRange(period);
    const empty: SummaryResponse = {
      period,
      from: range.from ? range.from.toISOString() : null,
      to: range.to ? range.to.toISOString() : null,
      total: 0,
      byCategory: { 'Is Approved': 0, 'Is Refused': 0, Pending: 0 },
    };
    writeCache(period, empty);
    return empty;
  }

  let resolvedMax = maxExisting;

  // Check if newer request numbers exist.
  for (let i = 1; i <= 8; i += 1) {
    const candidate = resolvedMax + i;
    const payload = await fetchQuoteRequisition(candidate, headers, signal);
    if (payload) {
      resolvedMax = candidate;
    }
  }

  writeScanMax(resolvedMax);

  const floor = Math.max(1, resolvedMax - SCAN_WINDOW + 1);
  const ids: number[] = [];
  for (let id = resolvedMax; id >= floor; id -= 1) {
    ids.push(id);
  }

  const counts: CategoryCounts = { 'Is Approved': 0, 'Is Refused': 0, Pending: 0 };
  let total = 0;

  const CHUNK_SIZE = 16;
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const chunkRows = await Promise.all(
      chunk.map(async (id) => {
        try {
          return await fetchQuoteRequisition(id, headers, signal);
        } catch {
          return null;
        }
      })
    );

    for (const row of chunkRows) {
      if (!row) continue;
      const firstItem = Array.isArray(row.rows) && row.rows.length ? row.rows[0] : null;
      const reqDate = parseDateOrNull(firstItem?.date_req);
      if (!isInRange(reqDate, period)) continue;

      total += 1;
      counts[categorizeStatus(row.requisitionStatus)] += 1;
    }
  }

  const range = getRange(period);
  const summary: SummaryResponse = {
    period,
    from: range.from ? range.from.toISOString() : null,
    to: range.to ? range.to.toISOString() : null,
    total,
    byCategory: counts,
  };

  writeCache(period, summary);
  return summary;
};

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
  const inFlightRef = useRef<boolean>(false);

  const fetchSummary = useCallback(async (opts?: { showLoading?: boolean }) => {
    const showLoading = opts?.showLoading ?? false;
    if (inFlightRef.current && !showLoading) return;

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchJson = async (url: string) => {
      const res = await fetch(url, { headers, signal: ac.signal });
      const text = await res.text();
      let json: any = null;
      if (text) {
        try {
          json = JSON.parse(text);
        } catch {
          json = null;
        }
      }
      if (!res.ok) throw new Error(json?.message || `Error ${res.status}`);
      if (!json || typeof json !== 'object') throw new Error('Invalid API response');
      return json;
    };

    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    inFlightRef.current = true;
    if (showLoading) setLoading(true); else setRefreshing(true);
    try {
      const primaryUrl = `${buildApiUrl('/requisitions/summary')}?period=${period}`;
      let normalized: SummaryResponse | null = null;
      let primaryError: string | null = null;
      const fallbackErrors: string[] = [];

      try {
        const primaryPayload = await fetchJson(primaryUrl);
        normalized = normalizeSummaryResponse(primaryPayload);
      } catch (primaryErr: any) {
        primaryError = typeof primaryErr?.message === 'string' ? primaryErr.message : 'Failed to load requisitions summary';
      }

      if (!normalized) {
        try {
          const range = getRange(period);
          const params = new URLSearchParams();
          const from = toYmd(range.from);
          const to = toYmd(range.to);
          if (from) params.set('dateFrom', from);
          if (to) params.set('dateTo', to);
          const fallbackUrl = `${buildApiUrl('/requisition-reports')}${params.toString() ? `?${params.toString()}` : ''}`;
          const fallbackPayload = await fetchJson(fallbackUrl);
          const fallbackSummary = fallbackPayload?.summary && typeof fallbackPayload.summary === 'object'
            ? fallbackPayload.summary
            : fallbackPayload;

          const total = asNumber(fallbackSummary?.totalRequisitions ?? fallbackSummary?.total);
          const approved = asNumber(fallbackSummary?.approvedCount) + asNumber(fallbackSummary?.completedCount);
          const refused = asNumber(fallbackSummary?.rejectedCount);
          const pending = Math.max(total - approved - refused, 0);

          normalized = {
            period,
            from: range.from ? range.from.toISOString() : null,
            to: range.to ? range.to.toISOString() : null,
            total,
            byCategory: {
              'Is Approved': approved,
              'Is Refused': refused,
              Pending: pending,
            },
          };
        } catch (fallbackErr: any) {
          fallbackErrors.push(
            typeof fallbackErr?.message === 'string' ? fallbackErr.message : 'Fallback requisition reports failed'
          );
        }
      }

      if (!normalized) {
        try {
          normalized = await buildSummaryFromQuoteFallback(period, headers, ac.signal);
        } catch (quoteFallbackErr: any) {
          fallbackErrors.push(
            typeof quoteFallbackErr?.message === 'string'
              ? quoteFallbackErr.message
              : 'Fallback quote requisitions failed'
          );
        }
      }

      if (!normalized) {
        const joined = [primaryError, ...fallbackErrors].filter(Boolean).join('; ');
        throw new Error(joined || 'Failed to load requisitions summary');
      }

      setSummary(normalized);
      setError(null);
      setLastUpdated(new Date());
    } catch (e: any) {
      const message = String(e?.message || '').toLowerCase();
      const isAbortLike = e?.name === 'AbortError' || message.includes('aborted') || message.includes('abort');
      if (!isAbortLike) {
        setError(typeof e?.message === 'string' ? e.message : 'Failed to load');
      }
    } finally {
      inFlightRef.current = false;
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
              <Button key={p} onClick={() => setPeriod(p)} disabled={period === p} sx={{ textTransform: 'none' }}>
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
