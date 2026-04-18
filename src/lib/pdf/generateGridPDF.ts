import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type GridEntry = {
  grid_position: number;
  pilot_name: string;
};

type GridPDFData = {
  raceName: string;
  date: string;
  circuitName: string;
  leagueName: string;
  sessionName: string; // "CARRERA I" o "CARRERA II"
  entries: GridEntry[];
  invertedTopN?: number; // 10 para C2, 0 para C1
};

export function generateGridPDF(data: GridPDFData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabecera
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`PARRILLA ${data.sessionName}`, pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.text(data.raceName, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.leagueName} | ${data.circuitName} | ${data.date}`, pageWidth / 2, 38, { align: 'center' });

  if (data.invertedTopN && data.invertedTopN > 0) {
    doc.setFontSize(9);
    doc.setTextColor(180, 120, 0);
    doc.text(`(Top ${data.invertedTopN} con orden invertido)`, pageWidth / 2, 44, { align: 'center' });
    doc.setTextColor(0);
  }

  // Representación visual de parrilla 2x2
  const startY = data.invertedTopN ? 52 : 46;
  const cellWidth = 80;
  const cellHeight = 12;
  const gapX = 10;
  const leftX = (pageWidth - cellWidth * 2 - gapX) / 2;
  const rightX = leftX + cellWidth + gapX;

  let y = startY;
  for (let i = 0; i < data.entries.length; i += 2) {
    const left = data.entries[i];
    const right = data.entries[i + 1];

    // Celda izquierda
    if (left) {
      const isInverted = data.invertedTopN ? left.grid_position <= data.invertedTopN : false;
      drawGridCell(doc, leftX, y, cellWidth, cellHeight, left, isInverted);
    }

    // Celda derecha
    if (right) {
      const isInverted = data.invertedTopN ? right.grid_position <= data.invertedTopN : false;
      drawGridCell(doc, rightX, y, cellWidth, cellHeight, right, isInverted);
    }

    y += cellHeight + 3;

    // Nueva página si no cabe
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }

  // Tabla resumen en nueva página si la visual ocupa mucho
  if (y > 180) {
    doc.addPage();
    y = 20;
  } else {
    y += 10;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Parrilla', 14, y);

  const tableData = data.entries.map((entry) => {
    const inverted = data.invertedTopN && entry.grid_position <= data.invertedTopN;
    return [
      entry.grid_position.toString(),
      entry.pilot_name,
      inverted ? 'Invertido' : '',
    ];
  });

  const headers = data.invertedTopN
    ? [['Pos', 'Piloto', 'Estado']]
    : [['Pos', 'Piloto']];

  const body = data.invertedTopN
    ? tableData
    : tableData.map((row) => row.slice(0, 2));

  autoTable(doc, {
    startY: y + 5,
    head: headers,
    body: body,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
    },
  });

  // Pie
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth / 2, finalY, { align: 'center' });

  doc.save(`parrilla_${data.sessionName.replace(/\s+/g, '_')}_${data.raceName.replace(/\s+/g, '_')}.pdf`);
}

function drawGridCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  entry: GridEntry,
  isInverted: boolean
) {
  // Fondo
  if (isInverted) {
    doc.setFillColor(255, 248, 220); // Amarillo claro
  } else {
    doc.setFillColor(240, 240, 240);
  }
  doc.roundedRect(x, y, w, h, 2, 2, 'F');

  // Borde
  doc.setDrawColor(isInverted ? 200 : 180, isInverted ? 180 : 180, isInverted ? 0 : 180);
  doc.roundedRect(x, y, w, h, 2, 2, 'S');

  // Texto
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`P${entry.grid_position}`, x + 3, y + h / 2 + 1);

  doc.setFont('helvetica', 'normal');
  doc.text(entry.pilot_name, x + 18, y + h / 2 + 1);
}
