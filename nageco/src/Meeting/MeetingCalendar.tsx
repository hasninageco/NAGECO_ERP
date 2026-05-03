import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { Box, Typography, Paper, Button, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent, Card, CardContent, CardActions, CircularProgress, TextField, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTheme, alpha } from '@mui/material/styles';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { useTranslation } from 'react-i18next';
import { buildApiUrl } from '../utils/api';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type MeetingCalendarSection = 'calendar' | 'reports' | 'all';

interface MeetingCalendarProps {
  section?: MeetingCalendarSection;
}

type ReportDateFilter = 'all' | 'today' | 'last_week' | 'last_month' | 'custom';

const REPORT_LOGO_URL = '/nag_logo.png';
const ARABIC_TEXT_REGEX = /[\u0600-\u06FF]/;
const EMAIL_ADDRESS_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const containsArabic = (value: string): boolean => ARABIC_TEXT_REGEX.test(value);

const isEmailAddress = (value: string): boolean => EMAIL_ADDRESS_REGEX.test(String(value || '').trim());

const dedupeCaseInsensitiveValues = (items: string[]): string[] => {
  const seen = new Set<string>();

  return items.reduce<string[]>((result, item) => {
    const normalizedItem = String(item || '').trim();
    if (!normalizedItem) {
      return result;
    }

    const key = normalizedItem.toLowerCase();
    if (seen.has(key)) {
      return result;
    }

    seen.add(key);
    result.push(normalizedItem);
    return result;
  }, []);
};

const collapseSingleCharEmailTokens = (items: string[]): string[] => {
  const normalized = items
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  // Recover emails accidentally split into single-character tokens (e.g. F,@,F,L,U).
  if (
    normalized.length > 1 &&
    normalized.includes('@') &&
    normalized.every((item) => item.length === 1)
  ) {
    return [normalized.join('')];
  }

  return normalized;
};

const parseMemberItems = (members: unknown): string[] => {
  if (Array.isArray(members)) {
    return collapseSingleCharEmailTokens(
      members.map((member) => String(member).trim()).filter(Boolean)
    );
  }

  if (typeof members === 'string') {
    return collapseSingleCharEmailTokens(
      members
        .split(/\s*,\s*|\s*،\s*/)
        .map((member) => member.trim())
        .filter(Boolean)
    );
  }

  return [];
};

const mergePendingFreeSoloValue = (members: unknown, pendingValue: string): string[] => {
  const normalizedMembers = parseMemberItems(members);
  const trimmedPendingValue = String(pendingValue || '').trim();

  if (!trimmedPendingValue) {
    return normalizedMembers;
  }

  const hasPendingValue = normalizedMembers.some(
    (member) => member.toLowerCase() === trimmedPendingValue.toLowerCase()
  );

  if (hasPendingValue) {
    return normalizedMembers;
  }

  return [...normalizedMembers, trimmedPendingValue];
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image blob.'));
    reader.readAsDataURL(blob);
  });
};

const fetchImageAsDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load image: ${url}`);
  }
  const blob = await response.blob();
  return blobToDataUrl(blob);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function getMonthDays(year: number, month: number) {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const MeetingCalendar: React.FC<MeetingCalendarProps> = ({ section = 'all' }) => {
  const showCalendar = section !== 'reports';
  const showReports = section !== 'calendar';
  const { i18n } = useTranslation();

  const isArabicUi = React.useMemo(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
    return lang.startsWith('ar');
  }, [i18n.language, i18n.resolvedLanguage]);
  
  const [employees, setEmployees] = React.useState<any[]>([]);
  const employeeEmailByName = React.useMemo(() => {
    const emailsByName = new Map<string, string>();

    employees.forEach((employee: any) => {
      const employeeName = String(employee?.NAME ?? '').trim();
      const employeeEmail = String(
        employee?.MAIL ?? employee?.mail ?? employee?.EMAIL ?? employee?.email ?? ''
      ).trim();

      if (!employeeName || !isEmailAddress(employeeEmail)) {
        return;
      }

      const normalizedName = employeeName.toLowerCase();
      if (!emailsByName.has(normalizedName)) {
        emailsByName.set(normalizedName, employeeEmail);
      }
    });

    return emailsByName;
  }, [employees]);

  const resolveSelectedMemberEmails = React.useCallback(
    (selectedMembers: string[]) => {
      const mappedEmails = selectedMembers.reduce<string[]>((result, member) => {
        const normalizedMember = String(member || '').trim();
        if (!normalizedMember) {
          return result;
        }

        if (isEmailAddress(normalizedMember)) {
          result.push(normalizedMember);
          return result;
        }

        const employeeEmail = employeeEmailByName.get(normalizedMember.toLowerCase());
        if (employeeEmail) {
          result.push(employeeEmail);
        }

        return result;
      }, []);

      return dedupeCaseInsensitiveValues(mappedEmails);
    },
    [employeeEmailByName]
  );
  // (removed unused helper add24Hours)
  const theme = useTheme();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [view, setView] = React.useState<'month' | 'year' | 'day'>('month');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [reportRoomFilter, setReportRoomFilter] = React.useState<string | null>(null);
  const [reportMemberFilters, setReportMemberFilters] = React.useState<string[]>([]);
  const [reportDateFilter, setReportDateFilter] = React.useState<ReportDateFilter>('all');
  const [reportCustomDateFrom, setReportCustomDateFrom] = React.useState('');
  const [reportCustomDateTo, setReportCustomDateTo] = React.useState('');

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
  const [newMeeting, setNewMeeting] = React.useState<{ date_meeting: string; time_meeting: string; date_meeting_end: string; time_meeting_end: string; id_room: string; members_meeting: string[]; comment: string; Notes: string; usr: string; Other_members_meeting: string[] }>(
    { date_meeting: '', time_meeting: '', date_meeting_end: '', time_meeting_end: '', id_room: '', members_meeting: [], comment: '', Notes: '', usr: '0', Other_members_meeting: [] }
  );
  const [newOtherMemberInput, setNewOtherMemberInput] = React.useState('');
  const [editOtherMemberInput, setEditOtherMemberInput] = React.useState('');
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

  const reportRows = React.useMemo(() => {
    const locale = isArabicUi ? 'ar-EG' : undefined;

    return meetings
      .map((meeting: any) => {
        const startDate = meeting.date_meeting ? new Date(meeting.date_meeting) : null;
        const endDate = meeting.date_meeting_end ? new Date(meeting.date_meeting_end) : null;
        const hasValidStartDate = Boolean(startDate && !Number.isNaN(startDate.getTime()));
        const hasValidEndDate = Boolean(endDate && !Number.isNaN(endDate.getTime()));

        const roomName =
          rooms.find((room) => String(room.id_room) === String(meeting.id_room))?.Name_room ||
          String(meeting.id_room || '');

        const membersItems = parseMemberItems(meeting.members_meeting);
        const otherMembersItems = parseMemberItems(meeting.Other_members_meeting);
        const allMemberItems = [...membersItems, ...otherMembersItems];
        const allMembers = allMemberItems.join(' | ');

        return {
          id: meeting.id_meeting ?? meeting.id ?? meeting._id ?? Math.random(),
          title: meeting.comment || 'Untitled',
          date: hasValidStartDate ? startDate!.toLocaleDateString(locale) : '',
          startTime:
            meeting.time_meeting ||
            (hasValidStartDate
              ? startDate!.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
              : ''),
          endTime:
            meeting.time_meeting_end ||
            (hasValidEndDate
              ? endDate!.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
              : ''),
          room: roomName,
          members: allMembers,
          membersList: allMemberItems,
          createdBy: meeting.usr || '',
          startTimeValue: hasValidStartDate ? startDate!.getTime() : 0,
        };
      })
      .sort((a, b) => b.startTimeValue - a.startTimeValue);
  }, [isArabicUi, meetings, rooms]);

  const reportTitle = isArabicUi
    ? 'تقرير الاجتماعات والحجوزات'
    : 'Meeting / Booking Reports';

  const reportHeaders = React.useMemo(
    () =>
      isArabicUi
        ? ['عنوان الاجتماع', 'التاريخ', 'البداية', 'النهاية', 'القاعة', 'الحضور', 'تم الإنشاء بواسطة']
        : ['Meeting Title', 'Date', 'Start', 'End', 'Room', 'Members', 'Created By'],
    [isArabicUi]
  );

  const reportRoomOptions = React.useMemo(() => {
    const roomSet = new Set<string>();
    reportRows.forEach((row) => {
      const room = String(row.room || '').trim();
      if (room) {
        roomSet.add(room);
      }
    });
    return Array.from(roomSet).sort((a, b) => a.localeCompare(b));
  }, [reportRows]);

  const reportMemberOptions = React.useMemo(() => {
    const memberSet = new Set<string>();
    reportRows.forEach((row) => {
      row.membersList.forEach((member: string) => {
        const normalizedMember = String(member || '').trim();
        if (normalizedMember) {
          memberSet.add(normalizedMember);
        }
      });
    });
    return Array.from(memberSet).sort((a, b) => a.localeCompare(b));
  }, [reportRows]);

  const filteredReportRows = React.useMemo(() => {
    const normalizedMemberFilters = reportMemberFilters
      .map((member) => String(member || '').trim().toLowerCase())
      .filter(Boolean);

    const now = new Date();
    const nowTime = now.getTime();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfLastWeek = new Date(now);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(now);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    startOfLastMonth.setHours(0, 0, 0, 0);

    const customFromTime = reportCustomDateFrom
      ? (() => {
        const date = new Date(reportCustomDateFrom);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })()
      : null;

    const customToTime = reportCustomDateTo
      ? (() => {
        const date = new Date(reportCustomDateTo);
        date.setHours(23, 59, 59, 999);
        return date.getTime();
      })()
      : null;

    return reportRows.filter((row) => {
      const matchesRoom = !reportRoomFilter || row.room === reportRoomFilter;

      const normalizedRowMembers = row.membersList
        .map((member: string) => String(member || '').trim().toLowerCase())
        .filter(Boolean);

      const matchesMembers = normalizedMemberFilters.length === 0
        ? true
        : normalizedMemberFilters.every((memberFilter) =>
          normalizedRowMembers.some((member) => member.includes(memberFilter))
        );

      const rowStartTime = Number(row.startTimeValue);
      const hasValidRowStart = Number.isFinite(rowStartTime) && rowStartTime > 0;

      const matchesDate = (() => {
        if (reportDateFilter === 'all') {
          return true;
        }

        if (!hasValidRowStart) {
          return false;
        }

        if (reportDateFilter === 'today') {
          return rowStartTime >= startOfToday.getTime() && rowStartTime <= endOfToday.getTime();
        }

        if (reportDateFilter === 'last_week') {
          return rowStartTime >= startOfLastWeek.getTime() && rowStartTime <= nowTime;
        }

        if (reportDateFilter === 'last_month') {
          return rowStartTime >= startOfLastMonth.getTime() && rowStartTime <= nowTime;
        }

        if (reportDateFilter === 'custom') {
          if (customFromTime === null && customToTime === null) {
            return true;
          }

          if (customFromTime !== null && rowStartTime < customFromTime) {
            return false;
          }

          if (customToTime !== null && rowStartTime > customToTime) {
            return false;
          }

          return true;
        }

        return true;
      })();

      return matchesRoom && matchesMembers && matchesDate;
    });
  }, [reportCustomDateFrom, reportCustomDateTo, reportDateFilter, reportMemberFilters, reportRoomFilter, reportRows]);

  const formatGeneratedAt = (): string => {
    if (isArabicUi) {
      const formatted = new Intl.DateTimeFormat('ar-EG', {
        dateStyle: 'short',
        timeStyle: 'medium',
      }).format(new Date());
      return `تاريخ الإنشاء: ${formatted}`;
    }

    return `Generated on: ${new Date().toLocaleString()}`;
  };

  const handleExportExcel = async () => {
    if (filteredReportRows.length === 0) {
      alert('No meeting records available to export.');
      return;
    }

    try {
      let logoDataUrl = '';
      try {
        logoDataUrl = await fetchImageAsDataUrl(REPORT_LOGO_URL);
      } catch {
        logoDataUrl = '';
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'NAGECO';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('MeetingReports', {
        views: [{ state: 'frozen', ySplit: 5, rightToLeft: isArabicUi }],
      });

      if (logoDataUrl) {
        const logoImageId = workbook.addImage({
          base64: logoDataUrl,
          extension: 'png',
        });

        worksheet.addImage(logoImageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 180, height: 70 },
        });
      }

      worksheet.mergeCells('C1:G1');
      worksheet.getCell('C1').value = reportTitle;
      worksheet.getCell('C1').font = { size: 14, bold: true };
      worksheet.getCell('C1').alignment = {
        horizontal: isArabicUi ? 'right' : 'left',
        vertical: 'middle',
      };

      worksheet.mergeCells('C2:G2');
      worksheet.getCell('C2').value = formatGeneratedAt();
      worksheet.getCell('C2').font = { size: 10, color: { argb: 'FF666666' } };
      worksheet.getCell('C2').alignment = {
        horizontal: isArabicUi ? 'right' : 'left',
        vertical: 'middle',
      };

      const headers = reportHeaders;

      const headerRow = worksheet.getRow(5);
      headerRow.values = headers;
      headerRow.height = 24;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2962FF' },
        };
        cell.alignment = {
          horizontal: isArabicUi ? 'right' : 'center',
          vertical: 'middle',
          wrapText: true,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
          right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        };
      });

      filteredReportRows.forEach((row, index) => {
        const excelRow = worksheet.getRow(6 + index);
        const rowValues = [
          row.title || '-',
          row.date || '-',
          row.startTime || '-',
          row.endTime || '-',
          row.room || '-',
          (Array.isArray(row.membersList) && row.membersList.length > 0) ? row.membersList.join('\n') : (row.members || '-'),
          row.createdBy || '-',
        ];

        excelRow.values = rowValues;
        excelRow.height = 22;
        excelRow.eachCell((cell, colNumber) => {
          const cellValue = String(rowValues[colNumber - 1] || '');
          const cellHasArabic = containsArabic(cellValue);
          cell.alignment = {
            horizontal: cellHasArabic ? 'right' : 'left',
            vertical: 'top',
            wrapText: true,
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE6E6E6' } },
            left: { style: 'thin', color: { argb: 'FFE6E6E6' } },
            bottom: { style: 'thin', color: { argb: 'FFE6E6E6' } },
            right: { style: 'thin', color: { argb: 'FFE6E6E6' } },
          };
        });
      });

      worksheet.columns = [
        { width: 30 },
        { width: 16 },
        { width: 12 },
        { width: 12 },
        { width: 22 },
        { width: 55 },
        { width: 22 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob(
        [buffer],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      const dateStamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `meeting-reports-${dateStamp}.xlsx`);
    } catch (error) {
      alert('Failed to export Excel report.');
    }
  };

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
      Notes: '',
      usr: '0',
      Other_members_meeting: []
    });
    setNewOtherMemberInput('');
  };
  const handleCloseAddMeeting = () => {
    setAddMeetingOpen(false);
    setNewOtherMemberInput('');
  };
  
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

      const normalizedOtherMembersMeeting = mergePendingFreeSoloValue(
        editMeeting.Other_members_meeting,
        editOtherMemberInput
      );
      const resolvedMemberEmails = resolveSelectedMemberEmails(
        parseMemberItems(editMeeting.members_meeting)
      );
      const serializedOtherMembersMeeting = normalizedOtherMembersMeeting.join(',');

      const meetingToSend: any = {
        ...editMeeting,
        date_meeting: fullDateTime || editMeeting.date_meeting,
        date_meeting_end: fullDateTimeEnd || editMeeting.date_meeting_end,
        Other_members_meeting: serializedOtherMembersMeeting,
        other_members_meeting: serializedOtherMembersMeeting,
        members_emails: resolvedMemberEmails.join(',')
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
      setEditOtherMemberInput('');
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

      const normalizedOtherMembersMeeting = mergePendingFreeSoloValue(
        newMeeting.Other_members_meeting,
        newOtherMemberInput
      );
      const resolvedMemberEmails = resolveSelectedMemberEmails(newMeeting.members_meeting);

      const { time_meeting, time_meeting_end, ...meetingToSend } = {
        ...newMeeting,
        date_meeting: fullDateTime,
        date_meeting_end: fullDateTimeEnd,
        creation_date: formatDateForSQLServer(new Date()),
        Other_members_meeting: normalizedOtherMembersMeeting.join(','),
        other_members_meeting: normalizedOtherMembersMeeting.join(','),
        members_emails: resolvedMemberEmails.join(',')
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
      setNewMeeting({ date_meeting: '', time_meeting: '', date_meeting_end: '', time_meeting_end: '', id_room: '', members_meeting: [], comment: '', Notes: '', usr: '0', Other_members_meeting: [] });
      setNewOtherMemberInput('');
    } catch (err) {
      alert('Error adding meeting. Check required fields and backend logs.');
    }
    setAddMeetingLoading(false);
  };

  return (





    <Box sx={{ width: '100%', p: 2 }}>
      {showCalendar && (
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
  )}
  {showCalendar && (
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
                                      {parseMemberItems(meeting.members_meeting).map((m: string, i: number) => (
                                        <li key={i}>{m}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div><b>Start:</b> {meeting.time_meeting || (meeting.date_meeting ? new Date(meeting.date_meeting).toISOString().slice(11, 16) : '')}</div>
                                  <div><b>End:</b> {meeting.time_meeting_end || (meeting.date_meeting_end ? new Date(meeting.date_meeting_end).toISOString().slice(11, 16) : '')}</div>
                                  {meeting.Notes && <div><b>Notes:</b> {meeting.Notes}</div>}

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
                                      setEditOtherMemberInput('');
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
      )}

      {showReports && (
      <Paper sx={{ mt: 2, p: 2, boxShadow: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            mb: 2,
          }}
        >
          <Typography variant="h6">{reportTitle}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={handleExportExcel} disabled={filteredReportRows.length === 0}>
              {isArabicUi ? 'تصدير Excel' : 'Export to Excel'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <TextField
            select
            value={reportDateFilter}
            onChange={(event) => setReportDateFilter(event.target.value as ReportDateFilter)}
            label={isArabicUi ? 'تصفية حسب التاريخ' : 'Filter by Date'}
            size="small"
            sx={{ minWidth: 200, flex: '1 1 200px' }}
          >
            <MenuItem value="all">{isArabicUi ? 'كل التواريخ' : 'All Dates'}</MenuItem>
            <MenuItem value="today">{isArabicUi ? 'اليوم' : 'Today'}</MenuItem>
            <MenuItem value="last_week">{isArabicUi ? 'آخر أسبوع' : 'Last Week'}</MenuItem>
            <MenuItem value="last_month">{isArabicUi ? 'آخر شهر' : 'Last Month'}</MenuItem>
            <MenuItem value="custom">{isArabicUi ? 'تاريخ مخصص' : 'Custom Date'}</MenuItem>
          </TextField>
          {reportDateFilter === 'custom' && (
            <>
              <TextField
                type="date"
                label={isArabicUi ? 'من تاريخ' : 'From Date'}
                value={reportCustomDateFrom}
                onChange={(event) => setReportCustomDateFrom(event.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 170, flex: '1 1 170px' }}
              />
              <TextField
                type="date"
                label={isArabicUi ? 'إلى تاريخ' : 'To Date'}
                value={reportCustomDateTo}
                onChange={(event) => setReportCustomDateTo(event.target.value)}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 170, flex: '1 1 170px' }}
              />
            </>
          )}
          <Autocomplete
            options={reportRoomOptions}
            value={reportRoomFilter}
            onChange={(_event, value) => setReportRoomFilter(value)}
            sx={{ minWidth: 220, flex: '1 1 220px' }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={isArabicUi ? 'تصفية حسب القاعة' : 'Filter by Room'}
                size="small"
              />
            )}
          />
          <Autocomplete
            multiple
            freeSolo
            options={reportMemberOptions}
            value={reportMemberFilters}
            onChange={(_event, value) => setReportMemberFilters(value)}
            sx={{ minWidth: 280, flex: '2 1 280px' }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={isArabicUi ? 'تصفية حسب الأعضاء' : 'Filter by Members'}
                placeholder={isArabicUi ? 'اختر أو اكتب اسما' : 'Select or type a member'}
                size="small"
              />
            )}
          />
          <Button
            variant="text"
            onClick={() => {
              setReportRoomFilter(null);
              setReportMemberFilters([]);
              setReportDateFilter('all');
              setReportCustomDateFrom('');
              setReportCustomDateTo('');
            }}
            disabled={
              !reportRoomFilter &&
              reportMemberFilters.length === 0 &&
              reportDateFilter === 'all' &&
              !reportCustomDateFrom &&
              !reportCustomDateTo
            }
          >
            {isArabicUi ? 'مسح التصفية' : 'Clear Filters'}
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {isArabicUi
            ? `عرض ${filteredReportRows.length} من ${reportRows.length}`
            : `Showing ${filteredReportRows.length} of ${reportRows.length}`}
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 320 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {reportHeaders.map((header) => (
                  <TableCell key={header} align={isArabicUi ? 'right' : 'left'}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReportRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {reportRows.length === 0
                      ? (isArabicUi ? 'لا توجد اجتماعات متاحة.' : 'No meetings available.')
                      : (isArabicUi ? 'لا توجد اجتماعات مطابقة للتصفية.' : 'No meetings match the selected filters.')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredReportRows.map((row, idx) => (
                  <TableRow key={`${row.id}-${idx}`} hover>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.startTime}</TableCell>
                    <TableCell>{row.endTime}</TableCell>
                    <TableCell>{row.room}</TableCell>
                    <TableCell sx={{ minWidth: 260 }}>{row.members}</TableCell>
                    <TableCell>{row.createdBy}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      )}

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
          <TextField label="Notes" name="Notes" value={newMeeting.Notes} onChange={e => setNewMeeting({ ...newMeeting, Notes: e.target.value })} size="small" fullWidth multiline minRows={2} sx={{ mb: 2 }} />
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
            inputValue={newOtherMemberInput}
            onInputChange={(_event, value) => setNewOtherMemberInput(value)}
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
              <TextField label="Notes" name="Notes" value={editMeeting.Notes || ''} onChange={e => setEditMeeting({ ...editMeeting, Notes: e.target.value })} size="small" fullWidth multiline minRows={2} sx={{ mb: 2 }} />
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
                value={parseMemberItems(editMeeting.members_meeting)}
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
                value={parseMemberItems(editMeeting.Other_members_meeting)}
                inputValue={editOtherMemberInput}
                onInputChange={(_event, value) => setEditOtherMemberInput(value)}
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