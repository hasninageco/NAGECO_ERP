import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton,
  TextField,
  MenuItem,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

type Child = {
  ID_CHILD: number;
  NAME_CHILD?: string;
  English_Name?: string;
  type_child?: string;
  DATE_NAISSANCE?: string;
  SEX?: string;
  NUM_NATIONAL?: string;
  NOTIONALITY?: string;
  Passport_Number?: string;
  TEL?: string;
  ADRESS?: string;
  MAIL?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  empRef: string | number | null;
};

const ChildrenDialog: React.FC<Props> = ({ open, onClose, empRef }) => {
  const { t: tr } = useTranslation();
  const relationshipOptions = [
    { value: 'Father', key: 'father' },
    { value: 'Husband', key: 'husband' },
    { value: 'Wife', key: 'wife' },
    { value: 'Mother', key: 'mother' },
    { value: 'Son', key: 'son' },
    { value: 'Doughter', key: 'daughter' },
  ] as const;
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    if (!empRef) {
      setChildren([]);
      return;
    }

    fetchChildren();
  }, [open, empRef, navigate]);

  const fetchChildren = async () => {
    if (!empRef) return;
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    setLoading(true);
    try {
      const resp = await axios.get<Child[]>(`${buildApiUrl('/children')}/employee/${empRef}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChildren(resp.data || []);
    } catch (err) {
      console.error('Error fetching children', err);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editChild, setEditChild] = useState<Partial<Child> | null>(null);

  const openEdit = (c: Child) => {
    setEditChild({ ...c });
    setEditOpen(true);
  };

  const openAdd = () => {
    // initialize empty child with EMP_CHILD handled on submit
    setEditChild({});
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditChild(null);
  };

  const saveEdit = async () => {
    const id = editChild?.ID_CHILD;
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    try {
      if (id) {
        await axios.put(
          `${buildApiUrl('/children')}/Update/${id}`,
          {
            NAME_CHILD: editChild.NAME_CHILD,
            English_Name: editChild.English_Name,
            DATE_NAISSANCE: editChild.DATE_NAISSANCE,
            SEX: editChild.SEX,
            NUM_NATIONAL: editChild.NUM_NATIONAL,
            NOTIONALITY: editChild.NOTIONALITY,
            Passport_Number: editChild.Passport_Number,
            type_child: editChild.type_child,
            TEL: editChild.TEL,
            ADRESS: editChild.ADRESS,
            MAIL: editChild.MAIL,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // create
        await axios.post(
          `${buildApiUrl('/children')}/Add`,
          {
            NAME_CHILD: editChild?.NAME_CHILD,
            English_Name: editChild?.English_Name,
            DATE_NAISSANCE: editChild?.DATE_NAISSANCE,
            SEX: editChild?.SEX,
            NUM_NATIONAL: editChild?.NUM_NATIONAL,
            NOTIONALITY: editChild?.NOTIONALITY,
            Passport_Number: editChild?.Passport_Number,
            type_child: editChild?.type_child,
            TEL: editChild?.TEL,
            ADRESS: editChild?.ADRESS,
            MAIL: editChild?.MAIL,
            EMP_CHILD: empRef,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      closeEdit();
      await fetchChildren();
    } catch (err) {
      console.error('Error updating child', err);
      alert('Failed to update child');
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Children for {empRef}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <div style={{ padding: 16 }}>Loading...</div>
        ) : (
          <List>
            {children.length === 0 && (
              <ListItem>
                <ListItemText primary="No children found" />
              </ListItem>
            )}
            {children.map((c) => (
              <ListItem
                key={c.ID_CHILD}
                divider
                secondaryAction={
                  <IconButton edge="end" aria-label="edit" onClick={() => openEdit(c)}>
                    <EditIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={c.English_Name || c.NAME_CHILD}
                  secondary={
                    `${c.DATE_NAISSANCE || ''} • ${c.SEX || ''}` +
                    (c.type_child ? ` • ${c.type_child}` : '') +
                    (c.NOTIONALITY ? ` • ${c.NOTIONALITY}` : '') +
                    (c.Passport_Number ? ` • ${c.Passport_Number}` : '') +
                    ` • ${c.NUM_NATIONAL || ''}`
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={openAdd} variant="outlined" startIcon={<AddIcon />}>Add Child</Button>
        <Button onClick={onClose} startIcon={<CloseIcon />}>Close</Button>
      </DialogActions>
      </Dialog>
      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>
          {editChild?.ID_CHILD
            ? tr('insurance.workers.childDialog.editTitle')
            : tr('insurance.workers.childDialog.addTitle')}
        </DialogTitle>
        <DialogContent dividers>
          {editChild && (
            <div style={{ display: 'grid', gap: 12 }}>
              <TextField
                label={tr('insurance.workers.childDialog.fields.englishName')}
                value={editChild?.English_Name ?? ''}
                onChange={(e) => setEditChild(prev => ({ ...(prev ?? {}), English_Name: e.target.value }))}
                fullWidth
              />
              <TextField
                label={tr('insurance.workers.childDialog.fields.name')}
                value={editChild?.NAME_CHILD ?? ''}
                onChange={(e) => setEditChild(prev => ({ ...(prev ?? {}), NAME_CHILD: e.target.value }))}
                fullWidth
              />
              <TextField
                label={tr('insurance.workers.childDialog.fields.relationship')}
                value={editChild?.type_child ?? ''}
                select
                onChange={(e) => setEditChild(prev => ({ ...(prev ?? {}), type_child: e.target.value }))}
                fullWidth
              >
                {relationshipOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {tr(`insurance.workers.childDialog.relationshipOptions.${option.key}`)}
                  </MenuItem>
                ))}
                {(editChild?.type_child ?? '') &&
                  !relationshipOptions.some((option) => option.value === (editChild?.type_child ?? '')) && (
                    <MenuItem value={editChild?.type_child ?? ''}>{editChild?.type_child}</MenuItem>
                  )}
              </TextField>
              <TextField
                label={tr('insurance.workers.childDialog.fields.nationality')}
                value={editChild?.NOTIONALITY ?? ''}
                onChange={(e) => setEditChild(prev => ({ ...(prev ?? {}), NOTIONALITY: e.target.value }))}
                fullWidth
              />
              <TextField
                label={tr('insurance.workers.childDialog.fields.passportNumber')}
                value={editChild?.Passport_Number ?? ''}
                onChange={(e) => setEditChild(prev => ({ ...(prev ?? {}), Passport_Number: e.target.value }))}
                fullWidth
              />
              <TextField
                label={tr('insurance.workers.childDialog.fields.dateOfBirth')}
                type="date"
                value={(editChild?.DATE_NAISSANCE ?? '').toString().slice(0, 10)}
                onChange={(e) => setEditChild(prev => ({ ...(prev ?? {}), DATE_NAISSANCE: e.target.value }))}
                onFocus={(e) => {
                  const input = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                  input.showPicker?.();
                }}
                onClick={(e) => {
                  const input = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                  input.showPicker?.();
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label={tr('insurance.workers.childDialog.fields.phone')}
                value={editChild?.TEL ?? ''}
                onChange={(e) => setEditChild(prev => ({ ...(prev ?? {}), TEL: e.target.value }))}
                fullWidth
              />
              <TextField
                label={tr('insurance.workers.childDialog.fields.nationalNo')}
                value={editChild?.NUM_NATIONAL ?? ''}
                onChange={(e) => setEditChild(prev => ({ ...(prev ?? {}), NUM_NATIONAL: e.target.value }))}
                fullWidth
              />
              <TextField
                label={tr('insurance.workers.childDialog.fields.address')}
                value={editChild?.ADRESS ?? ''}
                onChange={(e) => setEditChild(prev => ({ ...(prev ?? {}), ADRESS: e.target.value }))}
                fullWidth
              />
              <TextField
                label={tr('insurance.workers.childDialog.fields.email')}
                value={editChild?.MAIL ?? ''}
                onChange={(e) => setEditChild(prev => ({ ...(prev ?? {}), MAIL: e.target.value }))}
                fullWidth
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={closeEdit} startIcon={<CancelIcon />}>{tr('common.cancel')}</Button>
          <Button
            onClick={saveEdit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={
              !editChild || !(editChild?.English_Name || editChild?.NAME_CHILD)
            }
          >
            {tr('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChildrenDialog;
