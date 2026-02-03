import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { Box, Typography, Paper, Button, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent, Card, CardContent, CardActions, CircularProgress, TextField, Alert } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTheme, alpha } from '@mui/material/styles';
import axios from 'axios';
import { buildApiUrl } from '../utils/api';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getMonthDays(year: number, month: number) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const MeetingCalendar: React.FC = () => {
  
  const [employees, setEmployees] = React.useState<any[]>([]);
  // Function to send meeting data to Microsoft Teams
  const sendToTeams = async () => {
    // Prepare meeting data
    const meetingData = {
      subject: newMeeting.comment,
      startDateTime: `${newMeeting.date_meeting}T${newMeeting.time_meeting}`,
      endDateTime: `${newMeeting.date_meeting_end}T${newMeeting.time_meeting_end}`,
      attendees: [
        ...newMeeting.members_meeting.map(email => ({ email })),
        ...newMeeting.Other_members_meeting.map(email => ({ email }))
      ],
      location: rooms.find(r => r.id_room === newMeeting.id_room)?.Name_room || '',
      comment: newMeeting.comment
    };
    
    try {
      // Replace with your Microsoft Teams API endpoint and authentication
        await axios.post('https://graph.microsoft.com/v1.0/me/events', meetingData, {
        headers: {
          Authorization: `Bearer YOUR_ACCESS_TOKEN`,
          'Content-Type': 'application/json'
        }
      });
      alert('Meeting booked in Microsoft Teams!');
    } catch (error) {
      alert('Failed to book meeting in Teams. Please check your API credentials and data.');
    }
  };
  // Function to send edited meeting data to Microsoft Teams
  const sendEditToTeams = async () => {
    if (!editMeeting) return;
    const attendees = [
      ...(Array.isArray(editMeeting.members_meeting) ? editMeeting.members_meeting : String(editMeeting.members_meeting).split(',')).filter(Boolean).map((email: string) => ({ email })),
      ...(Array.isArray(editMeeting.Other_members_meeting) ? editMeeting.Other_members_meeting : (editMeeting.Other_members_meeting ? String(editMeeting.Other_members_meeting).split(',') : [])).filter(Boolean).map((email: string) => ({ email }))
    ];
    const meetingData = {
      subject: editMeeting.comment,
      startDateTime: `${editMeeting.date_meeting}T${editMeeting.time_meeting}`,
      endDateTime: `${editMeeting.date_meeting_end}T${editMeeting.time_meeting_end}`,
      attendees,
      location: rooms.find(r => r.id_room === editMeeting.id_room)?.Name_room || '',
      comment: editMeeting.comment
    };
    try {
      await axios.post('https://graph.microsoft.com/v1.0/me/events', meetingData, {
        headers: {
          Authorization: `Bearer YOUR_ACCESS_TOKEN`,
          'Content-Type': 'application/json'
        }
      });
      alert('Meeting booked in Microsoft Teams!');
    } catch (error) {
      alert('Failed to book meeting in Teams. Please check your API credentials and data.');
    }
  };
  // (removed unused helper add24Hours)
  const theme = useTheme();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [view, setView] = React.useState<'month' | 'year' | 'day'>('month');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // Room dialog state
  const [roomsDialogOpen, setRoomsDialogOpen] = React.useState(false);
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [editMeetingOpen, setEditMeetingOpen] = React.useState(false);
  const [editMeeting, setEditMeeting] = React.useState<any>(null);
  const [loadingRooms, setLoadingRooms] = React.useState(false);
  const [editRoom, setEditRoom] = React.useState<any>(null);
  const [editRoomOpen, setEditRoomOpen] = React.useState(false);
  const [editLoading, setEditLoading] = React.useState(false);
  const [addRoomOpen, setAddRoomOpen] = React.useState(false);
  const [newRoom, setNewRoom] = React.useState({ Name_room: '', Location: '', Comment: '', Address: '', InServices: false });
  const [addLoading, setAddLoading] = React.useState(false);

  // Meeting dialog state
  const [meetings, setMeetings] = React.useState<any[]>([]);
  const [, setLoadingMeetings] = React.useState(false); // only setter is used
  const [addMeetingOpen, setAddMeetingOpen] = React.useState(false);
  const [newMeeting, setNewMeeting] = React.useState<{ date_meeting: string; time_meeting: string; date_meeting_end: string; time_meeting_end: string; id_room: string; members_meeting: string[]; comment: string; usr: string; Other_members_meeting: string[] }>(
    { date_meeting: '', time_meeting: '', date_meeting_end: '', time_meeting_end: '', id_room: '', members_meeting: [], comment: '', usr: '0', Other_members_meeting: [] }
  );
  const [addMeetingLoading, setAddMeetingLoading] = React.useState(false);
  const [validation, setValidation] = React.useState({
    comment: false,
    date_meeting: false,
    time_meeting: false,
    time_meeting_end: false,
    id_room: false,
    members_meeting: false,
    overlap: false
  });

  React.useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Use the HR Employee API for default list
        // Add authorization header if token exists
        const token = localStorage.getItem('token');
        const res = await axios.get(buildApiUrl('/employees/all'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setEmployees(res.data);
      } catch {
        setEmployees([]);
      }
    };
    const fetchMeetings = async () => {
      setLoadingMeetings(true);
      try {
        const res = await axios.get(buildApiUrl('/meetingSchedules'));
        setMeetings(res.data);
      } catch {
        setMeetings([]);
      }
      setLoadingMeetings(false);
    };
    const fetchRooms = async () => {
      try {
        const res = await axios.get(buildApiUrl('/meetingSchedules/rooms'));
        setRooms(res.data);
      } catch {
        setRooms([]);
      }
    };
    fetchMeetings();
    fetchRooms();
    fetchEmployees();
  }, [addMeetingOpen]);

  const handlePrev = () => {
    if (view === 'month') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else if (view === 'year') {
      setCurrentYear(currentYear - 1);
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else if (view === 'year') {
      setCurrentYear(currentYear + 1);
    }
  };

  const handleViewChange = (newView: 'month' | 'year' | 'day') => {
    setView(newView);
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Month view
  const days = getMonthDays(currentYear, currentMonth);
  const weeks: Date[][] = [];
  let week: Date[] = [];
  days.forEach((day, idx) => {
    if (day.getDay() === 0 && week.length) {
      weeks.push(week);
      week = [];
    }
    week.push(day);
    if (idx === days.length - 1) weeks.push(week);
  });

  // Year view
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(currentYear, i, 1)
  );

  // Day view
  const selectedDay = new Date(currentYear, currentMonth, today.getDate());

  const handleOpenRoomsDialog = async () => {
    setRoomsDialogOpen(true);
    setLoadingRooms(true);
    try {
      const res = await axios.get(buildApiUrl('/meetingRooms'));
      setRooms(res.data);
    } catch (e) {
      setRooms([]);
    }
    setLoadingRooms(false);
  };
  const handleCloseRoomsDialog = () => { setRoomsDialogOpen(false); setEditRoom(null); };

  const handleEditRoom = (room: any) => {
    setEditRoom(room);
    setEditRoomOpen(true);
  };
  const handleCloseEditRoom = () => {
    setEditRoomOpen(false);
    setEditRoom(null);
  };
  const handleUpdateRoom = async () => {
    setEditLoading(true);
    try {
      await axios.put(buildApiUrl(`/meetingRooms/${editRoom.id_room}`), editRoom);
      setRooms(rooms.map(r => r.id_room === editRoom.id_room ? editRoom : r));
      setEditRoomOpen(false);
      setEditRoom(null);
    } catch { }
    setEditLoading(false);
  };
  const handleDeleteRoom = async (id: number) => {
    setEditLoading(true);
    try {
      await axios.delete(buildApiUrl(`/meetingRooms/${id}`));
      setRooms(rooms.filter(r => r.id_room !== id));
    } catch { }
    setEditLoading(false);
  };
  const handleOpenAddRoom = () => { setAddRoomOpen(true); setNewRoom({ Name_room: '', Location: '', Comment: '', Address: '', InServices: false }); };
  const handleCloseAddRoom = () => setAddRoomOpen(false);
  const handleAddRoom = async () => {
    setAddLoading(true);
    try {
      const res = await axios.post(buildApiUrl('/meetingRooms'), newRoom);
      setRooms([...rooms, res.data]);
      setAddRoomOpen(false);
    } catch { }
    setAddLoading(false);
  };

  const formatDateForSQLServer = (date: Date) => {
    const pad = (n: number, z = 2) => ('00' + n).slice(-z);
    return date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate()) + ' ' +
      pad(date.getHours()) + ':' +
      pad(date.getMinutes()) + ':' +
      pad(date.getSeconds()) + '.' +
      pad(date.getMilliseconds(), 3);
  };

  const handleOpenAddMeeting = () => {
    axios.get(buildApiUrl('/meetingSchedules/rooms'))
      .then(res => setRooms(res.data))
      .catch(() => setRooms([]));
    setAddMeetingOpen(true);
    setNewMeeting({
      date_meeting: '',
      time_meeting: '',
      date_meeting_end: '',
      time_meeting_end: '',
      id_room: '',
      members_meeting: [],
      comment: '',
      usr: '0',
      Other_members_meeting: []
    });
  };
  const handleCloseAddMeeting = () => setAddMeetingOpen(false);
  
  // Save (update) edited meeting back to backend
  const handleSaveEditedMeeting = async () => {
    if (!editMeeting) return;
    setEditLoading(true);
    try {
      // Prepare datetime formatting
      let fullDateTime = '';
      let fullDateTimeEnd = '';
      if (editMeeting.date_meeting && editMeeting.time_meeting) {
        const dt = new Date(`${editMeeting.date_meeting}T${editMeeting.time_meeting}:00`);
        fullDateTime = formatDateForSQLServer(dt);
      }
      if (editMeeting.date_meeting_end && editMeeting.time_meeting_end) {
        const dtEnd = new Date(`${editMeeting.date_meeting_end}T${editMeeting.time_meeting_end}:00`);
        fullDateTimeEnd = formatDateForSQLServer(dtEnd);
      }

      const meetingToSend: any = {
        ...editMeeting,
        date_meeting: fullDateTime || editMeeting.date_meeting,
        date_meeting_end: fullDateTimeEnd || editMeeting.date_meeting_end,
        Other_members_meeting: Array.isArray(editMeeting.Other_members_meeting) ? editMeeting.Other_members_meeting.join(',') : editMeeting.Other_members_meeting
      };
      // determine current user name from localStorage or token
      const getCurrentUserName = () => {
        const byKey = localStorage.getItem('username')  ;
        if (byKey) return byKey;
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          return payload.name || payload.username || payload.preferred_username || payload.email || payload.sub || null;
        } catch (e) {
          return null;
        }
      };

      const currentUserName = getCurrentUserName();

      // override usr with current user name when saving
      meetingToSend.usr = currentUserName || editMeeting.usr || '0';

      // Determine an identifier for the meeting (backend may use id_meeting, id or _id)
      const meetingId = editMeeting.id_meeting ?? editMeeting.id ?? editMeeting._id;
      if (!meetingId) throw new Error('Cannot determine meeting id for update');

      const res = await axios.put(buildApiUrl(`/meetingSchedules/${meetingId}`), meetingToSend);
      // Update local state with returned meeting (or fallback to our edited object)
      const updated = res && res.data ? res.data : meetingToSend;
      setMeetings(prev => prev.map(m => (m.id_meeting === meetingId || m.id === meetingId || m._id === meetingId) ? updated : m));
      setEditMeetingOpen(false);
      setEditMeeting(null);
    } catch (err) {
      alert('Failed to update meeting. Check backend logs.');
    }
    setEditLoading(false);
  };
  const handleAddMeeting = async () => {
    // Validation: check for empty fields
    const employeeNames = employees.map(emp => emp.NAME);
    const invalidMembers = newMeeting.members_meeting.filter(m => !employeeNames.includes(m));
    const newValidation = {
      comment: !newMeeting.comment,
      date_meeting: !newMeeting.date_meeting,
      time_meeting: !newMeeting.time_meeting,
      time_meeting_end: !newMeeting.time_meeting_end,
      id_room: !newMeeting.id_room,
      members_meeting: !newMeeting.members_meeting || newMeeting.members_meeting.length === 0 || invalidMembers.length > 0,
      overlap: false,
      invalidMembers: invalidMembers.length > 0
    };
    // Check for overlap
    const start = new Date(`${newMeeting.date_meeting}T${newMeeting.time_meeting}`);
    const end = new Date(`${newMeeting.date_meeting_end}T${newMeeting.time_meeting_end}`);
    const overlap = meetings.some(m =>
      m.id_room === newMeeting.id_room &&
      ((new Date(m.date_meeting) < end && new Date(m.date_meeting_end) > start))
    );
    newValidation.overlap = overlap;
    setValidation(newValidation);
    if (Object.values(newValidation).some(Boolean)) {
      return;
    }
    setAddMeetingLoading(true);
    try {
      let fullDateTime = '';
      let fullDateTimeEnd = '';
      if (newMeeting.date_meeting && newMeeting.time_meeting) {
        const dt = new Date(`${newMeeting.date_meeting}T${newMeeting.time_meeting}:00`);
        fullDateTime = formatDateForSQLServer(dt);
      }
      if (newMeeting.date_meeting_end && newMeeting.time_meeting_end) {
        const dtEnd = new Date(`${newMeeting.date_meeting_end}T${newMeeting.time_meeting_end}:00`);
        fullDateTimeEnd = formatDateForSQLServer(dtEnd);
      }
      const { time_meeting, time_meeting_end, ...meetingToSend } = {
        ...newMeeting,
        date_meeting: fullDateTime,
        date_meeting_end: fullDateTimeEnd,
        creation_date: formatDateForSQLServer(new Date()),
        Other_members_meeting: Array.isArray(newMeeting.Other_members_meeting) ? newMeeting.Other_members_meeting.join(',') : newMeeting.Other_members_meeting
      };
      // set current user on new meeting if available
      const tokenForName = localStorage.getItem('token');
      let createdBy = localStorage.getItem('username') || localStorage.getItem('name') || localStorage.getItem('user') || null;
      if (!createdBy && tokenForName) {
        try {
          const payload = JSON.parse(atob(tokenForName.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
          createdBy = payload.name || payload.username || payload.preferred_username || payload.email || payload.sub || null;
        } catch (e) { /* ignore */ }
      }
      if (createdBy) meetingToSend.usr = createdBy;
      await axios.post(buildApiUrl('/meetingSchedules'), meetingToSend);
      setAddMeetingOpen(false);
      setNewMeeting({ date_meeting: '', time_meeting: '', date_meeting_end: '', time_meeting_end: '', id_room: '', members_meeting: [], comment: '', usr: '0', Other_members_meeting: [] });
    } catch (err) {
      alert('Error adding meeting. Check required fields and backend logs.');
    }
    setAddMeetingLoading(false);
  };

  return (





    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePrev}><ArrowBackIosIcon /></IconButton>
          <Typography variant="h5" sx={{ minWidth: 120 }}>
            {view === 'month' && `${selectedDay.toLocaleString('default', { month: 'long' })} ${currentYear}`}
            {view === 'year' && currentYear}
            {view === 'day' && selectedDay.toDateString()}
          </Typography>
          <IconButton onClick={handleNext}><ArrowForwardIosIcon /></IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>


          <Button
            variant="outlined"
            startIcon={<CalendarMonthIcon />}
            onClick={handleMenuOpen}
            sx={{ textTransform: 'none', fontSize: '0.85rem' }}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)} view
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleOpenRoomsDialog}
            sx={{ ml: 2, textTransform: 'none', fontSize: '0.85rem' }}
          >
            Rooms
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleOpenAddMeeting}
            sx={{ ml: 1, textTransform: 'none', fontSize: '0.85rem' }}
          >
            New Meeting
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => handleViewChange('month')}>Month</MenuItem>
            <MenuItem onClick={() => handleViewChange('year')}>Year</MenuItem>
            <MenuItem onClick={() => handleViewChange('day')}>Day</MenuItem>
          </Menu>
        </Box>



      </Box>
      <Paper sx={{ overflowX: 'auto', boxShadow: 2, minHeight: 520 }}>
        {view === 'month' && (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#222', color: '#fff', py: 1 }}>
              {daysOfWeek.map((d) => (
                <Typography key={d} align="center" sx={{ fontWeight: 600 }}>{d}</Typography>
              ))}
            </Box>
            {weeks.map((week, i) => (
              <Box key={i} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #eee', minHeight: 72 }}>
                {Array(7).fill(null).map((_, idx) => {
                  const day = week[idx];
                  const dayMeetings = day ? meetings.filter(m => new Date(m.date_meeting).toDateString() === day.toDateString()) : [];
                  return (
                    <Box key={idx} sx={{ borderRight: '1px solid #eee', minHeight: 72, p: 1, position: 'relative' }}>
                      {day ? (
                        <>
                          <Typography variant="body2" sx={{ fontWeight: day.getDate() === today.getDate() && day.getMonth() === today.getMonth() ? 700 : 400, color: day.getDate() === today.getDate() && day.getMonth() === today.getMonth() ? 'primary.main' : 'inherit' }}>{day.getDate()}</Typography>
                          {dayMeetings.length > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                              {dayMeetings.map((meeting, idx) => (
                                <Box key={idx} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), border: '1px solid', borderColor: 'secondary.main', color: 'inherit', borderRadius: 2, px: 0.5, py: 0.2, fontSize: '0.75rem', mb: 0.3, boxShadow: 1 }}>
                                    <div>
                                    <b style={{ fontSize: '1.23em', textDecoration: 'underline' }}>{meeting.comment}</b>
                                    </div>
                                  <div><b>Room:</b> {rooms.find(r => r.id_room === meeting.id_room)?.Name_room || meeting.id_room}</div>
                                  <div><b>Members:</b>
                                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                                      {(Array.isArray(meeting.members_meeting) ? meeting.members_meeting : String(meeting.members_meeting).split(',')).map((m: string, i: number) => (
                                        <li key={i}>{m}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div><b>Start:</b> {meeting.time_meeting || (meeting.date_meeting ? new Date(meeting.date_meeting).toISOString().slice(11, 16) : '')}</div>
                                  <div><b>End:</b> {meeting.time_meeting_end || (meeting.date_meeting_end ? new Date(meeting.date_meeting_end).toISOString().slice(11, 16) : '')}</div>

                                  <div><b>Created by:</b> {meeting.usr}</div>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', justifyContent: 'flex-end', mt: 1,mb:1,mr:1 }}>
                                    <Button size="small" variant="contained" color="secondary" onClick={() => {
                                      // Parse meeting date/time for form fields
                                      let date_meeting = "";
                                      let time_meeting = "";
                                      let date_meeting_end = "";
                                      let time_meeting_end = "";
                                      // If meeting.date_meeting is a full datetime string, parse it
                                      if (meeting.date_meeting) {
                                      const startDate = new Date(meeting.date_meeting);
                                      startDate.setHours(startDate.getHours() + 24);
                                      date_meeting = startDate.toISOString().slice(0, 10);
                                      time_meeting = startDate.toISOString().slice(11, 16);
                                      }
                                      if (meeting.date_meeting_end) {
                                      const endDate = new Date(meeting.date_meeting_end);
                                      endDate.setHours(endDate.getHours() + 24);
                                      date_meeting_end = endDate.toISOString().slice(0, 10);
                                      time_meeting_end = endDate.toISOString().slice(11, 16);
                                      }
                                      setEditMeeting({
                                      ...meeting,
                                      date_meeting,
                                      time_meeting,
                                      date_meeting_end,
                                      time_meeting_end,
                                      usr: '0'
                                      });
                                      setEditMeetingOpen(true);
                                    }}>Edit</Button>
                                    </Box>

                                </Box>
                              ))}
                            </Box>
                          )}
                        </>
                      ) : null}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </>
        )}
        {view === 'year' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, p: 2 }}>
            {months.map((month, idx) => (
              <Paper key={idx} sx={{ p: 2, textAlign: 'center', cursor: 'pointer' }} onClick={() => { setCurrentMonth(idx); setView('month'); }}>
                <Typography variant="h6">{month.toLocaleString('default', { month: 'long' })}</Typography>
              </Paper>
            ))}
          </Box>
        )}
        {view === 'day' && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4">{selectedDay.toDateString()}</Typography>
            {/* Add meeting details/events for the selected day here */}
          </Box>
        )}
      </Paper>

      {/* Rooms Dialog */}
      <Dialog open={roomsDialogOpen} onClose={handleCloseRoomsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Meeting Rooms</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" onClick={handleOpenAddRoom} size="small">Add Room</Button>
          </Box>
          {loadingRooms ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {rooms.map(room => (
                <Card
                  key={room.id_room}
                  sx={{
                    minWidth: 220,
                    flex: '1 1 220px',
                    border: room.InServices ? '2px solid orange' : undefined,
                    boxShadow: room.InServices ? '0 0 8px 2px orange' : undefined
                  }}
                >
                  <CardContent>
                    <Typography variant="h6">{room.Name_room}</Typography>
                    <Typography variant="body2" color="text.secondary"><b>Location:</b> {room.Location}</Typography>
                    <Typography variant="body2" color="text.secondary"><b>Address:</b> {room.Address}</Typography>
                    <Typography variant="body2" color="text.secondary"><b>Comment:</b> {room.Comment}</Typography>
                    {room.InServices && (
                      <Box sx={{ mt: 1 }}>
                        <Alert severity="warning" icon={false} sx={{ p: 0.5, fontSize: '0.9rem' }}>
                          This room is in service
                        </Alert>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleEditRoom(room)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDeleteRoom(room.id_room)} disabled={editLoading}>Delete</Button>
                  </CardActions>
                </Card>
              ))}
              {rooms.length === 0 && <Typography>No rooms found.</Typography>}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={editRoomOpen} onClose={handleCloseEditRoom} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Room</DialogTitle>
        <DialogContent>
          {editRoom && (
            <>
              <TextField label="Name" name="Name_room" value={editRoom.Name_room} onChange={e => setEditRoom({ ...editRoom, Name_room: e.target.value })} size="small" fullWidth sx={{ mb: 2, mt: 2 }} />
              <TextField label="Location" name="Location" value={editRoom.Location} onChange={e => setEditRoom({ ...editRoom, Location: e.target.value })} size="small" fullWidth sx={{ mb: 2 }} />
              <TextField label="Address" name="Address" value={editRoom.Address} onChange={e => setEditRoom({ ...editRoom, Address: e.target.value })} size="small" fullWidth sx={{ mb: 2 }} />
              <TextField label="Comment" name="Comment" value={editRoom.Comment} onChange={e => setEditRoom({ ...editRoom, Comment: e.target.value })} size="small" fullWidth sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <label>
                  <input type="checkbox" checked={Boolean(editRoom.InServices)} onChange={e => setEditRoom({ ...editRoom, InServices: Boolean(e.target.checked) })} /> In Services
                </label>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button onClick={handleCloseEditRoom} variant="contained" disabled={editLoading} sx={{ mr: 1 }}>Cancel</Button>
                <Button variant="contained" onClick={handleUpdateRoom} disabled={editLoading || !editRoom.Name_room || !editRoom.Address}>Save</Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Add Room Dialog */}
      <Dialog open={addRoomOpen} onClose={handleCloseAddRoom} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Room</DialogTitle>
        <DialogContent  >
          <TextField label="Name" name="Name_room" value={newRoom.Name_room} onChange={e => setNewRoom({ ...newRoom, Name_room: e.target.value })} size="small" fullWidth sx={{ mb: 2 }} />
          <TextField label="Location" name="Location" value={newRoom.Location} onChange={e => setNewRoom({ ...newRoom, Location: e.target.value })} size="small" fullWidth sx={{ mb: 2 }} />
          <TextField label="Address" name="Address" value={newRoom.Address} onChange={e => setNewRoom({ ...newRoom, Address: e.target.value })} size="small" fullWidth sx={{ mb: 2 }} />
          <TextField label="Comment" name="Comment" value={newRoom.Comment} onChange={e => setNewRoom({ ...newRoom, Comment: e.target.value })} size="small" fullWidth sx={{ mb: 2 }} />
          <Box sx={{ mb: 2 }}>
            <label>
              <input type="checkbox" checked={!!newRoom.InServices} onChange={e => setNewRoom({ ...newRoom, InServices: e.target.checked })} /> In Services
            </label>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleCloseAddRoom} disabled={addLoading} variant="contained" sx={{ mr: 1 }}>Cancel</Button>
            <Button variant="contained" onClick={handleAddRoom} disabled={addLoading || !newRoom.Name_room || !newRoom.Address}>Add</Button>
          </Box>
        </DialogContent>
      </Dialog>
      {/* Add Meeting Dialog */}
      <Dialog open={addMeetingOpen} onClose={handleCloseAddMeeting} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Meeting</DialogTitle>
        <DialogContent>
          <TextField label="Meeting Title" name="comment" value={newMeeting.comment} onChange={e => setNewMeeting({ ...newMeeting, comment: e.target.value })} size="small" fullWidth sx={{ mb: 2, mt: 2 }} error={validation.comment} helperText={validation.comment ? 'Required' : ''} />
          {newMeeting.comment === 'Equippment Not Completed' && (
            <Box sx={{ color: 'red', fontWeight: 'bold', mb: 2 }}>Warning: Equippment Not completed</Box>
          )}
          <TextField label="Date" type="date" name="date_meeting" value={newMeeting.date_meeting} onChange={e => setNewMeeting({ ...newMeeting, date_meeting: e.target.value, date_meeting_end: e.target.value })} size="small" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} error={validation.date_meeting} helperText={validation.date_meeting ? 'Required' : ''} />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField label="Start Time" type="time" name="time_meeting" value={newMeeting.time_meeting}
              onChange={e => {
                const input = e.target.value;
                if (input) {
                  let [h, m] = input.split(":");
                  let hour = (parseInt(h, 10) + 24) % 24;
                  const shifted = `${hour.toString().padStart(2, "0")}:${m}`;
                  setNewMeeting({ ...newMeeting, time_meeting: shifted });
                } else {
                  setNewMeeting({ ...newMeeting, time_meeting: "" });
                }
              }}
              size="small" fullWidth InputLabelProps={{ shrink: true }} error={validation.time_meeting} helperText={validation.time_meeting ? 'Required' : ''} />
            <TextField label="End Time" type="time" name="time_meeting_end" value={newMeeting.time_meeting_end}
              onChange={e => {
                const input = e.target.value;
                if (input) {
                  let [h, m] = input.split(":");
                  let hour = (parseInt(h, 10) + 24) % 24;
                  const shifted = `${hour.toString().padStart(2, "0")}:${m}`;
                  setNewMeeting({ ...newMeeting, time_meeting_end: shifted });
                } else {
                  setNewMeeting({ ...newMeeting, time_meeting_end: "" });
                }
              }}
              size="small" fullWidth InputLabelProps={{ shrink: true }} error={validation.time_meeting_end} helperText={validation.time_meeting_end ? 'Required' : ''} />
          </Box>
          <TextField
            select
            label="Room"
            name="id_room"
            value={newMeeting.id_room}
            onChange={e => setNewMeeting({ ...newMeeting, id_room: e.target.value })}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
            error={validation.id_room}
            helperText={validation.id_room ? 'Required' : ''}
          >
            {rooms.filter(room => !room.InServices).map(room => (
              <MenuItem key={room.id_room} value={room.id_room}>
                <Box>
                  <div>{room.Name_room}</div>
                  <div style={{ fontSize: '0.8em', color: '#888' }}><b>Location:</b> {room.Location}</div>
                  <div style={{ fontSize: '0.8em', color: '#888' }}><b>Address:</b> {room.Address}</div>
                  <div style={{ fontSize: '0.8em', color: '#888' }}><b>Comment:</b> {room.Comment}</div>
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            multiple
            freeSolo
            options={employees.map(emp => emp.NAME)}
            value={newMeeting.members_meeting}
            onChange={(_event, value) => setNewMeeting({ ...newMeeting, members_meeting: value })}
            renderTags={(value: string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option + index} />
              ))
            }
            renderInput={params => (
              <TextField {...params} label="Members" placeholder="Select employee or type external name" size="small" fullWidth sx={{ mb: 2 }} error={validation.members_meeting} helperText={validation.members_meeting ? 'Required' : ''} />
            )}
            sx={validation.members_meeting ? { '& .MuiOutlinedInput-root': { borderColor: 'red' } } : {}}
          />
          {/* Show validation errors for overlap and past date */}
          {/* Show validation errors for overlap and past date */}
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={newMeeting.Other_members_meeting}
            onChange={(_event, value) => setNewMeeting({ ...newMeeting, Other_members_meeting: value })}
            renderTags={(value: string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option + index} />
              ))
            }
            renderInput={params => (
              <TextField {...params} label="Other Members (Emails)" placeholder="Type email and press Enter" size="small" fullWidth sx={{ mb: 2 }} />
            )}
          />
          <>
            {/* Calculate and show errors for past and overlap */}
            {(() => {
              let past = false;
              if (newMeeting.date_meeting && newMeeting.time_meeting) {
                const now = new Date();
                const start = new Date(`${newMeeting.date_meeting}T${newMeeting.time_meeting}`);
                past = start < now;
              }
              return (
                <>
                  {past && (
                    <Box sx={{ color: 'red', fontWeight: 'bold', mb: 2 }}>Cannot add a meeting in the past.</Box>
                  )}
                  {validation.overlap && (
                    <Box sx={{ color: 'red', fontWeight: 'bold', mb: 2 }}>A meeting already exists in this room during the selected period.</Box>
                  )}
                </>
              );
            })()}
          </>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleCloseAddMeeting} disabled={addMeetingLoading} variant="contained" sx={{ mr: 1 }}>Cancel</Button>
            <Button variant="contained" onClick={handleAddMeeting} disabled={addMeetingLoading || !newMeeting.date_meeting || !newMeeting.time_meeting || !newMeeting.time_meeting_end || !newMeeting.id_room || !newMeeting.members_meeting}>Add</Button>
            <Button variant="contained" color="secondary" sx={{ ml: 1 }} onClick={sendToTeams} disabled={addMeetingLoading || !newMeeting.date_meeting || !newMeeting.time_meeting || !newMeeting.time_meeting_end || !newMeeting.id_room || !newMeeting.members_meeting}>Book in Teams</Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog open={editMeetingOpen} onClose={() => setEditMeetingOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Meeting</DialogTitle>
        <DialogContent>
          {editMeeting && (
            <>
              <TextField label="Meeting Title" name="comment" value={editMeeting.comment} onChange={e => setEditMeeting({ ...editMeeting, comment: e.target.value })} size="small" fullWidth sx={{ mb: 2, mt: 2 }} />
              {editMeeting.comment === 'Equippment Not Completed' && (
                <Box sx={{ color: 'red', fontWeight: 'bold', mb: 2 }}>Warning: Equippment Not completed</Box>
              )}
              <TextField label="Date" type="date" name="date_meeting" value={editMeeting.date_meeting} onChange={e => setEditMeeting({ ...editMeeting, date_meeting: e.target.value, date_meeting_end: e.target.value })} size="small" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField label="Start Time" type="time" name="time_meeting" value={editMeeting.time_meeting} onChange={e => setEditMeeting({ ...editMeeting, time_meeting: e.target.value })} size="small" fullWidth InputLabelProps={{ shrink: true }} />
                <TextField label="End Time" type="time" name="time_meeting_end" value={editMeeting.time_meeting_end} onChange={e => setEditMeeting({ ...editMeeting, time_meeting_end: e.target.value })} size="small" fullWidth InputLabelProps={{ shrink: true }} />
              </Box>
              <TextField
                select
                label="Room"
                name="id_room"
                value={editMeeting.id_room}
                onChange={e => setEditMeeting({ ...editMeeting, id_room: e.target.value })}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              >
                {rooms.map(room => (
                  <MenuItem key={room.id_room} value={room.id_room}>
                    <Box>
                      <div>{room.Name_room}</div>
                      <div style={{ fontSize: '0.8em', color: '#888' }}><b>Location:</b> {room.Location}</div>
                      <div style={{ fontSize: '0.8em', color: '#888' }}><b>Address:</b> {room.Address}</div>
                      <div style={{ fontSize: '0.8em', color: '#888' }}><b>Comment:</b> {room.Comment}</div>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
              <Autocomplete
                multiple
                freeSolo
                options={employees.map(emp => emp.NAME)}
                value={Array.isArray(editMeeting.members_meeting) ? editMeeting.members_meeting : String(editMeeting.members_meeting).split(',')}
                onChange={(_event, value) => setEditMeeting({ ...editMeeting, members_meeting: value })}
                renderTags={(value: string[], getTagProps) =>
                  value.map((option: string, index: number) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option + index} />
                  ))
                }
                renderInput={params => (
                  <TextField {...params} label="Members" placeholder="Select employee or type external name" size="small" fullWidth sx={{ mb: 2 }} />
                )}
              />
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={Array.isArray(editMeeting.Other_members_meeting) ? editMeeting.Other_members_meeting : (editMeeting.Other_members_meeting ? String(editMeeting.Other_members_meeting).split(',') : [])}
                onChange={(_event, value) => setEditMeeting({ ...editMeeting, Other_members_meeting: value })}
                renderTags={(value: string[], getTagProps) =>
                  value.map((option: string, index: number) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option + index} />
                  ))
                }
                renderInput={params => (
                  <TextField {...params} label="Other Members (Emails)" placeholder="Type email and press Enter" size="small" fullWidth sx={{ mb: 2 }} />
                )}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button onClick={() => setEditMeetingOpen(false)} variant="contained" sx={{ mr: 1 }}>Cancel</Button>
                <Button variant="contained" color="secondary" sx={{ mr: 1 }} onClick={sendEditToTeams} disabled={!editMeeting || !editMeeting.date_meeting || !editMeeting.time_meeting || !editMeeting.time_meeting_end || !editMeeting.id_room || !editMeeting.members_meeting}>Book in Teams</Button>
                <Button variant="contained" onClick={handleSaveEditedMeeting} disabled={editLoading}>Save</Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>



  );
};

export default MeetingCalendar;