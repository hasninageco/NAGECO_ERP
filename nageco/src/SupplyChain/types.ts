// src/SupplyChain/types.ts

export type SectionRow = {
  ID_SECTION: number;
  DESIG: string | null;
  CODE_SECTION: string | null;
  Account: string | null;
  Debit_Account: string | null;
};

export type ProductRow = {
  Id_art: number;
  desig_art: string | null;
  BARCODE: string | null;
  Alternante_Code: string | null;
  ID_SECTION: number | null;
  product_category?: string | null;
  Place_item: string | null;
  SECT: string | null;
  Price: number | null;
  QTY_SECURIT: number | null;
  SCIENTIFIC_NAME: string | null;
  PREPARATEUR: number | null;
  Comment: string | null;
  Is_Verified: boolean | null;
  expir_date: string | null;
  SIZE_ART: string | null;
  contents: string | null;
  CLASSEMENT: string | null;
  CURRENCY: string | null;
  MANUFACRURE: string | null;
  COUNTRY: string | null;
  tt: string | null;
  day_expired: number | null;
  pharmacy: boolean | null;

  // included association from API (optional)
  section?: SectionRow | null;
};

export type ProductsResponse = {
  total: number;
  page: number;
  totalPages: number;
  data: ProductRow[];
};

export type CostCenterRow = {
  id_administratin: number;
  administration?: string | null;
  administration_ar?: string | null;
  Branche?: string | null;
};

export type SectionCategoryRow = {
  id: string;
  label: string;
  sectionId: number;
  isDefault?: boolean;
};

export type RequisitionReportRow = {
  num_bn: number;
  date_req: string | null;
  usr: number | null;
  requester_name: string | null;
  benefiary_depart: number | null;
  beneficiary_department_name: string | null;
  cost_center: string | null;
  branch: string | null;
  section_id: number | null;
  section_name: string | null;
  category: string | null;
  items_count: number;
  total_qty: number;
  requisition_status: string | null;
  manager_status: string;
  warehouse_status: string;
  is_urgent: boolean;
};

export type RequisitionReportSummary = {
  totalRequisitions: number;
  draftCount: number;
  submittedCount: number;
  inProgressCount: number;
  approvedCount: number;
  rejectedCount: number;
  pendingWarehouseCount: number;
  completedCount: number;
  pendingManagerCount?: number;
};

export type RequisitionReportsResponse = {
  summary: RequisitionReportSummary;
  rows: RequisitionReportRow[];
};

export type RequisitionReportDetailsItem = {
  ID_REQ: number;
  Req_item: string | null;
  product_id?: number | null;
  art: string | null;
  qty: number | null;
  unit: string | null;
  part_number: string | null;
  comment: string | null;
  comment_ar: string | null;
  barcode?: string | null;
  alternate_code?: string | null;
  storage_location?: string | null;
  manufacturer?: string | null;
  country?: string | null;
  category: string | null;
  section_id: number | null;
  section_code?: string | null;
  section_name: string | null;
};

export type RequisitionReportDetailsResponse = {
  header: {
    num_bn: number;
    date_req: string | null;
    usr: number | null;
    requester_name: string | null;
    requester_job_name?: string | null;
    benefiary_depart: number | null;
    beneficiary_department_name: string | null;
    cost_center: string | null;
    branch: string | null;
    requisition_status: string | null;
    manager_status: string;
    warehouse_status: string;
    is_approved_l2?: boolean | number | null;
    manager_approval_comment?: string | null;
    manager_approval_date?: string | null;
    state_receive?: boolean | number | null;
    received_qty?: number | null;
    date_received?: string | null;
    receive_comment?: string | null;
    warehouse_approvals_user?: string | null;
    is_urgent: boolean;
    title: string | null;
    reference: string | null;
    project: number | null;
    asset_id: number | null;
  };
  items: RequisitionReportDetailsItem[];
  statusSummary: {
    requisitionStatus: string;
    managerStatus: string;
    warehouseStatus: string;
  };
};
