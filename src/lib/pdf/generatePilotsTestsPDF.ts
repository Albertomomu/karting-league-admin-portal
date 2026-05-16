import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PilotsTestsEntry = { name: string };

type PilotsTestsData = {
  raceName: string;
  date: string; // ISO YYYY-MM-DD
  entries: PilotsTestsEntry[];
  extraEmptyRows?: number;
};

async function loadLogo(): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch('/images/logo/logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = dataUrl;
    });
    return { dataUrl, width, height };
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

  const logo = await loadLogo();
  if (logo) {
    // Mantener proporción real del logo; encajar dentro de 32x26 mm como máximo
    const maxW = 32;
    const maxH = 26;
    const ratio = logo.width / logo.height;
    let logoW = maxW;
    let logoH = maxW / ratio;
    if (logoH > maxH) {
      logoH = maxH;
      logoW = maxH * ratio;
    }
    doc.addImage(logo.dataUrl, 'PNG', pageW - logoW - 15, 14, logoW, logoH, undefined, 'FAST');
  }

  // Título en dos líneas: "PILOTOS {race}" grande y subrayado, fecha debajo más pequeña
  const titleY = 55;
  const titleMain = `PILOTOS ${data.raceName.toUpperCase()}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);

  // Ajustar tamaño si no cabe a 24pt (raceName muy largo)
  const maxTitleWidth = pageW - 30; // 15mm margen izq + 15mm derecho
  let fontSize = 24;
  while (doc.getTextWidth(titleMain) > maxTitleWidth && fontSize > 14) {
    fontSize -= 1;
    doc.setFontSize(fontSize);
  }

  doc.text(titleMain, 15, titleY);
  const mainW = doc.getTextWidth(titleMain);

  // Subrayado del título principal
  doc.setLineWidth(1);
  doc.line(15, titleY + 2.5, 15 + mainW, titleY + 2.5);

  // Fecha en línea siguiente
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text(`Fecha: ${formatDate(data.date)}`, 15, titleY + 11);

  // Tabla
  const bodyRows: string[][] = [
    ...data.entries.map((e) => [e.name.toUpperCase(), '', '', '', '', '']),
    ...Array(data.extraEmptyRows ?? 3).fill(0).map(() => ['', '', '', '', '', '']),
  ];

  autoTable(doc, {
    startY: titleY + 18,
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
