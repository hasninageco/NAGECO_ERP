const MeetingSchedule = require('../../models/Meeting/MeetingSchedule');
const MeetingRoom = require('../../models/Meeting/MeetingRoom');
const Employee = require('../../models/hr/employee');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

const SMTP_HOST = process.env.MEETING_SMTP_HOST || 'mail.nageco.com';
const SMTP_PORT = Number(process.env.MEETING_SMTP_PORT || 587);
const SMTP_USER = process.env.MEETING_SMTP_USER || 'system.info@nageco.com';
const SMTP_PASS = process.env.MEETING_SMTP_PASS || 'NAGECO101.INFO';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

// Keep Arabic content ASCII-safe to avoid accidental `????` corruption from file encoding.
const ARABIC_HSE_POINTS = [
  '\u0627\u062a\u0628\u0627\u0639\u0020\u062a\u0639\u0644\u064a\u0645\u0627\u062a\u0020\u0627\u0644\u0645\u0633\u062a\u0636\u064a\u0641\u0020\u0641\u064a\u0020\u062c\u0645\u064a\u0639\u0020\u0627\u0644\u0623\u0648\u0642\u0627\u062a',
  '\u0627\u0644\u0627\u0644\u062a\u0632\u0627\u0645\u0020\u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645\u0020\u0645\u0639\u062f\u0627\u062a\u0020\u0627\u0644\u0648\u0642\u0627\u064a\u0629\u0020\u0627\u0644\u0634\u062e\u0635\u064a\u0629\u0020\u0639\u0646\u062f\u0020\u0627\u0644\u0637\u0644\u0628',
  '\u0639\u062f\u0645\u0020\u0627\u0644\u062a\u062c\u0648\u0644\u0020\u0623\u0648\u0020\u062f\u062e\u0648\u0644\u0020\u0623\u064a\u0020\u0645\u0648\u0627\u0642\u0639\u0020\u0623\u0648\u0020\u0645\u0646\u0627\u0637\u0642\u0020\u063a\u064a\u0631\u0020\u0645\u0635\u0631\u062d\u0020\u0628\u0647\u0627',
  '\u0627\u0644\u0625\u0628\u0644\u0627\u063a\u0020\u0641\u0648\u0631\u0627\u064b\u0020\u0639\u0646\u0020\u0623\u064a\u0020\u062d\u0627\u0644\u0629\u0020\u063a\u064a\u0631\u0020\u0622\u0645\u0646\u0629\u0020\u0623\u0648\u0020\u0637\u0627\u0631\u0626\u0629'
];

const ARABIC_LABEL = '\u0627\u0644\u0639\u0631\u0628\u064a\u0629';
const ARABIC_SECTION_LABEL = '\u0627\u0644\u0646\u0633\u062e\u0629\u0020\u0627\u0644\u0639\u0631\u0628\u064a\u0629';

const ENGLISH_HSE_POINTS = [
  'Follow the instructions of their host at all times',
  'Wear Personal Protective Equipment (PPE) when required',
  'Avoid entering any restricted or unauthorized areas',
  'Immediately report any unsafe condition or emergency to their host'
];

const CREATED_UPDATED_BY_LABEL = 'Created / Updated By';
const ARABIC_CREATED_UPDATED_BY_LABEL = '\u062a\u0645\u0020\u0627\u0644\u0625\u0646\u0634\u0627\u0621\u0020\u002f\u0020\u0627\u0644\u062a\u062d\u062f\u064a\u062b\u0020\u0628\u0648\u0627\u0633\u0637\u0629';
const ENGLISH_CONFIRM_ATTENDANCE_PREFIX = 'Please confirm your attendance by replying to the email';
const ARABIC_CONFIRM_ATTENDANCE_PREFIX = '\u064a\u0631\u062c\u0649\u0020\u062a\u0623\u0643\u064a\u062f\u0020\u062d\u0636\u0648\u0631\u0643\u0645\u0020\u0628\u0627\u0644\u0631\u062f\u0020\u0639\u0644\u0649\u0020\u0627\u0644\u0628\u0631\u064a\u062f\u0020\u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a';

const buildEnglishConfirmAttendanceText = (emailContact = '-') => (
  `${ENGLISH_CONFIRM_ATTENDANCE_PREFIX} ${emailContact}.`
);

