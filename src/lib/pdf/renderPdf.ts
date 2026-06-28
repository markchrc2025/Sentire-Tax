// renderPdf.ts — render the faithful form sheets to a real A4 PDF, client-side.
//
// The Form view is a pixel-faithful HTML replica of the printed BIR form. This
// snapshots each A4 "sheet" at high resolution and lays it onto an A4 PDF page,
// producing an actual PDF file the Form view can preview in an embedded viewer
// (and that matches what Print / Save as PDF produces). jsPDF + html-to-image
// are dynamically imported so they only load when the preview is used.

/** Build an A4 PDF Blob from one or more rendered `.bir-sheet` elements. */
export async function sheetsToPdfBlob(sheets: HTMLElement[]): Promise<Blob> {
  const [{ jsPDF }, htmlToImage] = await Promise.all([
    import("jspdf"),
    import("html-to-image"),
  ]);

  // Wait for web fonts so text isn't captured in a fallback face.
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore — proceed with whatever is loaded */
    }
  }

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < sheets.length; i++) {
    const el = sheets[i];
    const png = await htmlToImage.toPng(el, {
      pixelRatio: 2, // ~192 DPI — crisp for the dense BIR forms
      cacheBust: true,
      backgroundColor: "#ffffff",
      width: el.offsetWidth,
      height: el.offsetHeight,
      // The BIR forms use only system fonts (Arial/Helvetica), so skip the
      // cross-origin web-font embedding (it errors on Google Fonts and is
      // unnecessary here).
      skipFonts: true,
    });
    if (i > 0) pdf.addPage();
    pdf.addImage(png, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
  }

  return pdf.output("blob");
}
