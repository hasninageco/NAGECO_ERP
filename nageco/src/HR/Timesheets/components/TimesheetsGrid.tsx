import * as React from 'react';
import { Box } from '@mui/material';
import {
  DataGrid,
  GridColDef,
} from '@mui/x-data-grid';
import type { DayKey, TimesheetApiRow, TimesheetDayValue } from '../types';
import { cellClassForMarker, dayKey } from '../timesheetUtils';

export type TimesheetsGridProps = {
  rows: TimesheetApiRow[];
  daysInMonth: number;
  loading?: boolean;
  onRowUpdate: (newRow: TimesheetApiRow, oldRow: TimesheetApiRow) => TimesheetApiRow;
  onRowUpdateError?: (error: unknown) => void;
  selectedKeys: string[];
  onSelectedKeysChange: (keys: string[]) => void;
  onApplyValueToSelected: (value: string | null) => void | Promise<void>;
};

function fieldToDay(field: string): number | null {
  if (!field.startsWith('j_')) return null;
  const n = Number(field.slice(2));
  if (!Number.isFinite(n) || n < 1 || n > 31) return null;
  return n;
}

function makeKey(id: number, field: DayKey): string {
  return `${id}:${field}`;
}

function buildDayColumns(
  daysInMonth: number,
  selectedSet: Set<string>,
  handlers: {
    onMouseDownCell: (args: { id: number; day: number; ctrlKey: boolean; shiftKey: boolean }) => void;
    onMouseEnterCell: (args: { id: number; day: number }) => void;
  }
): GridColDef<TimesheetApiRow>[] {
  const cols: GridColDef<TimesheetApiRow>[] = [];

  for (let d = 1; d <= 31; d++) {
    const key = dayKey(d);
    cols.push({
      field: key,
      headerName: String(d),
      width: 45,
      minWidth: 45,
      maxWidth: 45,
      editable: d <= daysInMonth,
      sortable: false,
      headerAlign: 'center',
      align: 'center',
      cellClassName: (params) => {
        const base = cellClassForMarker(params.value as TimesheetDayValue);
        const isSelected = selectedSet.has(makeKey(Number(params.id), key));
        return `${base}${isSelected ? ' ts-cell-selected' : ''}`;
      },
      renderCell: (params) => (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
          }}
          onMouseDown={(e) => {
            // Prevent text selection while dragging.
            e.preventDefault();
            handlers.onMouseDownCell({
              id: Number(params.id),
              day: d,
              ctrlKey: e.ctrlKey || (e as any).metaKey,
              shiftKey: e.shiftKey,
            });
          }}
          onMouseEnter={() => handlers.onMouseEnterCell({ id: Number(params.id), day: d })}
        >
          {params.value as any}
        </Box>
      ),
    });
  }

  return cols;
}