const buildArabicConfirmAttendanceText = (emailContact = '-') => (
  `${ARABIC_CONFIRM_ATTENDANCE_PREFIX} ${emailContact}.`
);

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const toHtmlEntities = (value = '') => Array.from(String(value)).map((char) => {
  const codePoint = char.codePointAt(0);
  if (!codePoint) {
    return '';
  }
  return codePoint > 127 ? `&#${codePoint};` : char;
}).join('');

const asciiSafeHtml = (value = '') => toHtmlEntities(escapeHtml(value));

const dedupeCaseInsensitive = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const normalized = String(item || '').trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
};

const isEmail = (value) => EMAIL_PATTERN.test(String(value || '').trim());

const parseDateValue = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  const dateCandidate = normalized.includes('T') ? normalized : normalized.replace(' ', 'T');
  const parsed = new Date(dateCandidate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value, locale) => {
  const parsed = parseDateValue(value);
  if (!parsed) {
    return String(value || '-');
  }

  return parsed.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const resolveMembersEmails = async (membersMeeting) => {
  const memberItems = parseMemberItems(membersMeeting);
  const directEmails = memberItems.filter(isEmail);

  const namesToResolve = dedupeCaseInsensitive(
    memberItems
      .filter((item) => !isEmail(item))
      .map((item) => item.trim())
  );

  if (!namesToResolve.length) {
    return dedupeCaseInsensitive(directEmails);
  }

  const employees = await Employee.findAll({
    attributes: ['NAME', 'MAIL'],
    where: {
      NAME: {
        [Op.in]: namesToResolve
      }
    }
  });

  const employeeEmails = employees
    .map((employee) => String(employee.MAIL || '').trim())
    .filter(isEmail);

  return dedupeCaseInsensitive([...directEmails, ...employeeEmails]);
};

const resolveCreatedByReplyToEmail = async (meeting = {}) => {
  const directCandidates = [
    meeting.usr_email,
    meeting.usrEmail,
    meeting.created_by_email,
    meeting.createdByEmail,
    meeting.usr
  ];

  const directReplyTo = directCandidates
    .map((value) => String(value || '').trim())
    .find((value) => isEmail(value));

  if (directReplyTo) {
    return directReplyTo;
  }

  const createdByName = String(meeting.usr || '').trim();
  if (!createdByName) {
    return null;
  }

  try {
    const employee = await Employee.findOne({
      attributes: ['MAIL'],
      where: {
        NAME: createdByName
      }
    });

    const employeeEmail = String(employee?.MAIL || '').trim();
    return isEmail(employeeEmail) ? employeeEmail : null;
  } catch {
    return null;
  }
};

const buildMeetingEmailHtml = ({ meeting, room, actionLabel, replyToAddress }) => {
  const roomName = room?.Name_room || String(meeting.id_room || '-');
  const roomLocation = room?.Location || '-';
  const roomAddress = room?.Address || '-';
  const meetingTitle = meeting.comment || 'Meeting Notification';
  const meetingNotes = meeting.Notes || '-';
  const createdBy = meeting.usr || '-';
  const createdByReplyContact = String(replyToAddress || (isEmail(createdBy) ? createdBy : '-')).trim() || '-';
  const startDateEn = formatDateTime(meeting.date_meeting, 'en-GB');
  const endDateEn = formatDateTime(meeting.date_meeting_end, 'en-GB');
  const startDateAr = formatDateTime(meeting.date_meeting, 'ar-LY');
  const endDateAr = formatDateTime(meeting.date_meeting_end, 'ar-LY');

  const arabicIntroLine1 = '\u0627\u0644\u0633\u0627\u062f\u0629\u0020\u002f\u0020\u0627\u0644\u0632\u0648\u0627\u0631\u0020\u0627\u0644\u0643\u0631\u0627\u0645\u060c';
  const arabicIntroLine2 = '\u062a\u062d\u064a\u0629\u0020\u0637\u064a\u0628\u0629\u0020\u0648\u0628\u0639\u062f\u060c';
  const arabicIntroLine3 = '\u064a\u0633\u0631\u0651\u0020\u0634\u0631\u0643\u0629\u0020\u004e\u0041\u0047\u0045\u0043\u004f\u0020\u2013\u0020\u004e\u006f\u0072\u0074\u0068\u0020\u0041\u0066\u0072\u0069\u0063\u0061\u0020\u0047\u0065\u006f\u0070\u0068\u0079\u0073\u0069\u0063\u0061\u006c\u0020\u0043\u006f\u006d\u0070\u0061\u006e\u0079\u0020\u0623\u0646\u0020\u062a\u0631\u062d\u0628\u0020\u0628\u0643\u0645\u060c\u0020\u0648\u0646\u062a\u0645\u0646\u0649\u0020\u0644\u0643\u0645\u0020\u0632\u064a\u0627\u0631\u0629\u0020\u0645\u0648\u0641\u0642\u0629\u0020\u0648\u0622\u0645\u0646\u0629\u002e';
  const arabicIntroLine4 = '\u0646\u0648\u062f\u0020\u0625\u062d\u0627\u0637\u062a\u0643\u0645\u0020\u0639\u0644\u0645\u0627\u064b\u0020\u0628\u0623\u0646\u0020\u0627\u0644\u0634\u062e\u0635\u0020\u0627\u0644\u0645\u0633\u062a\u0636\u064a\u0641\u0020\u0644\u0632\u064a\u0627\u0631\u062a\u0643\u0645\u0020\u0647\u0648\u0020\u0627\u0644\u0645\u0633\u0624\u0648\u0644\u0020\u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0020\u0639\u0646\u0020\u0633\u0644\u0627\u0645\u062a\u0643\u0645\u0020\u0623\u062b\u0646\u0627\u0621\u0020\u062a\u0648\u0627\u062c\u062f\u0643\u0645\u0020\u062f\u0627\u062e\u0644\u0020\u0645\u0648\u0627\u0642\u0639\u0020\u0648\u0645\u0646\u0634\u0622\u062a\u0020\u0627\u0644\u0634\u0631\u0643\u0629\u002e\u0020\u0648\u0639\u0644\u064a\u0647\u060c\u0020\u064a\u064f\u0631\u062c\u0649\u0020\u0627\u0644\u0627\u0644\u062a\u0632\u0627\u0645\u0020\u0627\u0644\u062a\u0627\u0645\u0020\u0628\u062c\u0645\u064a\u0639\u0020\u062a\u0639\u0644\u064a\u0645\u0627\u062a\u0020\u0648\u0642\u0648\u0627\u0639\u062f\u0020\u0627\u0644\u0635\u062d\u0629\u0020\u0648\u0627\u0644\u0633\u0644\u0627\u0645\u0629\u0020\u0648\u0627\u0644\u0628\u064a\u0626\u0629\u0020\u0028\u0048\u0053\u0045\u0029\u0020\u0627\u0644\u0645\u0639\u0645\u0648\u0644\u0020\u0628\u0647\u0627\u0020\u0641\u064a\u0020\u0627\u0644\u0634\u0631\u0643\u0629\u002e';
  const arabicIntroLine5 = '\u064a\u0631\u062c\u0649\u0020\u0645\u0646\u0643\u0645\u003a';
  const arabicIntroLine6 = '\u0625\u0646\u0020\u0627\u0644\u0627\u0644\u062a\u0632\u0627\u0645\u0020\u0628\u062a\u0639\u0644\u064a\u0645\u0627\u062a\u0020\u0627\u0644\u0633\u0644\u0627\u0645\u0629\u0020\u0647\u0648\u0020\u0645\u0633\u0624\u0648\u0644\u064a\u0629\u0020\u0645\u0634\u062a\u0631\u0643\u0629\u060c\u0020\u0648\u0647\u062f\u0641\u0646\u0627\u0020\u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0020\u0647\u0648\u0020\u0636\u0645\u0627\u0646\u0020\u0633\u0644\u0627\u0645\u062a\u0643\u0645\u0020\u0648\u0633\u0644\u0627\u0645\u0629\u0020\u062c\u0645\u064a\u0639\u0020\u0627\u0644\u0639\u0627\u0645\u0644\u064a\u0646\u0020\u0648\u0627\u0644\u0632\u0648\u0627\u0631\u002e';
  const arabicIntroLine7 = '\u0646\u0634\u0643\u0631\u0020\u0644\u0643\u0645\u0020\u062a\u0639\u0627\u0648\u0646\u0643\u0645\u060c\u0020\u0648\u0646\u062a\u0645\u0646\u0649\u0020\u0644\u0643\u0645\u0020\u0632\u064a\u0627\u0631\u0629\u0020\u0622\u0645\u0646\u0629\u0020\u0648\u0645\u062b\u0645\u0631\u0629\u002e';
  const arabicMeetingTimeLabel = '\u0648\u0642\u062a\u0020\u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639';

  return `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
    </head>
    <body style="margin:0;padding:0;">
    <div style="font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#f5f7fb;padding:24px;color:#1f2937;line-height:1.6;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(120deg,#0f766e,#155e75);padding:18px 22px;color:#ffffff;">
          <div style="font-size:20px;font-weight:700;">NAGECO Meeting Notification</div>
          <div style="font-size:13px;opacity:0.95;">Status: ${asciiSafeHtml(actionLabel)}</div>
        </div>

        <div style="padding:20px 22px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:7px 0;color:#6b7280;width:190px;">Meeting Title</td>
              <td style="padding:7px 0;font-weight:600;">${asciiSafeHtml(meetingTitle)}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#6b7280;">Start</td>
              <td style="padding:7px 0;">${asciiSafeHtml(startDateEn)}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#6b7280;">End</td>
              <td style="padding:7px 0;">${asciiSafeHtml(endDateEn)}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#6b7280;">Room</td>
              <td style="padding:7px 0;">${asciiSafeHtml(roomName)}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#6b7280;">Location</td>
              <td style="padding:7px 0;">${asciiSafeHtml(roomLocation)}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#6b7280;">Address</td>
              <td style="padding:7px 0;">${asciiSafeHtml(roomAddress)}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#6b7280;">Notes</td>
              <td style="padding:7px 0;">${asciiSafeHtml(meetingNotes)}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#6b7280;">${escapeHtml(CREATED_UPDATED_BY_LABEL)}</td>
              <td style="padding:7px 0;">${asciiSafeHtml(createdBy)}</td>
            </tr>
          </table>

          <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;">
            <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:#1d4ed8;color:#ffffff;font-size:12px;font-weight:600;">English</span>
            <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:#0f766e;color:#ffffff;font-size:12px;font-weight:600;">${toHtmlEntities(ARABIC_LABEL)}</span>
          </div>

          <div style="margin-top:12px;padding:14px;border:1px solid #dbeafe;border-radius:10px;background:#f8fafc;">
             
            <p style="margin:0 0 8px 0;font-weight:700;">Dear Valued Visitor,</p>
            <p style="margin:0 0 8px 0;">On behalf of NAGECO – North Africa Geophysical Company, we are pleased to welcome you and wish you a safe and successful visit.</p>
            <p style="margin:0 0 8px 0;">Please be advised that your host is responsible for your safety while you are on company premises or project sites. All visitors are therefore required to fully comply with the company&rsquo;s Health, Safety, and Environment (HSE) rules and instructions at all times.</p>
            <p style="margin:0 0 6px 0;">Visitors are kindly requested to:</p>
            <ul style="margin:0 0 10px 18px;padding:0;">
              ${ENGLISH_HSE_POINTS.map((point) => `<li style="margin:4px 0;">${escapeHtml(point)}</li>`).join('')}
            </ul>
            <p style="margin:0;">Safety is a shared responsibility, and your cooperation is essential to ensure a safe environment for everyone.</p>
            <p style="margin:8px 0 0 0;">Thank you for your understanding and cooperation. We wish you a safe and productive visit.</p>
            <p style="margin:8px 0 0 0;font-weight:600;color:#0f172a;">${escapeHtml(buildEnglishConfirmAttendanceText(createdByReplyContact))}</p>
            <p style="margin:8px 0 0 0;">Kind regards,<br />HSE Department</p>
          </div>

          <div dir="rtl" style="margin-top:12px;padding:14px;border:1px solid #dbeafe;border-radius:10px;background:#f8fafc;text-align:right;unicode-bidi:plaintext;direction:rtl;">
           
            <p style="margin:0 0 8px 0;font-weight:700;">${toHtmlEntities(arabicIntroLine1)}</p>
            <p style="margin:0 0 8px 0;">${toHtmlEntities(arabicIntroLine2)}</p>
            <p style="margin:0 0 8px 0;">${toHtmlEntities(arabicIntroLine3)}</p>
            <p style="margin:0 0 8px 0;">${toHtmlEntities(arabicIntroLine4)}</p>
            <p style="margin:0 0 6px 0;">${toHtmlEntities(arabicIntroLine5)}</p>
            <ul style="margin:0 0 10px 18px;padding:0;">
              ${ARABIC_HSE_POINTS.map((point) => `<li style="margin:4px 0;">${toHtmlEntities(point)}</li>`).join('')}
            </ul>
            <p style="margin:0;">${toHtmlEntities(arabicIntroLine6)}</p>
            <p style="margin:8px 0 0 0;">${toHtmlEntities(arabicIntroLine7)}</p>
             <p style="margin:8px 0 0 0;font-weight:700;">${asciiSafeHtml(buildArabicConfirmAttendanceText(createdByReplyContact))}</p>
            <p style="margin:8px 0 0 0;color:#475569;">${toHtmlEntities(arabicMeetingTimeLabel)}: ${asciiSafeHtml(startDateAr)} - ${asciiSafeHtml(endDateAr)}</p>
          </div>
        </div>
      </div>
    </div>
    </body>
    </html>
  `;
};

const buildMeetingEmailText = ({ meeting, room, actionLabel, replyToAddress }) => {
  const roomName = room?.Name_room || String(meeting.id_room || '-');
  const roomLocation = room?.Location || '-';
  const roomAddress = room?.Address || '-';
  const createdBy = meeting.usr || '-';
  const createdByReplyContact = String(replyToAddress || (isEmail(createdBy) ? createdBy : '-')).trim() || '-';

  return [
    'NAGECO Meeting Notification',
    `Status: ${actionLabel}`,
    `Meeting Title: ${meeting.comment || '-'}`,
    `Start: ${formatDateTime(meeting.date_meeting, 'en-GB')}`,
    `End: ${formatDateTime(meeting.date_meeting_end, 'en-GB')}`,
    `Room: ${roomName}`,
    `Location: ${roomLocation}`,
    `Address: ${roomAddress}`,
    `Notes: ${meeting.Notes || '-'}`,
    `${CREATED_UPDATED_BY_LABEL}: ${createdBy}`,
    `${ARABIC_CREATED_UPDATED_BY_LABEL}: ${createdBy}`,
    '',
    'Dear Valued Visitor,',
    'On behalf of NAGECO - North Africa Geophysical Company, we are pleased to welcome you and wish you a safe and successful visit.',
    'Please be advised that your host is responsible for your safety while you are on company premises or project sites. All visitors are therefore required to fully comply with the company\'s Health, Safety, and Environment (HSE) rules and instructions at all times.',
    'Visitors are kindly requested to:',
    ...ENGLISH_HSE_POINTS.map((point) => `- ${point}`),
    'Safety is a shared responsibility, and your cooperation is essential to ensure a safe environment for everyone.',
    'Thank you for your understanding and cooperation. We wish you a safe and productive visit.',
    buildEnglishConfirmAttendanceText(createdByReplyContact),
    buildArabicConfirmAttendanceText(createdByReplyContact),
    'Kind regards,',
    'HSE Department',
    '',
    'Arabic version is available in the HTML section of this email.'
  ].join('\n');
};

const sendMeetingNotificationEmail = async ({ meetingRecord, actionLabel, additionalRecipients = [] }) => {
  const meeting = typeof meetingRecord?.toJSON === 'function'
    ? meetingRecord.toJSON()
    : meetingRecord;

  if (!meeting) {
    return;
  }

  const [membersEmails, room, replyToAddress] = await Promise.all([
    resolveMembersEmails(meeting.members_meeting),
    meeting.id_room ? MeetingRoom.findByPk(meeting.id_room) : Promise.resolve(null),
    resolveCreatedByReplyToEmail(meeting)
  ]);

  const directRecipients = parseMemberItems(additionalRecipients).filter(isEmail);
  const otherMembersEmails = parseMemberItems(meeting.Other_members_meeting).filter(isEmail);
  const recipients = dedupeCaseInsensitive([...membersEmails, ...otherMembersEmails, ...directRecipients]);

  if (!recipients.length) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
    requireTLS: true,
    tls: {
      minVersion: 'TLSv1.2'
    }
  });

  const subject = `[NAGECO] Meeting ${actionLabel}: ${meeting.comment || 'Notification'}`;

  await transporter.sendMail({
    from: `NAGECO Meeting System <${SMTP_USER}>`,
    ...(replyToAddress ? { replyTo: replyToAddress } : {}),
    to: recipients.join(','),
    subject,
    textEncoding: 'base64',
    headers: {
      'Content-Language': 'en, ar'
    },
    html: buildMeetingEmailHtml({ meeting, room, actionLabel, replyToAddress }),
    text: buildMeetingEmailText({ meeting, room, actionLabel, replyToAddress })
  });
};

