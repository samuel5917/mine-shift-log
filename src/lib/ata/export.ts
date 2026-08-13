import type { AtaState } from "./types";
import { formatDataBR, formatHora, gerarSecoes, nomeArquivo } from "./generate";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function baixarDocx(state: AtaState) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    AlignmentType,
    LevelFormat,
    PageOrientation,
  } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "ATA", bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 280 },
      children: [new TextRun({ text: "Reunião de alinhamento", size: 26 })],
    }),
  );

  if (state.data)
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: "DATA: ", bold: true }),
          new TextRun(formatDataBR(state.data)),
        ],
      }),
    );
  if (state.hora)
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: "HORA: ", bold: true }), new TextRun(formatHora(state.hora))],
      }),
    );

  for (const secao of gerarSecoes(state)) {
    children.push(
      new Paragraph({
        spacing: { before: 280, after: 120 },
        border: { bottom: { style: "single", size: 6, color: "1F6B45", space: 2 } },
        children: [new TextRun({ text: secao.titulo, bold: true, size: 26, color: "1F3A5F" })],
      }),
    );
    for (const linha of secao.linhas) {
      children.push(
        new Paragraph({
          numbering: { reference: "ata-bullets", level: 0 },
          spacing: { after: 80, line: 300 },
          children: [new TextRun(linha)],
        }),
      );
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    numbering: {
      config: [
        {
          reference: "ata-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  download(blob, nomeArquivo(state, "docx"));
}

export async function baixarPdf(state: AtaState) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const marginX = 20;
  const marginTop = 20;
  const bottom = 280;
  const width = 210 - marginX * 2;
  let y = marginTop;

  const nl = (h: number) => {
    y += h;
    if (y > bottom) {
      doc.addPage();
      y = marginTop;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ATA", 105, y, { align: "center" });
  nl(8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Reunião de alinhamento", 105, y, { align: "center" });
  nl(12);

  doc.setFontSize(11);
  if (state.data) {
    doc.setFont("helvetica", "bold");
    doc.text("DATA:", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatDataBR(state.data), marginX + 16, y);
    nl(6);
  }
  if (state.hora) {
    doc.setFont("helvetica", "bold");
    doc.text("HORA:", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatHora(state.hora), marginX + 16, y);
    nl(6);
  }

  for (const secao of gerarSecoes(state)) {
    nl(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(secao.titulo, marginX, y);
    doc.setDrawColor(31, 107, 69);
    doc.line(marginX, y + 1.5, 210 - marginX, y + 1.5);
    nl(7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    for (const linha of secao.linhas) {
      const wrapped = doc.splitTextToSize(`• ${linha}`, width - 4) as string[];
      for (const w of wrapped) {
        doc.text(w, marginX + 2, y);
        nl(5.5);
      }
      nl(1);
    }
  }

  doc.save(nomeArquivo(state, "pdf"));
}
