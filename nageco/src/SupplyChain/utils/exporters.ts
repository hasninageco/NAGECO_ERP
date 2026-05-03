import type { ProductRow } from "../types";

export async function exportProductsToExcel(rows: ProductRow[]) {
  const xlsx = await import("xlsx");

  const data = rows.map((r) => ({
    ID: r.Id_art,
    Product: r.desig_art ?? "",
    Section: r.section?.DESIG ?? "Uncategorized",
    Place: r.Place_item ?? "",
    Barcode: r.BARCODE ?? "",
    Size: r.SIZE_ART ?? "",
    Contents: r.contents ?? "",
    Manufacturer: r.MANUFACRURE ?? "",
    Country: r.COUNTRY ?? "",
  }));

  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Products");
  xlsx.writeFile(wb, `products_export.xlsx`);
}

export async function exportProductsToPdf(rows: ProductRow[]) {
  const jsPDF = (await import("jspdf")).default;
  await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });

  const body = rows.map((r) => ([
    r.Id_art,
    r.desig_art ?? "",
    r.section?.DESIG ?? "Uncategorized",
    r.Place_item ?? "",
    r.BARCODE ?? "",
    r.SIZE_ART ?? "",
    r.contents ?? "",
    r.MANUFACRURE ?? "",
    r.COUNTRY ?? "",
  ]));

  (doc as any).autoTable({
    head: [[
      "ID", "Product", "Section", "Place", "Barcode",
      "Size", "Contents", "Manufacturer", "Country"
    ]],
    body,
    styles: { fontSize: 8 },
    margin: { top: 12 },
  });

  doc.save("products_export.pdf");
}
