import axios from "axios";
import { buildApiUrl } from "../../utils/api";
import type {
  SectionRow,
  ProductsResponse,
  ProductRow,
  CostCenterRow,
  SectionCategoryRow,
  RequisitionReportsResponse,
  RequisitionReportDetailsResponse,
} from "../types";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---- Sections
export async function getSections(): Promise<SectionRow[]> {
  const res = await axios.get<SectionRow[]>(buildApiUrl("/sections/all"), {
    headers: authHeaders(),
  });
  return res.data;
}

export async function createSection(payload: Partial<SectionRow>) {
  const res = await axios.post(buildApiUrl("/sections/Add"), payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function updateSection(ID_SECTION: number, payload: Partial<SectionRow>) {
  const res = await axios.put(buildApiUrl(`/sections/Update/${ID_SECTION}`), payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function deleteSection(ID_SECTION: number) {
  const res = await axios.delete(buildApiUrl(`/sections/Delete/${ID_SECTION}`), {
    headers: authHeaders(),
  });
  return res.data;
}

// ---- Cost Centers (Departments)
export async function getCostCenters(): Promise<CostCenterRow[]> {
  // السيرفر عامل mount: app.use("/costCenters", crouter)
  // فالمتوقع فيه route زي /costCenters/all أو /costCenters
  // أنا حاطها /all، لو طلع عندك مختلف غيريها بس هنا.
  const res = await axios.get<CostCenterRow[]>(buildApiUrl("/costCenters/all"), {
    headers: authHeaders(),
  });
  return res.data;
}

// ---- Products list
export async function getProducts(params: {
  page?: number;
  limit?: number;
  q?: string;
  sectionId?: number | null;
  category?: string | null;
  missingSection?: boolean;
}): Promise<ProductsResponse> {
  const res = await axios.get<ProductsResponse>(buildApiUrl("/products/all"), {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      q: params.q || undefined,
      sectionId: params.sectionId ?? undefined,
      category: params.category ?? undefined,
      missingSection: params.missingSection ? 1 : undefined,
    },
    headers: authHeaders(),
  });
  return res.data;
}

// ---- Products CRUD
export async function createProduct(payload: Partial<ProductRow>) {
  const res = await axios.post(buildApiUrl("/products/Add"), payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function updateProduct(Id_art: number, payload: Partial<ProductRow>) {
  const res = await axios.put(buildApiUrl(`/products/Update/${Id_art}`), payload, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function deleteProduct(Id_art: number) {
  const res = await axios.delete(buildApiUrl(`/products/Delete/${Id_art}`), {
    headers: authHeaders(),
  });
  return res.data;
}

export async function exportProductsXlsx(payload: any) {
  const res = await axios.post(buildApiUrl("/products/export"), payload, {
    headers: {
      ...authHeaders(),
    },
    responseType: "blob",
  });
  return res.data;
}

export async function getSectionCategories(ID_SECTION: number): Promise<SectionCategoryRow[]> {
  const res = await axios.get<SectionCategoryRow[]>(buildApiUrl(`/sections/${ID_SECTION}/categories`), {
    headers: authHeaders(),
  });
  return res.data;
}

export async function addSectionCategory(ID_SECTION: number, name: string) {
  const res = await axios.post(
    buildApiUrl(`/sections/${ID_SECTION}/categories`),
    { name },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function deleteSectionCategory(ID_SECTION: number, name: string) {
  const res = await axios.delete(buildApiUrl(`/sections/${ID_SECTION}/categories`), {
    headers: authHeaders(),
    data: { name },
  });
  return res.data;
}

export async function getRequisitionReports(params: {
  dateFrom?: string;
  dateTo?: string;
  num_bn?: string | number;
  requisitionStatus?: string;
  managerStatus?: string;
  warehouseStatus?: string;
  sectionId?: number | null;
  category?: string | null;
  productId?: number | null;
  benefiaryDepart?: number | null;
  urgent?: boolean;
}): Promise<RequisitionReportsResponse> {
  const res = await axios.get<RequisitionReportsResponse>(buildApiUrl("/requisition-reports"), {
    params: {
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
      num_bn: params.num_bn || undefined,
      requisitionStatus: params.requisitionStatus || undefined,
      managerStatus: params.managerStatus || undefined,
      warehouseStatus: params.warehouseStatus || undefined,
      sectionId: params.sectionId ?? undefined,
      category: params.category ?? undefined,
      productId: params.productId ?? undefined,
      benefiaryDepart: params.benefiaryDepart ?? undefined,
      urgent: params.urgent ? 1 : undefined,
    },
    headers: authHeaders(),
  });
  return res.data;
}

export async function getRequisitionReportDetails(numBn: number): Promise<RequisitionReportDetailsResponse> {
  const res = await axios.get<RequisitionReportDetailsResponse>(
    buildApiUrl(`/requisition-reports/${numBn}`),
    { headers: authHeaders() }
  );
  return res.data;
}

export async function exportRequisitionReports(
  params: {
    dateFrom?: string;
    dateTo?: string;
    num_bn?: string | number;
    requisitionStatus?: string;
    managerStatus?: string;
    warehouseStatus?: string;
    sectionId?: number | null;
    category?: string | null;
    productId?: number | null;
    benefiaryDepart?: number | null;
    urgent?: boolean;
  },
  format: "csv" | "xlsx" = "xlsx"
) {
  const res = await axios.get(buildApiUrl("/requisition-reports/export"), {
    params: {
      format,
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
      num_bn: params.num_bn || undefined,
      requisitionStatus: params.requisitionStatus || undefined,
      managerStatus: params.managerStatus || undefined,
      warehouseStatus: params.warehouseStatus || undefined,
      sectionId: params.sectionId ?? undefined,
      category: params.category ?? undefined,
      productId: params.productId ?? undefined,
      benefiaryDepart: params.benefiaryDepart ?? undefined,
      urgent: params.urgent ? 1 : undefined,
    },
    headers: authHeaders(),
    responseType: "blob",
  });
  return res.data;
}