export default function TimesheetsGrid(props: TimesheetsGridProps) {
  const {
    rows,
    daysInMonth,
    loading,
    onRowUpdate,
    onRowUpdateError,
    selectedKeys,
    onSelectedKeysChange,
    onApplyValueToSelected,
  } = props;

  const selectedSet = React.useMemo(() => new Set(selectedKeys), [selectedKeys]);

  // Selection anchor and drag state
  const anchorRef = React.useRef<{ rowIndex: number; day: number } | null>(null);
  const isDraggingRef = React.useRef(false);

  const rowIndexById = React.useMemo(() => {
    const m = new Map<number, number>();
    rows.forEach((r, idx) => m.set(r.id_tran, idx));
    return m;
  }, [rows]);

  const setRangeSelection = React.useCallback(
    (from: { rowIndex: number; day: number }, to: { rowIndex: number; day: number }) => {
      const r1 = Math.min(from.rowIndex, to.rowIndex);
      const r2 = Math.max(from.rowIndex, to.rowIndex);
      const d1 = Math.min(from.day, to.day);
      const d2 = Math.max(from.day, to.day);

      const keys: string[] = [];
      for (let r = r1; r <= r2; r++) {
        const row = rows[r];
        if (!row) continue;
        for (let d = d1; d <= d2; d++) {
          if (d > daysInMonth) continue;
          keys.push(makeKey(row.id_tran, dayKey(d)));
        }
      }
      onSelectedKeysChange(keys);
    },
    [daysInMonth, onSelectedKeysChange, rows]
  );

  const handlers = React.useMemo(() => {
    return {
      onMouseDownCell: ({ id, day, ctrlKey, shiftKey }: { id: number; day: number; ctrlKey: boolean; shiftKey: boolean }) => {
        const rowIndex = rowIndexById.get(id);
        if (rowIndex == null) return;

        // Shift = range selection from existing anchor (or current cell)
        if (shiftKey) {
          const anchor = anchorRef.current || { rowIndex, day };
          anchorRef.current = anchor;
          isDraggingRef.current = true;
          setRangeSelection(anchor, { rowIndex, day });
          return;
        }

        anchorRef.current = { rowIndex, day };
        isDraggingRef.current = true;

        const key = makeKey(id, dayKey(day));
        if (ctrlKey) {
          const next = new Set(Array.from(selectedSet));
          if (next.has(key)) next.delete(key);
          else next.add(key);
          onSelectedKeysChange(Array.from(next));
        } else {
          onSelectedKeysChange([key]);
        }
      },
      onMouseEnterCell: ({ id, day }: { id: number; day: number }) => {
        if (!isDraggingRef.current) return;
        const anchor = anchorRef.current;
        if (!anchor) return;
        const rowIndex = rowIndexById.get(id);
        if (rowIndex == null) return;
        setRangeSelection(anchor, { rowIndex, day });
      },
    };
  }, [onSelectedKeysChange, rowIndexById, selectedSet, setRangeSelection]);

  React.useEffect(() => {
    const onUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const columns = React.useMemo<GridColDef<TimesheetApiRow>[]>(() => {
    const base: GridColDef<TimesheetApiRow>[] = [
      
      {
        field: 'Ref_emp',
        headerName: 'Emp. No',
        width: 90,
        sortable: false,
      },
      {
        field: 'employeeName',
        headerName: 'Employee Name',
        width: 200,
        sortable: false,
      },
    ];

    return [...base, ...buildDayColumns(daysInMonth, selectedSet, handlers)];
  }, [daysInMonth, handlers, selectedSet]);

  const columnVisibilityModel = React.useMemo(() => {
    const model: Record<string, boolean> = {};
    for (let d = daysInMonth + 1; d <= 31; d++) {
      model[dayKey(d)] = false;
    }
    return model;
  }, [daysInMonth]);

  return (
    <Box
      sx={{
        height: 620,
        width: '100%',
        '& .ts-cell-h': { bgcolor: 'rgba(76, 175, 80, 0.35)' },
        '& .ts-cell-p': { bgcolor: 'rgba(33, 150, 243, 0.18)' },
        '& .ts-cell-a': { bgcolor: 'rgba(244, 67, 54, 0.18)' },
        '& .ts-cell-v': { bgcolor: 'rgba(255, 193, 7, 0.22)' },
        '& .ts-cell-b': { bgcolor: 'rgba(156, 39, 176, 0.12)' },
        '& .ts-cell-td': { bgcolor: 'rgba(0, 188, 212, 0.16)' },
        '& .ts-cell-selected': {
          outline: '2px solid rgba(25, 118, 210, 0.85)',
          outlineOffset: '-2px',
        },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r: any) => r.id_tran}
        loading={loading}
        disableRowSelectionOnClick
        disableColumnMenu
        columnHeaderHeight={34}
        rowHeight={32}
        hideFooter
        onCellKeyDown={(params, event) => {
          if (event.key === 'Escape') {
            onSelectedKeysChange([]);
          }

          // When cells are selected, typing should fill them (Excel-like).
          // - Any single character: apply uppercase
          // - Backspace/Delete: clear
          // We also prevent DataGrid from entering edit mode.
          if (selectedKeys.length > 0) {
            if (event.key === 'Backspace' || event.key === 'Delete') {
              event.preventDefault();
              (event as any).stopPropagation?.();
              onApplyValueToSelected(null);
              return;
            }

            if (event.key.length === 1 && !event.ctrlKey && !(event as any).metaKey && !event.altKey) {
              const ch = event.key.toUpperCase();
              // ignore whitespace
              if (ch.trim().length > 0) {
                event.preventDefault();
                (event as any).stopPropagation?.();
                onApplyValueToSelected(ch);
                return;
              }
            }
          }

          // Ctrl/Cmd + A selects all visible day cells
          if ((event.ctrlKey || (event as any).metaKey) && (event.key === 'a' || event.key === 'A')) {
            event.preventDefault();
            const keys: string[] = [];
            for (const r of rows) {
              for (let d = 1; d <= daysInMonth; d++) {
                keys.push(makeKey(r.id_tran, dayKey(d)));
              }
            }
            onSelectedKeysChange(keys);
          }

          // Shift + click range is handled by mouse; Shift + arrows: extend selection
          const day = fieldToDay(String(params.field));
          const rowId = Number(params.id);
          if (event.shiftKey && day && rowIndexById.has(rowId)) {
            const anchor = anchorRef.current || { rowIndex: rowIndexById.get(rowId) as number, day };
            anchorRef.current = anchor;
            const current = { rowIndex: rowIndexById.get(rowId) as number, day };
            setRangeSelection(anchor, current);
          }
        }}
        processRowUpdate={(newRow, oldRow) => onRowUpdate(newRow as any, oldRow as any) as any}
        onProcessRowUpdateError={onRowUpdateError}
        initialState={{
          columns: { columnVisibilityModel },
        }}
      />
    </Box>
  );
}
