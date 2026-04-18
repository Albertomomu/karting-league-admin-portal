import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PilotStandingEntry = {
  position: number;
  pilot_name: string;
  team_name: string;
  total_points: number;
};

type TeamStandingEntry = {
  position: number;
  team_name: string;
  pilots: string[];
  total_points: number;
};

type StandingsPDFData = {
  seasonName: string;
  leagueName: string;
};

export function generatePilotStandingsPDF(
  data: StandingsPDFData,
  entries: PilotStandingEntry[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CLASIFICACIÓN GENERAL DE PILOTOS', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.text(`${data.leagueName} - ${data.seasonName}`, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Actualizado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 38, { align: 'center' });

  const tableData = entries.map((e) => [
    e.position.toString(),
    e.pilot_name,
    e.team_name,
    e.total_points.toString(),
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Pos', 'Piloto', 'Equipo', 'Puntos']],
    body: tableData,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 20 },
    },
    didParseCell: (data) => {
      // Highlight top 3
      if (data.section === 'body' && data.column.index === 0) {
        const pos = parseInt(data.cell.raw as string);
        if (pos === 1) data.cell.styles.fillColor = [255, 215, 0]; // Gold
        if (pos === 2) data.cell.styles.fillColor = [192, 192, 192]; // Silver
        if (pos === 3) data.cell.styles.fillColor = [205, 127, 50]; // Bronze
      }
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, finalY, { align: 'center' });

  doc.save(`clasificacion_pilotos_${data.leagueName}_${data.seasonName.replace(/\s+/g, '_')}.pdf`);
}

export function generateTeamStandingsPDF(
  data: StandingsPDFData,
  entries: TeamStandingEntry[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CLASIFICACIÓN GENERAL DE EQUIPOS', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.text(`${data.leagueName} - ${data.seasonName}`, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Actualizado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 38, { align: 'center' });

  const tableData = entries.map((e) => [
    e.position.toString(),
    e.team_name,
    e.pilots.join(', '),
    e.total_points.toString(),
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Pos', 'Equipo', 'Pilotos', 'Puntos']],
    body: tableData,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 20 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const pos = parseInt(data.cell.raw as string);
        if (pos === 1) data.cell.styles.fillColor = [255, 215, 0];
        if (pos === 2) data.cell.styles.fillColor = [192, 192, 192];
        if (pos === 3) data.cell.styles.fillColor = [205, 127, 50];
      }
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, finalY, { align: 'center' });

  doc.save(`clasificacion_equipos_${data.leagueName}_${data.seasonName.replace(/\s+/g, '_')}.pdf`);
}
