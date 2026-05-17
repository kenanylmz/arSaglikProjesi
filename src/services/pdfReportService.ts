import {generatePDF} from 'react-native-html-to-pdf';
import RNFetchBlob from 'react-native-blob-util';
import {MEDICINES} from '../constants/medicines';
import {MedicineSchedule, DoseRecord} from '../types';

export interface WeekReportData {
  userId: string;
  schedule: MedicineSchedule;
  dosesByDate: Record<string, DoseRecord[]>;
  dates: string[];
}

type DoseStatus = 'taken' | 'missed' | 'pending';

function calcStatus(
  date: string,
  medicineId: string,
  scheduledTime: string,
  doses: DoseRecord[],
): DoseStatus {
  const taken = doses.some(
    d =>
      d.medicineId === medicineId &&
      d.scheduledTime === scheduledTime &&
      d.taken,
  );
  if (taken) {
    return 'taken';
  }
  const today = new Date().toISOString().split('T')[0];
  if (date < today) {
    return 'missed';
  }
  const [h, m] = scheduledTime.split(':').map(Number);
  const doseMs = new Date().setHours(h, m, 0, 0);
  if (Date.now() > doseMs + 30 * 60 * 1000) {
    return 'missed';
  }
  return 'pending';
}

function getTakenAtTime(
  medicineId: string,
  scheduledTime: string,
  doses: DoseRecord[],
): string | null {
  const rec = doses.find(
    d =>
      d.medicineId === medicineId &&
      d.scheduledTime === scheduledTime &&
      d.taken,
  );
  if (!rec?.takenAt) {
    return null;
  }
  const d = new Date(rec.takenAt);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const TR_MONTHS_SHORT = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];