const collapseSingleCharEmailTokens = (items) => {
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

const parseMemberItems = (members) => {
  if (Array.isArray(members)) {
    return collapseSingleCharEmailTokens(
      members
        .map((member) => String(member).trim())
        .filter(Boolean)
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

  if (members === null || members === undefined) {
    return [];
  }

  const normalized = String(members).trim();
  return normalized ? [normalized] : [];
};

const serializeMemberItems = (members) => {
  const normalizedMembers = parseMemberItems(members);
  return normalizedMembers.length ? normalizedMembers.join(',') : null;
};

const readOtherMembersMeeting = (payload = {}) => (
  payload.Other_members_meeting ?? payload.other_members_meeting ?? payload.otherMembersMeeting
);

const readMembersMeeting = (payload = {}) => (
  payload.members_meeting ?? payload.membersMeeting
);

const readMembersEmails = (payload = {}) => (
  payload.members_emails ?? payload.membersEmails
);

module.exports = {
  getEmployees: async (req, res) => {
    try {
      const employees = await Employee.findAll();
      res.json(employees);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  getAll: async (req, res) => {
    try {
      const meetings = await MeetingSchedule.findAll();
      res.json(meetings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  getById: async (req, res) => {
    try {
      const meeting = await MeetingSchedule.findByPk(req.params.id);
      if (!meeting) return res.status(404).json({ error: 'Not found' });
      res.json(meeting);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const serializedMembersMeeting = serializeMemberItems(readMembersMeeting(req.body));
      const serializedOtherMembersMeeting = serializeMemberItems(readOtherMembersMeeting(req.body));
      const serializedMembersEmails = serializeMemberItems(readMembersEmails(req.body));
      // Use user-provided values, add validation for empty date_meeting
      const meetingData = {
        date_meeting: req.body.date_meeting && req.body.date_meeting.trim() !== '' ? req.body.date_meeting : null,
        date_meeting_end: req.body.date_meeting_end && req.body.date_meeting_end.trim() !== '' ? req.body.date_meeting_end : null,
        id_room: req.body.id_room,
        members_meeting: serializedMembersMeeting,
        Other_members_meeting: serializedOtherMembersMeeting,
        comment: req.body.comment,
        Notes: req.body.Notes ?? req.body.notes ?? null,
        creation_date: req.body.creation_date && req.body.creation_date.trim() !== '' ? req.body.creation_date : null,
        usr: req.body.usr
      };
      if (!meetingData.date_meeting) {
        // Optionally, you can set a default value or handle as needed
        // meetingData.date_meeting = 'No date selected';
        // Or skip insert, or return error
        // return res.status(400).json({ error: 'date_meeting is required' });
      }
      const meeting = await MeetingSchedule.create(meetingData);

      try {
        await sendMeetingNotificationEmail({
          meetingRecord: meeting,
          actionLabel: 'Created',
          additionalRecipients: serializedMembersEmails
        });
      } catch (emailError) {
        console.error('Meeting create email notification failed:', emailError.message);
      }

      res.status(201).json(meeting);
    } catch (err) {
      console.error('Meeting create failed:', err);
      res.status(400).json({ error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const meeting = await MeetingSchedule.findByPk(req.params.id);
      if (!meeting) return res.status(404).json({ error: 'Not found' });

      const serializedOtherMembersMeeting = serializeMemberItems(readOtherMembersMeeting(req.body));
      const serializedMembersMeeting = serializeMemberItems(readMembersMeeting(req.body));
      const serializedMembersEmails = serializeMemberItems(readMembersEmails(req.body));

      const updateData = {
        ...req.body,
        id_room: req.body.id_room,
        Notes: req.body.Notes ?? req.body.notes ?? meeting.Notes
      };

      if (readOtherMembersMeeting(req.body) !== undefined) {
        updateData.Other_members_meeting = serializedOtherMembersMeeting;
      }

      if (readMembersMeeting(req.body) !== undefined) {
        updateData.members_meeting = serializedMembersMeeting;
      }

      delete updateData.other_members_meeting;
      delete updateData.otherMembersMeeting;
      delete updateData.membersMeeting;
      delete updateData.members_emails;
      delete updateData.membersEmails;

      await meeting.update(updateData);

      try {
        await sendMeetingNotificationEmail({
          meetingRecord: meeting,
          actionLabel: 'Updated',
          additionalRecipients: serializedMembersEmails
        });
      } catch (emailError) {
        console.error('Meeting update email notification failed:', emailError.message);
      }

      res.json(meeting);
    } catch (err) {
      console.error('Meeting update failed:', err);
      res.status(400).json({ error: err.message });
    }
  },

  getRooms: async (req, res) => {
    try {
      const rooms = await MeetingRoom.findAll();
      res.json(rooms);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  delete: async (req, res) => {
    try {
      const meeting = await MeetingSchedule.findByPk(req.params.id);
      if (!meeting) return res.status(404).json({ error: 'Not found' });
      await meeting.destroy();
      res.json({ message: 'Deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
