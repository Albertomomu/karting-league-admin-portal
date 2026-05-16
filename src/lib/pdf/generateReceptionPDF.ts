import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReceptionLeagueSection = {
  leagueName: string;
  pilots: { name: string }[];
};

type ReceptionPDFData = {
  raceName: string;
  date: string; // ISO YYYY-MM-DD
  sections: ReceptionLeagueSection[];
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

export async function generateReceptionPDF(data: ReceptionPDFData) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  const logo = await loadLogo();
  if (logo) {
    const maxW = 28;
    const maxH = 22;
    const ratio = logo.width / logo.height;
    let logoW = maxW;
    let logoH = maxW / ratio;
    if (logoH > maxH) {
      logoH = maxH;
      logoW = maxH * ratio;
    }
    doc.addImage(logo.dataUrl, 'PNG', pageW - logoW - 12, 10, logoW, logoH, undefined, 'FAST');
  }

  // Título
  const titleY = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);

  const titleMain = `HOJA RECEPCIÓN — ${data.raceName.toUpperCase()}`;
  const maxTitleWidth = pageW - 60; // reservamos espacio para el logo
  let fontSize = 18;
  while (doc.getTextWidth(titleMain) > maxTitleWidth && fontSize > 11) {
    fontSize -= 1;
    doc.setFontSize(fontSize);
  }
  doc.text(titleMain, 12, titleY);
  const titleW = doc.getTextWidth(titleMain);
  doc.setLineWidth(0.6);
  doc.line(12, titleY + 1.5, 12 + titleW, titleY + 1.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Fecha: ${formatDate(data.date)}`, 12, titleY + 7);

  // Layout: si hay 1-2 secciones, lado a lado; si hay 3+, en filas
  const startY = titleY + 14;
  const margin = 12;
  const gap = 8;
  const usableW = pageW - margin * 2;

  if (data.sections.length <= 2) {
    const colW = (usableW - gap * (data.sections.length - 1)) / data.sections.length;
    data.sections.forEach((section, i) => {
      const x = margin + i * (colW + gap);
      drawSection(doc, x, startY, colW, section);
    });
  } else {
    // 3+ secciones: dos por fila
    const colW = (usableW - gap) / 2;
    let y = startY;
    let rowMaxBottom = startY;
    data.sections.forEach((section, i) => {
      const colIdx = i % 2;
      if (colIdx === 0 && i > 0) {
        y = rowMaxBottom + 6;
        rowMaxBottom = y;
      }
      const x = margin + colIdx * (colW + gap);
      const finalY = drawSection(doc, x, y, colW, section);
      rowMaxBottom = Math.max(rowMaxBottom, finalY);
    });
  }

  const fileName = `recepcion_${data.raceName.replace(/\s+/g, '_')}_${data.date}.pdf`;
  doc.save(fileName);
}

function drawSection(doc: jsPDF, x: number, y: number, w: number, section: ReceptionLeagueSection): number {
  // Cabecera de liga
  doc.setFillColor(45, 75, 115);
  doc.rect(x, y, w, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(section.leagueName.toUpperCase(), x + w / 2, y + 5, { align: 'center' });

  // Tabla
  const bodyRows = section.pilots.map((p) => [p.name.toUpperCase(), '']);

  autoTable(doc, {
    startY: y + 7,
    margin: { left: x, right: doc.internal.pageSize.getWidth() - (x + w) },
    tableWidth: w,
    head: [['NOMBRE', 'PAGADO']],
    body: bodyRows,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 2.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      minCellHeight: 8,
      textColor: [0, 0, 0],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: w - 22, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 22, halign: 'center' },
    },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}
