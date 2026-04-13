import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ResultEntry = {
  position: number | null;
  pilot_name: string;
  pilot_number: number;
  best_lap: string | null;
  laps_completed: number | null;
  status: string | null;
  points: number | null;
};

type ResultsPDFData = {
  raceName: string;
  date: string;
  circuitName: string;
  leagueName: string;
  sessionName: string;
  entries: ResultEntry[];
};

const STATUS_LABELS: Record<string, string> = {
  classified: 'OK',
  dnf: 'DNF',
  dsq: 'DSQ',
  dns: 'DNS',
};

export function generateResultsPDF(data: ResultsPDFData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabecera
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`RESULTADOS ${data.sessionName.toUpperCase()}`, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.text(data.raceName, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.leagueName} | ${data.circuitName} | ${data.date}`, pageWidth / 2, 38, { align: 'center' });

  // Tabla
  const tableData = data.entries.map((entry) => [
    entry.position?.toString() || '-',
    entry.pilot_name,
    entry.pilot_number.toString(),
    entry.best_lap || '-',
    entry.laps_completed?.toString() || '-',
    STATUS_LABELS[entry.status || 'classified'] || entry.status || '-',
    entry.points?.toString() || '-',
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Pos', 'Piloto', 'Kart', 'Mejor Vuelta', 'Vueltas', 'Estado', 'Puntos']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 18 },
    },
    didParseCell: (data) => {
      // Colorear filas según status
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw as string;
        if (val === 'DNF') data.cell.styles.textColor = [220, 50, 50];
        if (val === 'DSQ') data.cell.styles.textColor = [100, 100, 100];
        if (val === 'DNS') data.cell.styles.textColor = [200, 150, 0];
      }
    },
  });

  // Pie
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, finalY, { align: 'center' });

  doc.save(`resultados_${data.sessionName.replace(/\s+/g, '_')}_${data.raceName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Genera un PDF combinado con los resultados de ambas carreras.
 */
export function generateCombinedResultsPDF(
  race1: ResultsPDFData,
  race2: ResultsPDFData
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabecera general
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RESULTADOS', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.text(race1.raceName, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${race1.leagueName} | ${race1.circuitName} | ${race1.date}`, pageWidth / 2, 38, { align: 'center' });

  // Carrera I
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`${race1.sessionName}`, 14, 50);

  const table1Data = race1.entries.map((entry) => [
    entry.position?.toString() || '-',
    entry.pilot_name,
    entry.pilot_number.toString(),
    entry.best_lap || '-',
    STATUS_LABELS[entry.status || 'classified'] || '-',
    entry.points?.toString() || '-',
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Pos', 'Piloto', 'Kart', 'Mejor Vuelta', 'Estado', 'Puntos']],
    body: table1Data,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 18 },
    },
  });

  // Carrera II
  const afterTable1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Nueva página si no cabe
  if (afterTable1 > 180) {
    doc.addPage();
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${race2.sessionName}`, 14, 20);

    const table2StartY = 25;
    addResultsTable(doc, race2, table2StartY);
  } else {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${race2.sessionName}`, 14, afterTable1);
    addResultsTable(doc, race2, afterTable1 + 5);
  }

  // Pie
  const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, finalY2, { align: 'center' });

  doc.save(`resultados_combinados_${race1.raceName.replace(/\s+/g, '_')}.pdf`);
}

function addResultsTable(doc: jsPDF, data: ResultsPDFData, startY: number) {
  const tableData = data.entries.map((entry) => [
    entry.position?.toString() || '-',
    entry.pilot_name,
    entry.pilot_number.toString(),
    entry.best_lap || '-',
    STATUS_LABELS[entry.status || 'classified'] || '-',
    entry.points?.toString() || '-',
  ]);

  autoTable(doc, {
    startY,
    head: [['Pos', 'Piloto', 'Kart', 'Mejor Vuelta', 'Estado', 'Puntos']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 18 },
    },
  });
}
