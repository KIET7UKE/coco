import { getMailer, FROM, escapeHtml, layout } from '../services/mailer.js';
import { broadcast } from '../config/broadcast.js';
import { primaryClientUrl } from '../config/env.js';
import { str, EMAIL } from '../lib/http.js';

function validTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

function icsFile(start, url) {
  const { title, durationSec } = broadcast();
  const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(start.getTime() + durationSec * 1000);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CoCo by Hibarri//Broadcast//EN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${stamp(start)}@coco.hibarri.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${title} (CoCo broadcast)`,
    `DESCRIPTION:Join here: ${url}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function broadcastEmail({ firstName, start, timeZone, origin }) {
  const { title, whitepaperUrl } = broadcast();
  const when = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(start);
  const room = `${origin}/live/room`;
  const whitepaper = new URL(whitepaperUrl, origin).toString();
  return {
    subject: `Your seat is reserved: ${title}`,
    html: layout({
      preheader: `${title} starts ${when}.`,
      heading: `You're in, ${firstName}!`,
      paragraphs: [
        `Your free seat for <b>${escapeHtml(title)}</b> is reserved.`,
        `<b>When:</b> ${escapeHtml(when)}`,
        'Learn about superintelligence, compute, data centers and servers, and how to get your share of the $1.1 trillion cloud landlord economy.',
        `While you wait, read our free <a href="${escapeHtml(whitepaper)}" style="color:#9e00ff;font-weight:600">White Paper on Compute</a>.`,
      ],
      button: { href: room, label: 'Go to the broadcast room' },
      footnote: "Open the room link on the device you registered with. A calendar invite is attached so you don't miss the start.",
    }),
    text: `You're in, ${firstName}!\n\nYour free seat for ${title} is reserved.\nWhen: ${when}\n\nBroadcast room: ${room}\nWhite Paper on Compute: ${whitepaper}\n`,
    attachments: [{ filename: 'coco-broadcast.ics', content: icsFile(start, room), contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }],
  };
}

function whitepaperEmail({ firstName, origin }) {
  const { title, whitepaperUrl } = broadcast();
  const whitepaper = new URL(whitepaperUrl, origin).toString();
  return {
    subject: 'Your White Paper on Compute',
    html: layout({
      preheader: 'Compute, superintelligence and where investment is going.',
      heading: `Here's your white paper, ${firstName}`,
      paragraphs: [
        'Thanks for your interest in CoCo. Our White Paper on Compute covers why superintelligence runs on compute, how data centers and servers earn, and how private owners take part in the cloud landlord economy.',
        `When you're ready, you can <a href="${escapeHtml(`${origin}/investors#packages`)}" style="color:#9e00ff;font-weight:600">browse server packages</a> or join our free daily <a href="${escapeHtml(`${origin}/live`)}" style="color:#9e00ff;font-weight:600">${escapeHtml(title)}</a> broadcast.`,
      ],
      button: { href: whitepaper, label: 'Read the white paper' },
      footnote: 'Questions? Just reply to this email and a partner specialist will get back to you.',
    }),
    text: `Here's your white paper, ${firstName}\n\nDownload: ${whitepaper}\n\nServer packages: ${origin}/investors#packages\n`,
  };
}

export async function sendTransactionalEmail(req, res) {
  const mailer = getMailer();
  if (!mailer) return res.status(503).json({ error: 'not_configured' });

  const body = req.body ?? {};
  const email = str(body.email, 200).toLowerCase();
  if (!EMAIL.test(email)) return res.status(400).json({ error: 'invalid_email' });

  const firstName = str(body.name, 80).split(/\s+/)[0] || 'there';
  const origin = primaryClientUrl();

  let message;
  if (body.template === 'broadcast-registration') {
    const start = new Date(body.start);
    const offset = start.getTime() - Date.now();
    // Sessions run daily, so a valid start is never far from now.
    if (Number.isNaN(offset) || offset < -3 * 3600_000 || offset > 50 * 3600_000) return res.status(400).json({ error: 'invalid_start' });
    message = broadcastEmail({ firstName, start, timeZone: validTimeZone(str(body.timeZone, 64)), origin });
  } else if (body.template === 'whitepaper') {
    message = whitepaperEmail({ firstName, origin });
  } else {
    return res.status(400).json({ error: 'invalid_template' });
  }

  try {
    await mailer.sendMail({ from: FROM(), to: email, replyTo: process.env.EMAIL_REPLY_TO || undefined, ...message });
    return res.json({ sent: true });
  } catch (err) {
    console.error('[Email] Send failed:', err?.code, err?.message);
    return res.status(502).json({ error: 'send_failed' });
  }
}
