import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseTimeToMs, formatGap } from '@/lib/grid-utils';

type ClassificationEntry = {
  position: number | null;
  pilot_name: string;
  best_lap: string;
};

type ClassificationPDFData = {
  raceName: string;
  date: string;
  circuitName: string;
  leagueName: string;
  entries: ClassificationEntry[];
};

export function generateClassificationPDF(data: ClassificationPDFData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabecera
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CLASIFICACIÓN', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.text(data.raceName, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.leagueName} | ${data.circuitName} | ${data.date}`, pageWidth / 2, 38, { align: 'center' });

  // Calcular referencia para gaps
  const firstEntry = data.entries.find((e) => e.best_lap);
  const firstTimeMs = firstEntry ? parseTimeToMs(firstEntry.best_lap) : 0;

  // Tabla
  const tableData = data.entries.map((entry) => {
    const timeMs = entry.best_lap ? parseTimeToMs(entry.best_lap) : 0;
    const gap = entry.best_lap && firstTimeMs ? formatGap(timeMs, firstTimeMs) : '';

    return [
      entry.position?.toString() || '-',
      entry.pilot_name,
      entry.best_lap || 'DNS',
      gap,
    ];
  });

  autoTable(doc, {
    startY: 45,
    head: [['Pos', 'Piloto', 'Tiempo', 'Diferencia']],
    body: tableData,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'center', cellWidth: 30 },
    },
  });

  // Pie
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, finalY, { align: 'center' });

  doc.save(`clasificacion_${data.raceName.replace(/\s+/g, '_')}.pdf`);
}
