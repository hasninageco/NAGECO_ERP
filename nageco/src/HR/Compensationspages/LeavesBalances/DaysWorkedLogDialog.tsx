import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { EMPLOYEE_WITH_LOG } from './ALBalanceTable';

interface DaysWorkedLogDialogProps {
  open: boolean;
  employee: EMPLOYEE_WITH_LOG | null;
  onClose: () => void;
  getDaysWorkedLog: (emp: EMPLOYEE_WITH_LOG, withTimeline: boolean) => string;
}

const DaysWorkedLogDialog: React.FC<DaysWorkedLogDialogProps> = ({ open, employee, onClose, getDaysWorkedLog }) => {
  // Local formatter for this dialog: returns MMM-dd-yyyy (e.g., Nov-05-2025)
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
    // consider employee not active -> use End_contrat when available
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
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Annual Balance Details
        {employee && (
          <div style={{ fontSize: 15, marginTop: 8 }}>
            <b>Name:</b> {employee.NAME || '-'}<br />
            <b>Employee No:</b> {employee.Ref_emp || '-'}<br />
            {/* Show Start Contract and Birth Date in MMM-dd-yyyy */}
            {/* Prefer showing legacy STAR_CONTRAT first (if available), otherwise the renewable start */}
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
        {employee && (
          <div style={{ fontSize: 15 }}
            dangerouslySetInnerHTML={{ __html: getDaysWorkedLog(employee, !!employee._withTimeline) }} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DaysWorkedLogDialog;
