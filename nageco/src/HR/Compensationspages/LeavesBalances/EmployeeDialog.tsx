import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Box, TextField } from '@mui/material';
import { EMPLOYEE } from './ALBalanceTable';

interface EmployeeDialogProps {
  open: boolean;
  isEditMode: boolean;
  editItem: EMPLOYEE | null;
  errors: any;
  onClose: () => void;
  onSave: () => void;
  setEditItem: (item: EMPLOYEE) => void;
}

const EmployeeDialog: React.FC<EmployeeDialogProps> = ({ open, isEditMode, editItem, errors, onClose, onSave, setEditItem }) => {
  if (!editItem) return null;
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {isEditMode ? 'Edit Entry' : 'New Entry'}
        <Divider sx={{ mb: 0, borderColor: 'grey.300', borderBottomWidth: 2 }} />
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          <TextField
            label="Name"
            fullWidth
            value={editItem?.NAME || ''}
            onChange={(e) => setEditItem({ ...editItem, NAME: e.target.value })}
            error={!!errors.NAME}
            helperText={errors.NAME}
          />
          <TextField
            label="Mail"
            fullWidth
            value={editItem?.MAIL || ''}
            onChange={(e) => setEditItem({ ...editItem, MAIL: e.target.value })}
          />
          <TextField
            label="End Contract"
            fullWidth
            type="date"
            InputLabelProps={{ shrink: true }}
            value={editItem?.End_contrat ? editItem.End_contrat.substring(0, 10) : ''}
            onChange={(e) => setEditItem({ ...editItem, End_contrat: e.target.value })}
          />
          <TextField
            label="Start Contract"
            fullWidth
            type="date"
            InputLabelProps={{ shrink: true }}
            value={editItem?.STAR_CONTRAT ? editItem.STAR_CONTRAT.substring(0, 10) : ''}
            onChange={(e) => setEditItem({ ...editItem, STAR_CONTRAT: e.target.value })}
          />
          <TextField
            label="Nationality"
            fullWidth
            value={editItem?.Nationality || ''}
            onChange={(e) => setEditItem({ ...editItem, Nationality: e.target.value })}
          />
          <TextField
            label="Ref Emp"
            fullWidth
            value={editItem?.Ref_emp || ''}
            onChange={(e) => setEditItem({ ...editItem, Ref_emp: e.target.value })}
          />
          <TextField
            label="Cost Center"
            fullWidth
            value={editItem?.COST_CENTER || ''}
            onChange={(e) => setEditItem({ ...editItem, COST_CENTER: e.target.value })}
          />
          <TextField
            label="Picture (base64 or URL)"
            fullWidth
            value={editItem?.Picture || ''}
            onChange={(e) => setEditItem({ ...editItem, Picture: e.target.value })}
          />
          <TextField
            label="Birth Date"
            fullWidth
            type="date"
            InputLabelProps={{ shrink: true }}
            value={editItem?.date_naissance ? editItem.date_naissance.substring(0, 10) : ''}
            onChange={(e) => setEditItem({ ...editItem, date_naissance: e.target.value })}
          />
          {/* Add other fields as needed */}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={onSave} color="primary">{isEditMode ? 'Save Changes' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeDialog;
