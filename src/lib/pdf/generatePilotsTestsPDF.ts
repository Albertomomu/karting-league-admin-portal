import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PilotsTestsEntry = { name: string };

type PilotsTestsData = {
  raceName: string;
  date: string; // ISO YYYY-MM-DD
  entries: PilotsTestsEntry[];
  extraEmptyRows?: number;
};

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch('/images/logo/logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export async function generatePilotsTestsPDF(data: PilotsTestsData) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  const logo = await loadLogoDataUrl();
  if (logo) {
    const logoW = 28;
    const logoH = 22;
    doc.addImage(logo, 'PNG', pageW - logoW - 15, 14, logoW, logoH);
  }

  // Título: PILOTOS {race name} ({date}) — "PILOTOS {race}" en grande subrayado, fecha más pequeña
  const titleY = 55;
  const titleMain = `PILOTOS ${data.raceName.toUpperCase()}`;
  const dateLabel = ` (${formatDate(data.date)})`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(0, 0, 0);
  doc.text(titleMain, 15, titleY);
  const mainW = doc.getTextWidth(titleMain);

  // Subrayado del título principal
  doc.setLineWidth(1.2);
  doc.line(15, titleY + 2.5, 15 + mainW, titleY + 2.5);

  // Fecha al lado, más pequeña, sin subrayar
  doc.setFontSize(15);
  doc.text(dateLabel, 15 + mainW + 1, titleY);

  // Tabla
  const bodyRows: string[][] = [
    ...data.entries.map((e) => [e.name.toUpperCase(), '', '', '', '', '']),
    ...Array(data.extraEmptyRows ?? 3).fill(0).map(() => ['', '', '', '', '', '']),
  ];

  autoTable(doc, {
    startY: titleY + 15,
    head: [['NOMBRE', 'ASIST', 'PESO', 'LASTRE', 'KART\nQualys', 'KART\nCarreras']],
    body: bodyRows,
    theme: 'grid',
    styles: {
      fontSize: 11,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      minCellHeight: 11,
      textColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 11,
      lineWidth: 0.4,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 18 },
      2: { cellWidth: 18 },
      3: { cellWidth: 22 },
      4: { cellWidth: 28 },
      5: { cellWidth: 28 },
    },
  });

  const fileName = `pilotos_${data.raceName.replace(/\s+/g, '_')}_${data.date}.pdf`;
  doc.save(fileName);
}