const TR_MONTHS_LONG = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${TR_DAYS[d.getDay()]}<br/>${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]}`;
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${TR_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

function buildMedicineTable(
  medicine: (typeof MEDICINES)[0],
  times: string[],
  dates: string[],
  dosesByDate: Record<string, DoseRecord[]>,
  todayStr: string,
): {html: string; taken: number; total: number; missedItems: string[]} {
  let taken = 0;
  let total = 0;
  const missedItems: string[] = [];

  const dateHeaders = dates
    .map(date => {
      const isToday = date === todayStr;
      return `<th${isToday ? ' class="today-col"' : ''}>${formatDateShort(date)}</th>`;
    })
    .join('');

  const rows = times
    .map(time => {
      const cells = dates
        .map(date => {
          const doses = dosesByDate[date] ?? [];
          const status = calcStatus(date, medicine.id, time, doses);

          if (status !== 'pending') {
            total++;
          }

          if (status === 'taken') {
            taken++;
            const takenAt = getTakenAtTime(medicine.id, time, doses);
            return `<td class="cell-taken">${takenAt ? takenAt + '<br/><span class="sub-label">alındı</span>' : '&#10003;'}</td>`;
          }
          if (status === 'missed') {
            missedItems.push(
              `${medicine.name} — ${time} dozu — ${formatDateLong(date)}`,
            );
            return `<td class="cell-missed">&#10007;<br/><span class="sub-label">alınmadı</span></td>`;
          }
          return `<td class="cell-pending">—</td>`;
        })
        .join('');

      return `<tr><td class="time-cell">${time}</td>${cells}</tr>`;
    })
    .join('');

  const medCompliance =
    total > 0 ? Math.round((taken / total) * 100) : 0;
  const compClass =
    medCompliance >= 80 ? 'good' : medCompliance >= 50 ? 'medium' : 'bad';

  const html = `
    <div class="medicine-section">
      <div class="medicine-header" style="border-left:5px solid ${medicine.color}">
        <div class="med-name">${medicine.name}</div>
        <div class="med-sub">${medicine.genericName} &bull; ${medicine.dosage} &bull; ${medicine.manufacturer}</div>
        <div class="med-compliance">
          Uyum: <span class="comp-val ${compClass}">${medCompliance}%</span>
          &nbsp;(${taken}/${total} doz)
        </div>
        <div class="med-desc">${medicine.description}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th class="time-header">Saat</th>
            ${dateHeaders}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;

  return {html, taken, total, missedItems};
}

function buildHtml(data: WeekReportData): string {
  const {userId, schedule, dosesByDate, dates} = data;
  const todayStr = new Date().toISOString().split('T')[0];
  const reportDate = formatDateLong(todayStr);
  const periodStart = formatDateLong(dates[0]);
  const periodEnd = formatDateLong(dates[dates.length - 1]);

  let totalTaken = 0;
  let totalDoses = 0;
  const allMissed: string[] = [];
  let tablesHtml = '';

  MEDICINES.forEach(med => {
    const times = schedule[med.id] ?? med.defaultTimes;
    const {html, taken, total, missedItems} = buildMedicineTable(
      med,
      times,
      dates,
      dosesByDate,
      todayStr,
    );
    totalTaken += taken;
    totalDoses += total;
    allMissed.push(...missedItems);
    tablesHtml += html;
  });

  const compliance =
    totalDoses > 0 ? Math.round((totalTaken / totalDoses) * 100) : 0;
  const compClass =
    compliance >= 80 ? 'good' : compliance >= 50 ? 'medium' : 'bad';

  const missedSection =
    allMissed.length > 0
      ? `<div class="missed-section">
          <div class="section-title missed-title">Kaçırılan Dozlar Detayı</div>
          ${allMissed
            .map(
              item =>
                `<div class="missed-item"><span class="missed-x">&#10007;</span>${item}</div>`,
            )
            .join('')}
        </div>`
      : `<div class="all-good-box">
          <div class="all-good-text">&#10003; Tüm dozlar bu hafta alındı!</div>
        </div>`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#2c3e50;background:#fff;padding:24px}

.report-header{background:#1a5276;color:#fff;padding:20px 24px;border-radius:10px;margin-bottom:20px}
.app-name{font-size:19px;font-weight:bold;margin-bottom:3px}
.report-title{font-size:13px;opacity:.85;margin-bottom:12px}
.meta-grid{display:flex;gap:24px;flex-wrap:wrap}
.meta-item{font-size:11px}
.meta-label{display:block;font-size:9px;opacity:.7;margin-bottom:2px}
.meta-val{font-weight:bold}

.summary-box{background:#f4f6f8;border:1px solid #dce1e7;border-radius:10px;padding:16px;margin-bottom:22px}
.section-title{font-size:13px;font-weight:bold;color:#1a5276;border-bottom:2px solid #1a5276;padding-bottom:6px;margin-bottom:14px}
.stats-grid{display:flex;gap:12px;flex-wrap:wrap}
.stat-card{flex:1;min-width:90px;text-align:center;background:#fff;border-radius:8px;padding:12px 8px;border:1px solid #dce1e7}
.stat-num{font-size:26px;font-weight:bold;display:block}
.stat-label{font-size:9px;color:#6c757d;margin-top:3px;display:block}
.good{color:#27ae60}
.medium{color:#e67e22}
.bad{color:#e74c3c}

.medicine-section{margin-bottom:22px}
.medicine-header{padding:12px 16px;background:#f8f9fa;border:1px solid #dee2e6;border-bottom:none;border-radius:8px 8px 0 0}
.med-name{font-size:14px;font-weight:bold;color:#2c3e50}
.med-sub{font-size:10px;color:#6c757d;margin-top:2px}
.med-compliance{font-size:11px;margin-top:6px}
.comp-val{font-weight:bold;font-size:13px}
.med-desc{font-size:10px;color:#95a5a6;margin-top:4px;font-style:italic}

table{width:100%;border-collapse:collapse;border:1px solid #dee2e6;border-radius:0 0 8px 8px;overflow:hidden}
th{background:#2c3e50;color:#fff;padding:8px 5px;text-align:center;font-size:9px;font-weight:bold;line-height:1.5}
th.today-col{background:#2e86c1}
th.time-header{background:#34495e;text-align:left;padding-left:10px;min-width:44px}
td{padding:9px 5px;text-align:center;font-size:9px;border-bottom:1px solid #f0f0f0;border-right:1px solid #f0f0f0;line-height:1.5}
td.time-cell{font-weight:bold;background:#f8f9fa;text-align:left;padding-left:10px;color:#2c3e50;font-size:10px}
td.cell-taken{background:#eafaf1;color:#1e8449;font-weight:bold}
td.cell-missed{background:#fdedec;color:#c0392b;font-weight:bold}
td.cell-pending{background:#f8f9fa;color:#adb5bd}
.sub-label{font-size:8px;font-weight:normal;display:block}
tr:last-child td{border-bottom:none}

.missed-section{margin-top:22px}
.missed-title{color:#c0392b;border-color:#e74c3c}
.missed-item{padding:8px 12px;background:#fdedec;border-radius:6px;margin-bottom:6px;font-size:11px;color:#922b21}
.missed-x{color:#e74c3c;font-weight:bold;margin-right:8px}

.all-good-box{margin-top:22px;background:#eafaf1;border:1px solid #a9dfbf;border-radius:8px;padding:16px;text-align:center}
.all-good-text{font-size:13px;font-weight:bold;color:#1e8449}

.footer{margin-top:24px;text-align:center;font-size:9px;color:#adb5bd;border-top:1px solid #dee2e6;padding-top:12px}
</style>
</head>
<body>

<div class="report-header">
  <div class="app-name">&#128138; Nefes Saati</div>
  <div class="report-title">Haftalık İlaç Takip Raporu</div>
  <div class="meta-grid">
    <div class="meta-item"><span class="meta-label">Hasta ID</span><span class="meta-val">${userId}</span></div>
    <div class="meta-item"><span class="meta-label">Dönem</span><span class="meta-val">${periodStart} — ${periodEnd}</span></div>
    <div class="meta-item"><span class="meta-label">Rapor Tarihi</span><span class="meta-val">${reportDate}</span></div>
  </div>
</div>

<div class="summary-box">
  <div class="section-title">Haftalık Özet</div>
  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-num ${compClass}">${compliance}%</span>
      <span class="stat-label">Genel Uyum</span>
    </div>
    <div class="stat-card">
      <span class="stat-num good">${totalTaken}</span>
      <span class="stat-label">Alınan Doz</span>
    </div>
    <div class="stat-card">
      <span class="stat-num bad">${totalDoses - totalTaken}</span>
      <span class="stat-label">Kaçırılan Doz</span>
    </div>
    <div class="stat-card">
      <span class="stat-num">${totalDoses}</span>
      <span class="stat-label">Toplam Doz</span>
    </div>
  </div>
</div>

${tablesHtml}

${missedSection}

<div class="footer">
  Bu rapor Nefes Saati uygulaması tarafından otomatik oluşturulmuştur &bull; ${reportDate}
</div>

</body>
</html>`;
}

export async function generateAndOpenWeeklyReport(
  data: WeekReportData,
): Promise<void> {
  const html = buildHtml(data);

  const result = await generatePDF({
    html,
    fileName: `nefes_saati_${data.userId}_${data.dates[data.dates.length - 1]}`,
    directory: 'Downloads',
    height: 842,
    width: 595,
    bgColor: '#FFFFFF',
  });

  if (!result.filePath) {
    throw new Error('PDF oluşturulamadı.');
  }

  await RNFetchBlob.android.actionViewIntent(
    result.filePath,
    'application/pdf',
  );
}
