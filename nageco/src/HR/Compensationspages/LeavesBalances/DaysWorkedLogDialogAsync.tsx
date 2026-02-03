import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { EMPLOYEE_WITH_LOG } from './ALBalanceTable';

interface DaysWorkedLogDialogAsyncProps {
  open: boolean;
  employee: EMPLOYEE_WITH_LOG | null;
  onClose: () => void;
  getDaysWorkedLog: (emp: EMPLOYEE_WITH_LOG, withTimeline: boolean) => Promise<DaysWorkedLogData>;
}

type DaysWorkedLogData = {
  headerHtml: string;
  timelineRows: string[];
  detailsHtml: string;
  footerHtml: string;
  currentBalance: number;
};

const DaysWorkedLogDialogAsync: React.FC<DaysWorkedLogDialogAsyncProps> = ({ open, employee, onClose, getDaysWorkedLog }) => {
  const [data, setData] = useState<DaysWorkedLogData | null>(null);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const handleExportTimeline = () => {
    if (!data) return;
    const container = document.createElement('div');
    container.innerHTML = `<table><thead>${data.headerHtml}</thead><tbody>${data.timelineRows.join('')}</tbody></table>`;
    const rows = Array.from(container.querySelectorAll('tr')).map(tr =>
      Array.from(tr.cells).map(cell => (cell.textContent || '').trim().replace(/\s+/g, ' '))
    );
    if (rows.length === 0) return;
    const toCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = rows.map(r => r.map(toCsv).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (employee?.NAME || 'timeline').replace(/[^a-z0-9-_]+/gi, '_');
    link.setAttribute('download', `${safeName}_monthly_timeline.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  // Local date formatter for this dialog: MMM-dd-yyyy (e.g., Nov-05-2025)
  const formatDateLocal = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr as string);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  };
  // Compute age in full years from birth date
  const computeAge = (birthStr: string | null | undefined): string => {
    if (!birthStr) return '';
    const b = new Date(birthStr as string);
    if (isNaN(b.getTime())) return '';
    const now = new Date();
    let years = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
    return `${years} yrs`;
  };

  // Compute experience in years (one decimal) from STAR_CONTRAT to now (or to End_contrat if employee inactive)
  const computeExperience = (startStr: string | null | undefined, endStr: string | null | undefined, state: any): string => {
    if (!startStr) return '';
    const s = new Date(startStr as string);
    if (isNaN(s.getTime())) return '';
    let end = new Date();
    const isActive = typeof state === 'boolean' ? state : (typeof state === 'string' ? state.toLowerCase() === 'true' : false);
    if (!isActive && endStr) {
      const e = new Date(endStr as string);
      if (!isNaN(e.getTime())) end = e;
    }
    const diffMs = end.getTime() - s.getTime();
    if (diffMs <= 0) return '0.0 yrs';
    const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return `${years.toFixed(1)} yrs`;
  };

  // Compute the exact date when a dateStr + years occurs (e.g., birth + 50 years)
  const computeDateAtYears = (dateStr: string | null | undefined, yearsToAdd: number): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr as string);
    if (isNaN(d.getTime())) return '';
    const target = new Date(d);
    target.setFullYear(target.getFullYear() + yearsToAdd);
    return formatDateLocal(target.toISOString());
  };
  useEffect(() => {
    let cancelled = false;
    if (employee) {
      setPage(0);
      getDaysWorkedLog(employee, !!employee._withTimeline).then(res => {
        if (!cancelled) setData(res);
      });
    }
    return () => { cancelled = true; };
  }, [employee, getDaysWorkedLog]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Annual Balance Details
        {employee && (
          <div style={{ fontSize: 15, marginTop: 8 }}>
            <b>Name:</b> {employee.NAME || '-'}<br />
            <b>Employee No:</b> {employee.Ref_emp || '-'}<br />
            {(() => {
              const displayStart = employee.STAR_CONTRAT ?? employee.start_contrat_renouvellable ?? null;
              return (
                <>
                  <b>Start Contract:</b> {formatDateLocal(displayStart) || '-'}
                  {employee && (
                    <span style={{ marginLeft: 8, color: '#555' }}>
                      ({computeExperience(displayStart, employee.End_contrat, employee.STATE)})
                      {displayStart && (
                        <span style={{ marginLeft: 8, color: '#1976d2' }}>(20y on {computeDateAtYears(displayStart, 20)})</span>
                      )}
                    </span>
                  )}
                </>
              );
            })()}
            <br />
            <b>Birth Date:</b> {formatDateLocal(employee.date_naissance) || '-'}
            {employee && (
              <span style={{ marginLeft: 8, color: '#555' }}>
                ({computeAge(employee.date_naissance)})
                {employee.date_naissance && (
                  <span style={{ marginLeft: 8, color: '#1976d2' }}>(50y on {computeDateAtYears(employee.date_naissance, 50)})</span>
                )}
              </span>
            )}
          </div>
        )}
      </DialogTitle>
      <DialogContent>
        {/* Monthly Timeline with pagination */}
        {data && data.timelineRows && data.timelineRows.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontWeight: 700, marginBottom: 6 }}>
              <h4 style={{ margin: '6px 0 8px', display: 'inline-flex', alignItems: 'center' }}>Monthly Timeline</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                
                <Button variant="contained" size="small" onClick={handleExportTimeline}>Export to Excel</Button>
              </div>
            </div>
            
            <table
              style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}
              border={1}
              cellPadding={4}
            >
              <thead dangerouslySetInnerHTML={{ __html: data.headerHtml }} />
              <tbody
                dangerouslySetInnerHTML={{
                  __html: data.timelineRows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .join(''),
                }}
              />
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 12 }}>
                Rows {page * rowsPerPage + 1} -
                {Math.min((page + 1) * rowsPerPage, data.timelineRows.length)} of {data.timelineRows.length}
              </span>
              <div>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  sx={{ mr: 1 }}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setPage(p => (p + 1) * rowsPerPage < data.timelineRows.length ? p + 1 : p)}
                  disabled={(page + 1) * rowsPerPage >= data.timelineRows.length}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Details and footer HTML */}
        {data && (
          <div style={{ fontSize: 15 }}
            dangerouslySetInnerHTML={{ __html: `${data.detailsHtml}${data.footerHtml}` }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DaysWorkedLogDialogAsync;
