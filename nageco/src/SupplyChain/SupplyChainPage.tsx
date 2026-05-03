import * as React from "react";
import { Box, Snackbar, Alert } from "@mui/material";

import ProductsTable from "./components/ProductsTable";
import ExportDialog from "./components/ExportDialog";
import SectionFilterDialog from "./components/SectionFilterDialog";
import SectionManageDialog from "./components/SectionManageDialog";
import ProductFormDialog from "./components/ProductFormDialog";

import type { ProductRow, SectionRow, CostCenterRow, SectionCategoryRow } from "./types";
import {
  getProducts,
  getSections,
  getSectionCategories,
  deleteProduct,
  createProduct,
  updateProduct,
  exportProductsXlsx,
  getCostCenters,
} from "./services/supplyChain.api";

export default function SupplyChainPage() {
  // data
  const [sections, setSections] = React.useState<SectionRow[]>([]);
  const [departments, setDepartments] = React.useState<CostCenterRow[]>([]);
  const [products, setProducts] = React.useState<ProductRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  // server pagination
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [q, setQ] = React.useState("");

  // filters
  const [selectedSectionId, setSelectedSectionId] = React.useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [sectionCategories, setSectionCategories] = React.useState<SectionCategoryRow[]>([]);
  const [missingSection, setMissingSection] = React.useState(false);

  // dialogs
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [manageOpen, setManageOpen] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);

  const [productDialogOpen, setProductDialogOpen] = React.useState(false);
  const [productMode, setProductMode] = React.useState<"create" | "edit">("create");
  const [editingProduct, setEditingProduct] = React.useState<ProductRow | null>(null);

  // export loading (indeterminate)
  const [exporting, setExporting] = React.useState(false);

  // toast
  const [toast, setToast] = React.useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showError = (msg: string) => setToast({ type: "error", msg });
  const showSuccess = (msg: string) => setToast({ type: "success", msg });

  async function refreshSections() {
    try {
      const s = await getSections();
      setSections(s);
    } catch (e: any) {
      showError(e?.response?.data?.message || e.message || "Failed to load sections");
    }
  }

  async function refreshDepartments() {
    try {
      const d = await getCostCenters();

      // Optional sort by id (helps UX)
      const sorted = [...d].sort((a: any, b: any) => {
        const ia = Number(a?.id_administratin ?? 0);
        const ib = Number(b?.id_administratin ?? 0);
        return ia - ib;
      });

      setDepartments(sorted);
    } catch (e: any) {
      showError(e?.response?.data?.message || e.message || "Failed to load departments");
    }
  }

  async function refreshProducts(
    next?: Partial<{
      page: number;
      limit: number;
      q: string;
      selectedSectionId: number | null;
      selectedCategory: string | null;
      missingSection: boolean;
    }>
  ) {
    setLoading(true);
    try {
      const res = await getProducts({
        page: next?.page ?? page,
        limit: next?.limit ?? limit,
        q: next?.q ?? q,
        sectionId: next?.missingSection ? null : next?.selectedSectionId ?? selectedSectionId,
        category: next?.selectedCategory ?? selectedCategory,
        missingSection: next?.missingSection ?? missingSection,
      });

      setProducts(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(res.page);
    } catch (e: any) {
      showError(e?.response?.data?.message || e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  // load sections + departments once
  React.useEffect(() => {
    refreshSections();
    refreshDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load products when filters/pagination change
  React.useEffect(() => {
    refreshProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q, selectedSectionId, selectedCategory, missingSection]);

  React.useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      if (selectedSectionId == null || missingSection) {
        setSectionCategories([]);
        setSelectedCategory(null);
        return;
      }

      try {
        const rows = await getSectionCategories(selectedSectionId);
        if (ignore) return;
        setSectionCategories(rows || []);

        if (selectedCategory && !rows.some((r) => r.id === selectedCategory)) {
          setSelectedCategory(null);
        }
      } catch {
        if (ignore) return;
        setSectionCategories([]);
        setSelectedCategory(null);
      }
    }

    loadCategories();
    return () => {
      ignore = true;
    };
  }, [selectedSectionId, missingSection, selectedCategory]);

  const filteringLabel = React.useMemo(() => {
    if (missingSection) return "FILTERING: Uncategorized";
    if (selectedSectionId === null) return "FILTERING: All";
    const s = sections.find((x) => x.ID_SECTION === selectedSectionId);
    const base = s?.DESIG ?? `#${selectedSectionId}`;
    if (!selectedCategory) return `FILTERING: ${base}`;
    return `FILTERING: ${base} / ${selectedCategory}`;
  }, [missingSection, selectedSectionId, selectedCategory, sections]);

  // Products CRUD handlers
  function openAddProduct() {
    setProductMode("create");
    setEditingProduct(null);
    setProductDialogOpen(true);
  }

  function openEditProduct(row: ProductRow) {
    setProductMode("edit");
    setEditingProduct(row);
    setProductDialogOpen(true);
  }

  async function handleDeleteProduct(row: ProductRow) {
    const ok = window.confirm(`Delete product #${row.Id_art}?`);
    if (!ok) return;

    try {
      await deleteProduct(row.Id_art);
      showSuccess("Product deleted.");
      await refreshProducts();
    } catch (e: any) {
      showError(e?.response?.data?.message || e.message || "Failed to delete product");
    }
  }

  async function handleSubmitProduct(payload: Partial<ProductRow>) {
    try {
      if (productMode === "create") {
        await createProduct(payload);
        showSuccess("Product created.");
      } else {
        if (!editingProduct) return;
        await updateProduct(editingProduct.Id_art, payload);
        showSuccess("Product updated.");
      }
      await refreshProducts();
    } catch (e: any) {
      showError(e?.response?.data?.message || e.message || "Failed to save product");
      throw e;
    }
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleExportSelected(rows: ProductRow[]) {
    if (rows.length === 0) return;

    setExporting(true);
    try {
      const payload = {
        mode: "selected",
        selectedIds: rows.map((r) => r.Id_art),
        fileName: "products_export.xlsx",
      };

      const blob = await exportProductsXlsx(payload);
      downloadBlob(blob, payload.fileName || "products_export.xlsx");

      showSuccess(`Exported ${rows.length} products.`);
    } catch (e: any) {
      showError(e?.response?.data?.message || e.message || "Export failed");
    } finally {
      setExporting(false);
    }
  }

  // Open the Export dialog (Export Filtered)
  function handleOpenExportDialog() {
    setExportOpen(true);
  }

  async function performExportWithFilters(payload: any) {
    setExporting(true);
    try {
      const blob = await exportProductsXlsx(payload);
      downloadBlob(blob, payload.fileName || "products_export.xlsx");
      showSuccess("Exported products by filters.");
    } catch (e: any) {
      showError(e?.response?.data?.message || e.message || "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
      <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
<ProductsTable
  data={products}
  loading={loading}
  total={total}
  page={page}
  totalPages={totalPages}
  q={q}
  limit={limit}
  selectedSectionLabel={filteringLabel}
  onQChange={(val) => {
    setPage(1);
    setQ(val);
  }}
  onLimitChange={(val) => {
    setPage(1);
    setLimit(val);
  }}
  onPageChange={(p) => setPage(p)}
  onOpenSectionFilter={() => setFilterOpen(true)}
  onOpenSectionManage={() => setManageOpen(true)}
  onAddProduct={openAddProduct}
  onEditProduct={openEditProduct}
  onDeleteProduct={handleDeleteProduct}
  onExportSelected={handleExportSelected}
  onExportWithFilters={handleOpenExportDialog}
/>

        <ExportDialog
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          sections={sections}
          departments={departments}
          isExporting={exporting}
          onConfirm={async (options: any) => {
            await performExportWithFilters(options);
          }}
        />
      </Box>

      {/* Section Filter */}
      <SectionFilterDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        sections={sections}
        loading={loading}
        selectedSectionId={selectedSectionId}
        selectedCategory={selectedCategory}
        sectionCategories={sectionCategories}
        missingSection={missingSection}
        onSelectSection={(id) => {
          setMissingSection(false);
          setSelectedSectionId(id);
          setSelectedCategory(null);
          setPage(1);
        }}
        onSelectCategory={(name) => {
          setSelectedCategory(name);
          setPage(1);
        }}
        onToggleMissingSection={(v) => {
          setMissingSection(v);
          if (v) {
            setSelectedSectionId(null);
            setSelectedCategory(null);
          }
          setPage(1);
        }}
      />

      {/* Section Manage */}
      <SectionManageDialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        sections={sections}
        onChanged={async () => {
          await refreshSections();
          await refreshProducts();
        }}
        onError={showError}
        onSuccess={showSuccess}
      />

      <ProductFormDialog
  open={productDialogOpen}
  onClose={() => setProductDialogOpen(false)}
  mode={productMode}
  sections={sections}
  departments={departments}   // ✅ add this
  initial={editingProduct}
  onSubmit={handleSubmitProduct}
/>

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast?.type ?? "success"}
          onClose={() => setToast(null)}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast?.msg ?? ""}
        </Alert>
      </Snackbar>
    </Box>
  );
} 
