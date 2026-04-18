import jsPDF from 'jspdf';

type GridEntry = {
  grid_position: number;
  pilot_name: string;
};

type GridPDFData = {
  raceName: string;
  date: string;
  circuitName: string;
  leagueName: string;
  sessionName: string;
  entries: GridEntry[];
  invertedTopN?: number;
};

const CELL_H = 20;
const CELL_W = 86;
const CELL_GAP = 8;
const BADGE_W = 20;
const ROW_GAP = 3;

function badgeColor(pos: number, inverted: boolean): [number, number, number] {
  if (inverted) return [210, 125, 20];   // ámbar — top invertido C2
  if (pos === 1) return [180, 145, 30];  // oro
  if (pos === 2) return [130, 130, 145]; // plata
  if (pos === 3) return [160, 95, 40];   // bronce
  return [45, 75, 115];                  // azul oscuro
}

function drawCell(
  doc: jsPDF,
  x: number,
  y: number,
  entry: GridEntry,
  isInverted: boolean,
) {
  const [br, bg, bb] = badgeColor(entry.grid_position, isInverted);

  // Sombra sutil
  doc.setFillColor(210, 210, 210);
  doc.roundedRect(x + 1, y + 1, CELL_W, CELL_H, 2.5, 2.5, 'F');

  // Fondo blanco de la tarjeta
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, CELL_W, CELL_H, 2.5, 2.5, 'F');

  // Badge de posición (rectángulo coloreado en el lado izquierdo, encima del blanco)
  doc.setFillColor(br, bg, bb);
  // Dibujar badge con esquinas redondeadas solo en el lado izquierdo
  doc.roundedRect(x, y, BADGE_W + 2, CELL_H, 2.5, 2.5, 'F');
  doc.rect(x + BADGE_W / 2, y, BADGE_W / 2 + 2, CELL_H, 'F'); // aplana esquinas derechas del badge

  // Número de posición
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  const posStr = String(entry.grid_position);
  const textW = doc.getTextWidth(posStr);
  doc.text(posStr, x + BADGE_W / 2 - textW / 2, y + CELL_H / 2 + 1.5);

  // Línea divisoria vertical
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(x + BADGE_W + 2, y + 3, x + BADGE_W + 2, y + CELL_H - 3);

  // Nombre del piloto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const nameX = x + BADGE_W + 6;
  const nameMaxW = CELL_W - BADGE_W - 8;
  let name = entry.pilot_name;
  // Truncar si no cabe
  while (doc.getTextWidth(name) > nameMaxW && name.length > 4) {
    name = name.slice(0, -1);
  }
  if (name !== entry.pilot_name) name = name.slice(0, -1) + '.';
  doc.text(name, nameX, y + CELL_H / 2 + 1.5);

  // Badge "POLE" para P1
  if (entry.grid_position === 1) {
    doc.setFillColor(br, bg, bb);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const badgeLabel = 'POLE';
    const bw = doc.getTextWidth(badgeLabel) + 4;
    doc.roundedRect(x + CELL_W - bw - 3, y + 3, bw, 6, 1, 1, 'F');
    doc.text(badgeLabel, x + CELL_W - bw - 1, y + 7.5);
  }

  // Badge "INV" para posiciones invertidas
  if (isInverted && entry.grid_position > 1) {
    doc.setFillColor(br, bg, bb);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const badgeLabel = 'INV';
    const bw = doc.getTextWidth(badgeLabel) + 4;
    doc.roundedRect(x + CELL_W - bw - 3, y + 3, bw, 6, 1, 1, 'F');
    doc.text(badgeLabel, x + CELL_W - bw - 1, y + 7.5);
  }
}

export function generateGridPDF(data: GridPDFData) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── Cabecera ──────────────────────────────────────────────────────────────
  // Banda superior oscura
  doc.setFillColor(25, 40, 65);
  doc.rect(0, 0, pageW, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`PARRILLA ${data.sessionName}`, pageW / 2, 10, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 225);
  doc.text(data.raceName, pageW / 2, 17.5, { align: 'center' });

  // Línea info debajo de la banda
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  const infoY = 28;
  doc.text(`${data.leagueName}  ·  ${data.circuitName}  ·  ${data.date}`, pageW / 2, infoY, { align: 'center' });

  if (data.invertedTopN && data.invertedTopN > 0) {
    doc.setFontSize(8);
    doc.setTextColor(180, 120, 0);
    doc.text(`Top ${data.invertedTopN} con orden invertido`, pageW / 2, infoY + 5.5, { align: 'center' });
  }

  // ── Leyenda de columnas ───────────────────────────────────────────────────
  const legendY = data.invertedTopN ? infoY + 12 : infoY + 8;
  const leftX = (pageW - CELL_W * 2 - CELL_GAP) / 2;
  const rightX = leftX + CELL_W + CELL_GAP;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('LADO IZQUIERDO', leftX + CELL_W / 2, legendY, { align: 'center' });
  doc.text('LADO DERECHO', rightX + CELL_W / 2, legendY, { align: 'center' });

  // Línea separadora central (simula el eje de la pista)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(pageW / 2, legendY + 3, pageW / 2, pageH - 12);
  doc.setLineDashPattern([], 0);

  // ── Celdas ────────────────────────────────────────────────────────────────
  let y = legendY + 5;

  for (let i = 0; i < data.entries.length; i += 2) {
    const left = data.entries[i];
    const right = data.entries[i + 1];

    if (y + CELL_H > pageH - 14) {
      doc.addPage();
      y = 15;
    }

    if (left) {
      const isInv = !!(data.invertedTopN && left.grid_position <= data.invertedTopN);
      drawCell(doc, leftX, y, left, isInv);
    }

    if (right) {
      const isInv = !!(data.invertedTopN && right.grid_position <= data.invertedTopN);
      drawCell(doc, rightX, y, right, isInv);
    }

    y += CELL_H + ROW_GAP;
  }

  // ── Pie ───────────────────────────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setTextColor(170, 170, 170);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageW / 2, pageH - 5, { align: 'center' });

  doc.save(`parrilla_${data.sessionName.replace(/\s+/g, '_')}_${data.raceName.replace(/\s+/g, '_')}.pdf`);
}
