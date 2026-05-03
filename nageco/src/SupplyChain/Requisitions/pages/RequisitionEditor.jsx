import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import {
  requisitionLookupsApi,
  requisitionWorkflowApi,
} from "../../services/requisitionsService";

const today = new Date().toISOString().slice(0, 10);

const initialHeader = {
  date_req: today,
  usr: "",
  benefiary_depart: "",
  PROJECT: "",
  ASSET_ID: "",
  Crew: "",
  Is_urgent: false,
  Requestrefrence: "",
  Requisition_Title: "",
  Comment: "",
  Comment_ar: "",
  requisition_status: "",
  requisitionStatus: "",
  managerStatus: "",
  warehouseStatus: "",
  current_approval_id: null,
  current_approval_stage: "",
  current_approval_order: null,
  current_approval_status: "",
  current_approval_expires_at: null,
  current_approver_name: "",
  current_approver_email: "",
  is_owner: true,
  can_edit: true,
  cannot_edit_reason: "",
  is_draft: true,
};

const initialCurrentEmployee = {
  userId: "",
  refEmp: "",
  name: "",
  jobName: "",
  costCenter: "",
  city: "",
};

export default function RequisitionEditor() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const ui = useMemo(() => {
    return {
      pageBg: isDark ? "transparent" : "#f4f7fc",
      text: isDark ? "#ffffff" : "#0f172a",
      subText: isDark ? "rgba(255,255,255,0.75)" : "#1f2937",
      cardBg: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
      cardBorder: isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.3)",
      headerCardBg: isDark
        ? "rgba(59,130,246,0.08)"
        : "linear-gradient(180deg, rgba(219,234,254,0.82) 0%, rgba(255,255,255,1) 100%)",
      itemCardBg: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
      inputBg: isDark ? "#111111" : "#ffffff",
      inputText: isDark ? "#ffffff" : "#0f172a",
      inputBorder: isDark ? "rgba(255,255,255,0.22)" : "rgba(15,23,42,0.42)",
      tableBorder: isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.22)",
      buttonBg: isDark ? "rgba(255,255,255,0.08)" : "#dbe8fb",
      buttonText: isDark ? "#ffffff" : "#0b2544",
      successBg: isDark ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.12)",
      dangerBg: isDark ? "rgba(239,68,68,0.16)" : "rgba(239,68,68,0.10)",
      editBg: isDark ? "rgba(59,130,246,0.16)" : "rgba(59,130,246,0.10)",
      badgeBg: isDark ? "rgba(59,130,246,0.14)" : "rgba(59,130,246,0.08)",
      optionBg: isDark ? "#1b1b1b" : "#ffffff",
      optionText: isDark ? "#ffffff" : "#0f172a",
      disabledOpacity: 0.6,
    };
  }, [isDark]);

  const styles = {
    page: {
      padding: "6px clamp(10px, 1.9vw, 20px) 10px",
      color: ui.text,
      background: ui.pageBg,
      width: "100%",
      maxWidth: "none",
      margin: 0,
      boxSizing: "border-box",
    },
    card: {
      border: `1px solid ${ui.cardBorder}`,
      borderRadius: 12,
      padding: 10,
      marginBottom: 10,
      background: ui.cardBg,
      boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.16)" : "0 8px 20px rgba(15,23,42,0.11)",
    },
    headerCard: {
      border: `1px solid ${ui.cardBorder}`,
      borderRadius: 8,
      padding: 10,
      marginBottom: 0,
      height: "100%",
      background: ui.headerCardBg,
      boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.25)" : "0 10px 24px rgba(15,23,42,0.1)",
      display: "flex",
      flexDirection: "column",
    },
    toolbarLayout: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 10,
      alignItems: "flex-start",
      justifyContent: "flex-start",
    },
    requestActionsCard: {
      flex: "0 1 620px",
      minWidth: 430,
      maxWidth: 620,
      marginBottom: 0,
      padding: 10,
      border: isDark ? "1px solid rgba(96,165,250,0.34)" : "1px solid rgba(37,99,235,0.34)",
      background: isDark
        ? "linear-gradient(180deg, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0.06) 100%)"
        : "linear-gradient(180deg, rgba(191,219,254,0.55) 0%, rgba(239,246,255,0.95) 100%)",
      boxShadow: isDark ? "none" : "0 6px 16px rgba(29,78,216,0.08)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
    },
    statusAreaCard: {
      flex: "0 0 280px",
      width: 280,
      minHeight: 118,
      marginBottom: 0,
      padding: 7,
      border: isDark ? "1px solid rgba(16,185,129,0.34)" : "1px solid rgba(5,150,105,0.34)",
      background: isDark
        ? "linear-gradient(180deg, rgba(16,185,129,0.10) 0%, rgba(16,185,129,0.03) 100%)"
        : "linear-gradient(180deg, rgba(209,250,229,0.68) 0%, rgba(240,253,244,0.95) 100%)",
      boxShadow: isDark ? "none" : "0 6px 16px rgba(5,150,105,0.08)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
    },
    requestActionsTitle: {
      marginBottom: 6,
      fontSize: 12,
      fontWeight: 700,
      color: ui.text,
      letterSpacing: 0.2,
    },
    requestActionButtons: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      alignItems: "center",
    },
    headerStatusLayout: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
      gap: 8,
      marginBottom: 8,
      alignItems: "stretch",
    },
    statusTopStrip: {
      border: `1px solid ${ui.cardBorder}`,
      borderRadius: 8,
      padding: 3,
      marginBottom: 0,
      background: isDark ? ui.cardBg : "rgba(255,255,255,0.92)",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      alignItems: "flex-start",
      overflowX: "visible",
    },
    statusTopBadge: {
      borderRadius: 999,
      padding: "3px 7px",
      border: `1px solid ${ui.cardBorder}`,
      display: "flex",
      gap: 5,
      alignItems: "center",
    },
    statusTopLabel: {
      fontSize: 11,
      color: ui.subText,
      lineHeight: 1,
    },
    statusTopValue: {
      fontSize: 11,
      fontWeight: 700,
      color: ui.text,
      lineHeight: 1,
    },
    statusSideCard: {
      border: `1px solid ${ui.cardBorder}`,
      borderRadius: 8,
      padding: 10,
      background: isDark ? ui.cardBg : "#f8fbff",
    },
    statusSideTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: ui.subText,
      marginBottom: 8,
    },
    statusCompactList: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    statusCompactItem: {
      borderRadius: 6,
      border: `1px solid ${ui.cardBorder}`,
      padding: "6px 8px",
      background: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    statusCompactLabel: {
      fontSize: 11,
      color: ui.subText,
      lineHeight: 1.1,
    },
    statusCompactValue: {
      fontSize: 12,
      fontWeight: 700,
      color: ui.text,
      lineHeight: 1.1,
    },
    itemCard: {
      border: isDark
        ? "1px solid rgba(96,165,250,0.28)"
        : "1px solid rgba(37,99,235,0.35)",
      borderRadius: 9,
      padding: 3,
      marginBottom: 5,
      height: "100%",
      background: isDark
        ? "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)"
        : "linear-gradient(180deg, rgba(239,246,255,0.9) 0%, rgba(255,255,255,1) 100%)",
      boxShadow: isDark ? "0 6px 16px rgba(0,0,0,0.2)" : "0 8px 18px rgba(30,64,175,0.08)",
      display: "flex",
      flexDirection: "column",
    },
    sectionTitle: {
      marginBottom: 3,
      fontSize: 12,
      fontWeight: 700,
      color: ui.text,
      letterSpacing: 0.2,
    },
    headerTopRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 8,
      alignItems: "end",
    },
    headerGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
    },
    itemGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: 3,
      marginBottom: 1,
      alignItems: "end",
    },
    itemExtraGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: 3,
      marginBottom: 1,
      alignItems: "end",
    },
    itemSubSection: {
      border: `1px solid ${ui.cardBorder}`,
      borderRadius: 7,
      padding: 2,
      marginBottom: 2,
      background: isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.02)",
    },
    itemSubSectionTitle: {
      fontSize: 9.5,
      fontWeight: 700,
      color: ui.text,
      marginBottom: 1,
      letterSpacing: 0.15,
    },
    headerPrimaryActions: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 4,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    approvalActionRow: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 6,
      justifyContent: "flex-end",
    },
    fieldGroup: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
    },
    label: {
      fontSize: isDark ? 9 : 10,
      fontWeight: isDark ? 500 : 600,
      color: ui.subText,
    },
    input: {
      width: "100%",
      minHeight: 22,
      padding: "2px 5px",
      borderRadius: 6,
      border: `1px solid ${ui.inputBorder}`,
      background: ui.inputBg,
      color: ui.inputText,
      fontSize: isDark ? 10.5 : 11.5,
      outline: "none",
      boxSizing: "border-box",
    },
    reqNoBox: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    reqNoValue: {
      minHeight: 31,
      padding: "4px 7px",
      borderRadius: 6,
      border: `1px solid ${ui.inputBorder}`,
      background: ui.inputBg,
      color: ui.inputText,
      display: "flex",
      alignItems: "center",
    },
    checkboxWrap: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      minHeight: 31,
      fontSize: 11,
      color: ui.inputText,
    },
    actionsRow: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap",
      marginTop: 0,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    button: {
      padding: "5px 8px",
      borderRadius: 6,
      border: `1px solid ${ui.inputBorder}`,
      background: ui.buttonBg,
      color: ui.buttonText,
      fontSize: 11,
      lineHeight: 1.05,
      cursor: "pointer",
    },
    primaryButton: {
      padding: "5px 8px",
      borderRadius: 6,
      border: isDark ? "1px solid rgba(96,165,250,0.5)" : "1px solid rgba(37,99,235,0.5)",
      background: isDark ? "rgba(37,99,235,0.28)" : "rgba(37,99,235,0.12)",
      color: ui.buttonText,
      fontSize: 11,
      lineHeight: 1.05,
      cursor: "pointer",
    },
    successButton: {
      padding: "5px 8px",
      borderRadius: 6,
      border: `1px solid ${ui.inputBorder}`,
      background: ui.successBg,
      color: ui.buttonText,
      fontSize: 11,
      lineHeight: 1.05,
      cursor: "pointer",
    },
    dangerButton: {
      padding: "5px 8px",
      borderRadius: 6,
      border: `1px solid ${ui.inputBorder}`,
      background: ui.dangerBg,
      color: ui.buttonText,
      fontSize: 11,
      cursor: "pointer",
    },
    editButton: {
      padding: "5px 8px",
      borderRadius: 6,
      border: `1px solid ${ui.inputBorder}`,
      background: ui.editBg,
      color: ui.buttonText,
      fontSize: 11,
      cursor: "pointer",
    },
    editBadge: {
      marginBottom: 3,
      padding: "3px 5px",
      borderRadius: 6,
      border: `1px solid ${ui.inputBorder}`,
      background: ui.badgeBg,
      color: ui.text,
      fontSize: 10,
    },
    addItemButton: {
      padding: "3px 7px",
      borderRadius: 8,
      border: isDark ? "1px solid rgba(96,165,250,0.55)" : "1px solid rgba(37,99,235,0.55)",
      background: isDark
        ? "linear-gradient(180deg, rgba(37,99,235,0.4) 0%, rgba(37,99,235,0.25) 100%)"
        : "linear-gradient(180deg, rgba(37,99,235,0.2) 0%, rgba(37,99,235,0.12) 100%)",
      color: ui.buttonText,
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 10,
      lineHeight: 1.05,
      letterSpacing: 0.2,
    },
    statusGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(120px, 180px))",
      gap: 8,
      marginBottom: 10,
    },
    statusCard: {
      borderRadius: 8,
      padding: "8px 10px",
      border: `1px solid ${ui.cardBorder}`,
      background: isDark ? "rgba(255,255,255,0.02)" : "#f8fbff",
    },
    statusLabel: {
      fontSize: 11,
      color: ui.subText,
      marginBottom: 4,
    },
    statusValue: {
      fontSize: 13,
      fontWeight: 700,
      color: ui.text,
    },
    dropdownGroupTitle: {
      fontSize: 11,
      fontWeight: 700,
      color: ui.subText,
      padding: "6px 10px",
      borderBottom: `1px solid ${ui.tableBorder}`,
      background: isDark ? "rgba(255,255,255,0.05)" : "rgba(30,64,175,0.08)",
    },
    dropdownOptionWrap: {
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    dropdownOptionName: {
      fontSize: 13,
      fontWeight: 600,
      color: ui.optionText,
      lineHeight: 1.2,
    },
    dropdownOptionMeta: {
      fontSize: 10,
      color: ui.subText,
      lineHeight: 1.1,
      whiteSpace: "nowrap",
      border: `1px solid ${ui.inputBorder}`,
      borderRadius: 999,
      padding: "2px 6px",
    },
    tableWrap: {
      overflowX: "auto",
      maxHeight: 380,
      overflowY: "auto",
      border: `1px solid ${ui.tableBorder}`,
      borderRadius: 8,
      background: isDark ? "transparent" : "#ffffff",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      color: ui.text,
    },
    th: {
      textAlign: "left",
      padding: "6px 9px",
      borderBottom: `1px solid ${ui.tableBorder}`,
      fontWeight: 700,
      color: ui.text,
      fontSize: 12,
      position: "sticky",
      top: 0,
      background: ui.cardBg,
      zIndex: 1,
    },
    td: {
      padding: "8px 9px",
      borderBottom: `1px solid ${ui.tableBorder}`,
      verticalAlign: "top",
      color: ui.text,
      fontSize: 12,
    },
  };

  const [header, setHeader] = useState(initialHeader);
  const [numBn, setNumBn] = useState(null);
  const [items, setItems] = useState([]);

  const [currentEmployee, setCurrentEmployee] = useState(initialCurrentEmployee);

  const [administrations, setAdministrations] = useState([]);
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [contracts, setContracts] = useState([]);

  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemComment, setItemComment] = useState("");
  const [itemCommentAr, setItemCommentAr] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [searchNumBn, setSearchNumBn] = useState("");
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalCodeInput, setApprovalCodeInput] = useState("");
  const [approvalSubmitLoading, setApprovalSubmitLoading] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  const isSubmitted =
    String(header?.requisition_status || "").trim().toLowerCase() === "submitted" ||
    header?.is_draft === false;

  const isEditableByOwner = header?.can_edit !== false;
  const isRequester = header?.is_owner === true;
  const currentApprovalStatus = String(header?.current_approval_status || "")
    .trim()
    .toUpperCase();
  const currentApprovalStage = String(header?.current_approval_stage || "")
    .trim()
    .toUpperCase();
  const isCurrentWarehouseStage = currentApprovalStage === "WAREHOUSE";
  const isCurrentManagerStage =
    currentApprovalStage === "MANAGER" || currentApprovalStage === "";
  const hasPendingRequesterApproval =
    Boolean(header?.current_approval_id) && currentApprovalStatus === "PENDING";
  const approvalExpiry = header?.current_approval_expires_at
    ? new Date(header.current_approval_expires_at)
    : null;
  const isApprovalExpired = approvalExpiry ? approvalExpiry < new Date() : false;
  const canRequesterApproveByCode =
    isRequester &&
    hasPendingRequesterApproval &&
    !isApprovalExpired &&
    (isCurrentWarehouseStage || isCurrentManagerStage);

  const isHeaderLocked = !isEditableByOwner || items.length > 0 || isSubmitted;
  const isEverythingLocked = !isEditableByOwner || isSubmitted;

  const getSafeStatus = (value, fallback) => {
    return value && String(value).trim() ? String(value) : fallback;
  };

  const statusSummary = {
    requisition: getSafeStatus(
      header?.requisitionStatus || header?.requisition_status,
      "Draft"
    ),
    manager: getSafeStatus(header?.managerStatus, "Not Started"),
    warehouse: getSafeStatus(header?.warehouseStatus, "Not Started"),
  };

  const sectionNameById = useMemo(() => {
    const map = new Map();
    sections.forEach((section) => {
      map.set(String(section.id), section.label || `Section ${section.id}`);
    });
    return map;
  }, [sections]);

  const sectionCategoryOptions = useMemo(() => {
    const sectionOptions = sections.map((section) => ({
      key: `section-${section.id}`,
      type: "section",
      group: "Sections",
      sectionId: String(section.id),
      categoryId: "",
      label: section.label || `Section ${section.id}`,
      meta: "SECTION",
    }));

    const categoryOptions = categories.map((category) => ({
      key: `category-${selectedSectionId}-${category.id}`,
      type: "category",
      group: "Categories",
      sectionId: String(selectedSectionId),
      categoryId: String(category.id),
      label: category.label,
      meta: sectionNameById.get(String(selectedSectionId)) || "Section",
    }));

    return [...sectionOptions, ...categoryOptions];
  }, [sections, categories, selectedSectionId, sectionNameById]);

  const selectedSectionCategory = useMemo(() => {
    if (selectedCategory && selectedSectionId) {
      return (
        sectionCategoryOptions.find(
          (option) =>
            option.type === "category" &&
            option.sectionId === String(selectedSectionId) &&
            option.categoryId === String(selectedCategory)
        ) || null
      );
    }

    if (selectedSectionId) {
      return (
        sectionCategoryOptions.find(
          (option) => option.type === "section" && option.sectionId === String(selectedSectionId)
        ) || null
      );
    }

    return null;
  }, [sectionCategoryOptions, selectedSectionId, selectedCategory]);

  const requestedDepartmentLabel = useMemo(() => {
    const selected = administrations.find(
      (a) => String(a.id) === String(header.benefiary_depart)
    );
    if (!selected) return "";
    const name = selected?.name || selected?.label || "";
    return selected?.branch ? `${name} - ${selected.branch}` : name;
  }, [administrations, header.benefiary_depart]);

  const employeeCostCenterLabel = useMemo(() => {
    const centerId = header.Crew;
    if (!centerId) return "";

    const selected = administrations.find(
      (a) => String(a.id) === String(centerId)
    );

    if (!selected) return String(centerId);

    const name = selected?.name || selected?.label || "";
    return selected?.branch ? `${name} - ${selected.branch}` : name;
  }, [administrations, header.Crew]);

  const getStatusColors = (status) => {
    const normalized = String(status || "").trim().toLowerCase();

    const palette = {
      gray: {
        bg: isDark ? "rgba(148,163,184,0.18)" : "rgba(100,116,139,0.14)",
        border: isDark ? "rgba(148,163,184,0.38)" : "rgba(100,116,139,0.24)",
        text: ui.text,
      },
      blue: {
        bg: isDark ? "rgba(59,130,246,0.18)" : "rgba(59,130,246,0.12)",
        border: isDark ? "rgba(59,130,246,0.38)" : "rgba(59,130,246,0.24)",
        text: ui.text,
      },
      orange: {
        bg: isDark ? "rgba(249,115,22,0.22)" : "rgba(249,115,22,0.14)",
        border: isDark ? "rgba(249,115,22,0.4)" : "rgba(249,115,22,0.26)",
        text: ui.text,
      },
      green: {
        bg: isDark ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.12)",
        border: isDark ? "rgba(16,185,129,0.35)" : "rgba(16,185,129,0.25)",
        text: ui.text,
      },
      red: {
        bg: isDark ? "rgba(239,68,68,0.18)" : "rgba(239,68,68,0.12)",
        border: isDark ? "rgba(239,68,68,0.35)" : "rgba(239,68,68,0.25)",
        text: ui.text,
      },
      accent: {
        bg: isDark ? "rgba(20,184,166,0.2)" : "rgba(20,184,166,0.14)",
        border: isDark ? "rgba(20,184,166,0.38)" : "rgba(20,184,166,0.26)",
        text: ui.text,
      },
    };

    if (
      normalized === "approved" ||
      normalized === "completed" ||
      normalized === "warehouse approved" ||
      normalized === "manager approved" ||
      normalized === "ready for supplier offers"
    ) {
      return palette.green;
    }

    if (
      normalized === "rejected" ||
      normalized === "rejected by warehouse" ||
      normalized === "rejected by manager"
    ) {
      return palette.red;
    }

    if (normalized === "draft" || normalized === "not started") {
      return palette.gray;
    }

    if (normalized === "submitted") {
      return palette.blue;
    }

    if (
      normalized === "pending" ||
      normalized === "pending warehouse approval" ||
      normalized === "pending manager approval"
    ) {
      return palette.orange;
    }

    if (normalized === "in progress" || normalized === "inprogress") {
      return palette.accent;
    }

    return palette.gray;
  };

  const resetEditorForNewDraft = (draftNum) => {
    setNumBn(draftNum);
    setItems([]);
    setEditingItemId(null);
    setSelectedSectionId("");
    setSelectedCategory("");
    setSelectedProductId("");
    setCategories([]);
    setProducts([]);
    setItemQty("");
    setItemComment("");
    setItemCommentAr("");

    setHeader({
      ...initialHeader,
      date_req: today,
      usr: currentEmployee.userId || "",
      Crew: currentEmployee.costCenter || "",
      requisition_status: "draft",
      requisitionStatus: "Draft",
      managerStatus: "Not Started",
      warehouseStatus: "Not Started",
      is_draft: true,
    });
  };

  useEffect(() => {
    let isMounted = true;

    const loadLookups = async () => {
      try {
        const administrationsData = await requisitionLookupsApi.getAdministrations();
        if (isMounted) {
          setAdministrations(Array.isArray(administrationsData) ? administrationsData : []);
        }
      } catch (error) {
        console.error("getAdministrations error:", error);
        if (isMounted) setAdministrations([]);
      }

      try {
        const sectionsData = await requisitionLookupsApi.getSections();
        if (isMounted) {
          setSections(Array.isArray(sectionsData) ? sectionsData : []);
        }
      } catch (error) {
        console.error("getSections error:", error);
        if (isMounted) setSections([]);
      }

      try {
        const assetsData = await requisitionLookupsApi.getAssets();
        if (isMounted) {
          setAssets(Array.isArray(assetsData) ? assetsData : []);
        }
      } catch (error) {
        console.error("getAssets error:", error);
        if (isMounted) setAssets([]);
      }

      try {
        const contractsData = await requisitionLookupsApi.getContracts();
        if (isMounted) {
          setContracts(Array.isArray(contractsData) ? contractsData : []);
        }
      } catch (error) {
        console.error("getContracts error:", error);
        if (isMounted) setContracts([]);
      }

      try {
        const currentEmployeeData = await requisitionLookupsApi.getCurrentEmployee();
        const employeeData = currentEmployeeData || initialCurrentEmployee;

        if (isMounted) {
          setCurrentEmployee(employeeData);
          setHeader((prev) => ({
            ...prev,
            usr: prev.usr || employeeData.userId || "",
            Crew: prev.Crew || employeeData.costCenter || "",
          }));
        }
      } catch (error) {
        console.error("getCurrentEmployee error:", error);
        if (isMounted) {
          setCurrentEmployee(initialCurrentEmployee);
        }
      }
    };

    loadLookups();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      if (!selectedSectionId) {
        if (isMounted) {
          setCategories([]);
          setSelectedCategory("");
        }
        return;
      }

      try {
        const data = await requisitionLookupsApi.getCategories(selectedSectionId);
        if (isMounted) {
          setCategories(Array.isArray(data) ? data : []);
          setSelectedCategory("");
        }
      } catch (error) {
        console.error("loadCategories error:", error);
        if (isMounted) {
          setCategories([]);
          setSelectedCategory("");
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [selectedSectionId]);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      if (!selectedSectionId || !selectedCategory) {
        if (isMounted) setProducts([]);
        return;
      }

      try {
        const data = await requisitionLookupsApi.getProducts({
          sectionId: selectedSectionId,
          category: selectedCategory,
        });

        if (isMounted) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("loadProducts error:", error);
        if (isMounted) setProducts([]);
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [selectedSectionId, selectedCategory]);

  const clearItemForm = () => {
    setSelectedSectionId("");
    setSelectedCategory("");
    setSelectedProductId("");
    setCategories([]);
    setProducts([]);
    setItemQty("");
    setItemComment("");
    setItemCommentAr("");
    setEditingItemId(null);
    setHeader((prev) => ({
      ...prev,
      PROJECT: prev.PROJECT || "",
      ASSET_ID: prev.ASSET_ID || "",
    }));
  };

  const refreshDraft = async (draftNum = numBn) => {
    if (!draftNum) return;

    try {
      const data = await requisitionWorkflowApi.getDraft(draftNum);

      // console.log("Draft API response header:", data?.header);

      setHeader((prev) => ({
        ...prev,
        date_req: data?.header?.date_req
          ? String(data.header.date_req).slice(0, 10)
          : today,
        usr: currentEmployee?.userId || prev.usr || "",
        benefiary_depart: data?.header?.benefiary_depart ?? "",
        PROJECT: data?.header?.PROJECT ?? "",
        ASSET_ID: data?.header?.ASSET_ID ?? "",
        Crew:
          data?.header?.Crew !== undefined && data?.header?.Crew !== null
            ? data.header.Crew
            : prev.Crew || "",
        Is_urgent: !!data?.header?.Is_urgent,
        Requestrefrence: data?.header?.Requestrefrence || "",
        Requisition_Title: data?.header?.Requisition_Title || "",
        Comment: "",
        Comment_ar: "",

        requisition_status:
          data?.header?.requisition_status != null &&
          String(data.header.requisition_status).trim() !== ""
            ? data.header.requisition_status
            : "draft",

        is_draft:
          data?.header?.is_draft !== undefined && data?.header?.is_draft !== null
            ? data.header.is_draft
            : true,

        requisitionStatus:
          data?.header?.requisitionStatus && String(data.header.requisitionStatus).trim()
            ? data.header.requisitionStatus
            : "Draft",

        managerStatus:
          data?.header?.managerStatus && String(data.header.managerStatus).trim()
            ? data.header.managerStatus
            : "Not Started",

        warehouseStatus:
          data?.header?.warehouseStatus && String(data.header.warehouseStatus).trim()
            ? data.header.warehouseStatus
            : "Not Started",
        is_owner:
          data?.header?.is_owner !== undefined && data?.header?.is_owner !== null
            ? !!data.header.is_owner
            : true,
        can_edit:
          data?.header?.can_edit !== undefined && data?.header?.can_edit !== null
            ? !!data.header.can_edit
            : true,
        cannot_edit_reason: data?.header?.cannot_edit_reason || "",
        current_approval_id: data?.header?.current_approval_id || null,
        current_approval_stage: data?.header?.current_approval_stage || "",
        current_approval_order: data?.header?.current_approval_order || null,
        current_approval_status: data?.header?.current_approval_status || "",
        current_approval_expires_at: data?.header?.current_approval_expires_at || null,
        current_approver_name: data?.header?.current_approver_name || "",
        current_approver_email: data?.header?.current_approver_email || "",
      }));

      setItems(Array.isArray(data?.items) ? data.items : []);
      setNumBn(data?.header?.num_bn ?? draftNum);
    } catch (error) {
      console.error("refreshDraft error:", error);
      alert("Failed to load draft");
    }
  };

  const handleCreateDraft = async () => {
    try {
      const cleanPayload = {
        ...initialHeader,
        date_req: today,
        usr: currentEmployee.userId || "",
        Crew: currentEmployee.costCenter || "",
        Is_urgent: false,
        requisition_status: "draft",
        is_draft: true,
      };

      const result = await requisitionWorkflowApi.createDraft({
        ...cleanPayload,
      });

      resetEditorForNewDraft(result.num_bn);

      alert(`Draft created: ${result.num_bn}`);
      setSearchNumBn(String(result.num_bn));
      await refreshDraft(result.num_bn);
    } catch (error) {
      console.error("handleCreateDraft error:", error);
      alert(error?.response?.data?.message || "Failed to create draft");
    }
  };

  const handleSaveHeader = async () => {
    if (!numBn) {
      alert("Create draft first");
      return;
    }

    if (isHeaderLocked) {
      alert(header?.cannot_edit_reason || "Header is locked after adding the first item");
      return;
    }

    if (header.date_req !== today) {
      alert("Date must be today only");
      return;
    }

    try {
      await requisitionWorkflowApi.updateHeader(numBn, {
        ...header,
        usr: currentEmployee.userId || header.usr,
        Crew: currentEmployee.costCenter || header.Crew,
        date_req: today,
      });
      alert("Header saved");
      await refreshDraft();
    } catch (error) {
      console.error("handleSaveHeader error:", error);
      alert(error?.response?.data?.message || "Failed to save header");
    }
  };

  const handleEditItem = (item) => {
    if (isEverythingLocked) {
      alert(header?.cannot_edit_reason || "Submitted requisition cannot be modified");
      return;
    }

    setEditingItemId(item.ID_REQ);
    setSelectedProductId("");
    setSelectedSectionId("");
    setSelectedCategory("");
    setCategories([]);
    setProducts([]);
    setItemQty(item.qty ?? "");
    setItemComment(item.Comment || "");
    setItemCommentAr(item.Comment_ar || "");
  };

  const handleUpdateItem = async () => {
    if (isEverythingLocked) {
      alert(header?.cannot_edit_reason || "Submitted requisition cannot be modified");
      return;
    }

    if (!editingItemId) {
      alert("No item selected for editing");
      return;
    }

    if (!itemQty) {
      alert("Quantity is required");
      return;
    }

    if (!itemComment || !String(itemComment).trim()) {
      alert("Comment is required");
      return;
    }

    try {
      await requisitionWorkflowApi.updateItem(editingItemId, {
        qty: itemQty,
        Comment: itemComment,
        Comment_ar: itemCommentAr,
      });

      alert("Item updated successfully");
      clearItemForm();
      await refreshDraft();
    } catch (error) {
      console.error("handleUpdateItem error:", error);
      alert(error?.response?.data?.message || "Failed to update item");
    }
  };

  const handleAddItem = async () => {
    if (isEverythingLocked) {
      alert(header?.cannot_edit_reason || "Submitted requisition cannot be modified");
      return;
    }

    if (!numBn) {
      alert("Create draft first");
      return;
    }

    if (header.date_req !== today) {
      alert("Date must be today only");
      return;
    }

    if (!selectedProductId) {
      alert("Product is required");
      return;
    }

    if (!header.benefiary_depart) {
      alert("Beneficiary Department is required");
      return;
    }

    if (!selectedCategory) {
      alert("Category is required");
      return;
    }

    if (!itemQty || Number(itemQty) <= 0) {
      alert("Qty must be greater than 0");
      return;
    }

    if (!itemComment || !String(itemComment).trim()) {
      alert("Comment is required");
      return;
    }

    try {
      await requisitionWorkflowApi.addItem(numBn, {
        productId: selectedProductId,
        qty: itemQty,
        Comment: itemComment,
        Comment_ar: itemCommentAr,
        benefiary_depart: header.benefiary_depart,
        PROJECT: header.PROJECT,
        ASSET_ID: header.ASSET_ID,
      });

      clearItemForm();
      await refreshDraft();
    } catch (error) {
      console.error("handleAddItem error:", error);
      alert(error?.response?.data?.message || "Failed to add item");
    }
  };

  const handleDeleteItem = async (id) => {
    if (isEverythingLocked) {
      alert(header?.cannot_edit_reason || "Submitted requisition cannot be modified");
      return;
    }

    try {
      await requisitionWorkflowApi.deleteItem(id);

      if (editingItemId === id) {
        clearItemForm();
      }

      await refreshDraft();
    } catch (error) {
      console.error("handleDeleteItem error:", error);
      alert(error?.response?.data?.message || "Failed to delete item");
    }
  };

  const handleSubmit = async () => {
    if (!numBn) {
      alert("Create draft first");
      return;
    }

    if (isEverythingLocked) {
      alert(header?.cannot_edit_reason || "Requisition already submitted");
      return;
    }

    try {
      await requisitionWorkflowApi.submitDraft(numBn);
      alert("Request submitted successfully");
      await refreshDraft();
    } catch (error) {
      console.error("handleSubmit error:", error);
      alert(error?.response?.data?.message || "Failed to submit request");
    }
  };

  const handleOpenApprovalDialog = () => {
    setApprovalCodeInput("");
    setApprovalError("");
    setApprovalDialogOpen(true);
  };

  const handleCloseApprovalDialog = () => {
    if (approvalSubmitLoading) return;
    setApprovalDialogOpen(false);
    setApprovalCodeInput("");
    setApprovalError("");
  };

  const handleApproveByCode = async () => {
    if (!header?.current_approval_id) {
      setApprovalError("Pending approval reference is missing");
      return;
    }

    const code = String(approvalCodeInput || "").trim();
    if (!code) {
      setApprovalError("Approval code is required");
      return;
    }

    try {
      setApprovalSubmitLoading(true);
      setApprovalError("");

      if (isCurrentWarehouseStage) {
        await requisitionWorkflowApi.approveWarehouseByCode(header.current_approval_id, {
          approvalCode: code,
        });
      } else {
        await requisitionWorkflowApi.approveByCode(header.current_approval_id, {
          approvalCode: code,
        });
      }

      alert("Request approved successfully by passcode");
      setApprovalDialogOpen(false);
      setApprovalCodeInput("");
      await refreshDraft();
    } catch (error) {
      console.error("handleApproveByCode error:", error);
      setApprovalError(
        error?.response?.data?.message || "Failed to approve request by code"
      );
    } finally {
      setApprovalSubmitLoading(false);
    }
  };

  const handleLoadByNumber = async () => {
    const target = String(searchNumBn || "").trim();
    if (!target) {
      alert("Enter requisition number first");
      return;
    }

    await refreshDraft(target);
  };

  const handleDuplicateRequest = async () => {
    if (!numBn) {
      alert("Load or create requisition first");
      return;
    }

    try {
      const result = await requisitionWorkflowApi.duplicateDraft(numBn);
      const newNum = result?.num_bn;
      if (!newNum) {
        alert("Failed to duplicate requisition");
        return;
      }

      alert(`Requisition duplicated. New number: ${newNum}`);
      setSearchNumBn(String(newNum));
      await refreshDraft(newNum);
    } catch (error) {
      console.error("handleDuplicateRequest error:", error);
      alert(error?.response?.data?.message || "Failed to duplicate requisition");
    }
  };

  const handleDuplicateItem = async (id) => {
    if (isEverythingLocked) {
      alert(header?.cannot_edit_reason || "Submitted requisition cannot be modified");
      return;
    }

    try {
      await requisitionWorkflowApi.duplicateItem(id);
      alert("Item duplicated successfully");
      await refreshDraft();
    } catch (error) {
      console.error("handleDuplicateItem error:", error);
      alert(error?.response?.data?.message || "Failed to duplicate item");
    }
  };

  useEffect(() => {
    const targetNum = localStorage.getItem("requisitionEditorTargetNumBn");
    if (!targetNum) return;

    setSearchNumBn(String(targetNum));
    localStorage.removeItem("requisitionEditorTargetNumBn");
    refreshDraft(String(targetNum));
  }, []);

  return (
    <div style={styles.page} className="requisition-editor">
      <style>
        {`
          .requisition-editor .MuiInputBase-root {
            border-radius: 10px;
          }
          .requisition-editor .MuiOutlinedInput-root {
            border-radius: 10px;
            transition: box-shadow 120ms ease, border-color 120ms ease;
            background: ${isDark ? "transparent" : "#ffffff"};
          }
          .requisition-editor .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
            border-color: ${isDark ? "rgba(96,165,250,0.55)" : "rgba(37,99,235,0.5)"};
          }
          .requisition-editor .Mui-focused .MuiOutlinedInput-notchedOutline {
            border-color: ${isDark ? "rgba(96,165,250,0.9)" : "rgba(37,99,235,0.72)"} !important;
          }
          .requisition-editor .MuiAutocomplete-popper .MuiPaper-root {
            border-radius: 10px;
            border: 1px solid ${ui.inputBorder};
            background: ${ui.optionBg};
            color: ${ui.optionText};
            box-shadow: ${isDark ? "0 10px 24px rgba(0,0,0,0.35)" : "0 12px 28px rgba(15,23,42,0.16)"};
          }
          .requisition-editor .MuiAutocomplete-option[aria-selected="true"] {
            background: ${isDark ? "rgba(59,130,246,0.24)" : "rgba(37,99,235,0.14)"};
          }
          .requisition-editor .MuiFormHelperText-root {
            margin-top: 2px;
            margin-left: 2px;
            margin-right: 2px;
            line-height: 1.15;
            min-height: 0;
            font-size: 10px;
            color: ${isDark ? "rgba(255,255,255,0.74)" : "#475569"};
          }
          .requisition-editor .MuiInputBase-input,
          .requisition-editor .MuiSelect-select {
            color: ${isDark ? "#ffffff" : "#0f172a"};
          }
          .requisition-editor .MuiOutlinedInput-notchedOutline {
            border-color: ${isDark ? "rgba(255,255,255,0.22)" : "rgba(15,23,42,0.34)"};
            border-width: ${isDark ? "1px" : "1.2px"};
          }
          .requisition-editor .item-editor-card .MuiOutlinedInput-root.MuiInputBase-sizeSmall {
            min-height: 30px;
          }
          .requisition-editor .item-editor-card .MuiInputBase-input.MuiInputBase-inputSizeSmall {
            padding-top: 5px;
            padding-bottom: 5px;
            font-size: 10.5px;
            line-height: 1.15;
          }
          .requisition-editor .item-editor-card .MuiFormHelperText-root {
            margin-top: 1px;
            font-size: 8.5px;
          }
          .requisition-editor select option {
            background: ${ui.optionBg};
            color: ${ui.optionText};
          }
          .requisition-editor input::placeholder {
            color: ${ui.subText};
          }
          .requisition-editor input:focus {
            border-color: ${isDark ? "rgba(96,165,250,0.8)" : "rgba(59,130,246,0.65)"};
            box-shadow: 0 0 0 2px ${isDark ? "rgba(59,130,246,0.22)" : "rgba(59,130,246,0.18)"};
          }
          .requisition-editor .items-row {
            transition: background 120ms ease;
          }
          .requisition-editor .items-row:hover {
            background: ${isDark ? "rgba(59,130,246,0.12)" : "rgba(37,99,235,0.07)"} !important;
          }
          .requisition-editor thead th {
            background: ${isDark ? ui.cardBg : "#eef3fb"};
            color: ${isDark ? ui.text : "#0f172a"};
            border-bottom: 1px solid ${isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.22)"};
          }
        `}
      </style>

      <h2 style={{ marginTop: 0, marginBottom: 2, color: ui.text, fontSize: 19, lineHeight: 1.1 }}>
        Requisition Editor {numBn ? `- ${numBn}` : ""}
      </h2>
      <div style={{ fontSize: 11, color: ui.subText, marginBottom: 7 }}>
        Create, update, and submit requisitions with structured approval flow.
      </div>

      <div style={styles.toolbarLayout}>
      <div style={{ ...styles.card, ...styles.requestActionsCard }}>
        <div style={styles.requestActionsTitle}>Request Actions</div>

        <div style={styles.requestActionButtons}>
          <div style={{ ...styles.fieldGroup, minWidth: 150, maxWidth: 240, flex: "0 1 220px" }}>
            <label style={styles.label}>Find Requisition No</label>
            <TextField
              placeholder="Enter requisition number"
              size="small"
              value={searchNumBn}
              onChange={(e) => setSearchNumBn(e.target.value)}
            />
          </div>
          <button style={styles.primaryButton} onClick={handleLoadByNumber}>
            LOAD REQUEST
          </button>
          <button style={styles.button} onClick={handleDuplicateRequest}>
            DUPLICATE REQUEST
          </button>
          <button style={styles.successButton} onClick={handleCreateDraft}>
            NEW DRAFT
          </button>
        </div>
        <div style={{ marginTop: 6, fontSize: 10.5, color: ui.subText }}>
          Current Cost Center: {employeeCostCenterLabel || "Not detected"}
          {requestedDepartmentLabel ? ` | Beneficiary: ${requestedDepartmentLabel}` : ""}
        </div>
      </div>

      <div style={{ ...styles.card, ...styles.statusAreaCard }}>
        <div style={styles.requestActionsTitle}>Status Overview</div>
        <div style={{ ...styles.statusTopStrip, marginBottom: 0, border: "none", padding: 0 }}>
          {[
            { label: "Requisition", value: statusSummary.requisition },
            { label: "Direct Manager", value: statusSummary.manager },
            { label: "Warehouse", value: statusSummary.warehouse },
          ].map((item) => {
            const colors = getStatusColors(item.value);
            return (
              <div
                key={`top-${item.label}`}
                style={{
                  ...styles.statusTopBadge,
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <span style={styles.statusTopLabel}>{item.label}</span>
                <span style={{ ...styles.statusTopValue, color: colors.text }}>{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      <div style={styles.headerStatusLayout}>
      <div style={styles.headerCard}>
        <div style={{ ...styles.sectionTitle, marginBottom: 8, fontSize: 14 }}>Request Header</div>

        {isHeaderLocked && (
          <div style={styles.editBadge}>
            {header?.cannot_edit_reason || "Header is locked after adding the first item."}
          </div>
        )}

        <div style={styles.headerTopRow}>
          <div style={{ ...styles.reqNoBox, flex: "1 1 170px", minWidth: 125 }}>
            <label style={styles.label}>Request No</label>
            <div style={styles.reqNoValue}>{numBn || "Not created yet"}</div>
          </div>

          <div style={{ ...styles.fieldGroup, flex: "1 1 170px", minWidth: 135 }}>
            <label style={styles.label}>Request Date</label>
            <input
              style={styles.input}
              type="date"
              value={header.date_req}
              min={today}
              max={today}
              disabled={isHeaderLocked}
              onChange={(e) => setHeader({ ...header, date_req: e.target.value })}
            />
          </div>

          <div style={{ ...styles.fieldGroup, flex: "1 1 150px", minWidth: 102 }}>
            <label style={styles.label}>Is Urgent</label>
            <div style={styles.checkboxWrap}>
              <input
                type="checkbox"
                checked={header.Is_urgent}
                disabled={isHeaderLocked}
                onChange={(e) =>
                  setHeader({ ...header, Is_urgent: e.target.checked })
                }
              />
              <span>Urgent Request</span>
            </div>
          </div>
        </div>

        <div style={styles.headerGrid}>
          <div style={{ ...styles.fieldGroup, flex: "1 1 220px" }}>
            <label style={styles.label}>Request Reference</label>
            <input
              style={styles.input}
              placeholder="Request reference"
              value={header.Requestrefrence}
              disabled={isHeaderLocked}
              onChange={(e) =>
                setHeader({ ...header, Requestrefrence: e.target.value })
              }
            />
          </div>

          <div style={{ ...styles.fieldGroup, flex: "1.7 1 360px" }}>
            <label style={styles.label}>Requisition Title</label>
            <input
              style={styles.input}
              placeholder="Requisition title"
              value={header.Requisition_Title}
              disabled={isHeaderLocked}
              onChange={(e) =>
                setHeader({ ...header, Requisition_Title: e.target.value })
              }
            />
          </div>
        </div>

        <div style={styles.headerGrid}>
          <div style={{ ...styles.fieldGroup, flex: "1 1 100%" }}>
            <label style={styles.label}>Cost Center (Auto)</label>
            <input
              style={styles.input}
              value={employeeCostCenterLabel || "Not detected"}
              readOnly
              title={employeeCostCenterLabel || "Not detected"}
            />
          </div>
        </div>

        <div style={styles.headerPrimaryActions}>
          <button
            style={{
              ...styles.primaryButton,
              opacity: isHeaderLocked ? ui.disabledOpacity : 1,
              cursor: isHeaderLocked ? "not-allowed" : "pointer",
            }}
            onClick={handleSaveHeader}
            disabled={isHeaderLocked}
          >
            SAVE HEADER
          </button>

          <button
            style={{
              ...styles.successButton,
              opacity: isEverythingLocked ? ui.disabledOpacity : 1,
              cursor: isEverythingLocked ? "not-allowed" : "pointer",
            }}
            onClick={handleSubmit}
            disabled={isEverythingLocked}
          >
            SUBMIT REQUEST
          </button>
        </div>

        {canRequesterApproveByCode && (
          <div style={styles.approvalActionRow}>
            <button style={{ ...styles.primaryButton, padding: "6px 9px" }} onClick={handleOpenApprovalDialog}>
              ENTER {isCurrentWarehouseStage ? "WAREHOUSE" : "MANAGER"} CODE
            </button>
          </div>
        )}
      </div>

      <div className="item-editor-card" style={{ ...styles.itemCard, marginBottom: 0 }}>
        <div style={styles.sectionTitle}>Add / Edit Item</div>
        <div style={{ fontSize: 9.5, color: ui.subText, marginBottom: 2 }}>
          Select required fields, then add item details for this requisition.
        </div>

        {editingItemId && (
          <div style={styles.editBadge}>
            Editing item ID: {editingItemId}. Product cannot be changed in edit mode,
            only Qty / Comment / Comment Arabic.
          </div>
        )}

        {isEverythingLocked && (
          <div style={styles.editBadge}>
            Submitted requisition cannot be modified.
          </div>
        )}

        <div style={styles.itemSubSection}>
          <div style={styles.itemSubSectionTitle}>Item Selection</div>
          <div style={styles.itemGrid}>
            <div style={{ ...styles.fieldGroup, minWidth: 112, flex: "0.75 1 136px" }}>
              <label style={styles.label}>Section / Category</label>
              <Autocomplete
                options={sectionCategoryOptions}
                getOptionLabel={(option) => option?.label || ""}
                groupBy={(option) => option?.group || "Other"}
                value={selectedSectionCategory}
                onChange={(_, option) => {
                  if (!option) {
                    setSelectedSectionId("");
                    setSelectedCategory("");
                    setSelectedProductId("");
                    return;
                  }

                  if (option.type === "section") {
                    setSelectedSectionId(String(option.sectionId));
                    setSelectedCategory("");
                    setSelectedProductId("");
                    return;
                  }

                  setSelectedSectionId(String(option.sectionId));
                  setSelectedCategory(String(option.categoryId));
                  setSelectedProductId("");
                }}
                disabled={!!editingItemId || isEverythingLocked}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select section or category"
                    size="small"
                    helperText={
                      selectedSectionId && !selectedCategory
                        ? `Selected section: ${sectionNameById.get(String(selectedSectionId)) || "-"}`
                        : null
                    }
                  />
                )}
                renderGroup={(params) => (
                  <li key={params.key}>
                    <div style={styles.dropdownGroupTitle}>{params.group}</div>
                    <ul style={{ margin: 0, padding: 0 }}>{params.children}</ul>
                  </li>
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.key}>
                    <div style={styles.dropdownOptionWrap}>
                      <span style={styles.dropdownOptionName}>{option.label}</span>
                      <span style={styles.dropdownOptionMeta}>
                        {option.type === "section" ? "SECTION" : `IN ${option.meta}`}
                      </span>
                    </div>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.key === value.key}
              />
            </div>

            <div style={{ ...styles.fieldGroup, minWidth: 138, flex: "1 1 176px" }}>
              <label style={styles.label}>Product</label>
              <Autocomplete
                options={products}
                getOptionLabel={(option) =>
                  `${option?.label || ""}${option?.partNumber ? ` - ${option.partNumber}` : ""}`
                }
                value={products.find((p) => String(p.id) === String(selectedProductId)) || null}
                onChange={(_, value) => setSelectedProductId(value ? String(value.id) : "")}
                disabled={!selectedCategory || !!editingItemId || isEverythingLocked}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select product"
                    size="small"
                    helperText={!selectedCategory ? "Choose a category first" : null}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </div>

            <div style={{ ...styles.fieldGroup, minWidth: 72, maxWidth: 84, flex: "0 1 78px" }}>
              <label style={styles.label}>Qty</label>
              <input
                style={styles.input}
                type="number"
                placeholder="Qty"
                value={itemQty}
                disabled={isEverythingLocked}
                onChange={(e) => setItemQty(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={styles.itemSubSection}>
          <div style={styles.itemSubSectionTitle}>Item Details</div>
          <div style={styles.itemExtraGrid}>
            <div style={{ ...styles.fieldGroup, minWidth: 150, flex: "1 1 188px" }}>
              <label style={styles.label}>Comment</label>
              <input
                style={styles.input}
                placeholder="Comment"
                value={itemComment}
                disabled={isEverythingLocked}
                onChange={(e) => setItemComment(e.target.value)}
              />
            </div>

            <div style={{ ...styles.fieldGroup, minWidth: 150, flex: "1 1 188px" }}>
              <label style={styles.label}>Comment Arabic</label>
              <input
                style={styles.input}
                placeholder="Comment Arabic"
                value={itemCommentAr}
                disabled={isEverythingLocked}
                onChange={(e) => setItemCommentAr(e.target.value)}
              />
            </div>

            <div style={{ ...styles.fieldGroup, minWidth: 116, flex: "0.85 1 140px" }}>
              <label style={styles.label}>Beneficiary Department</label>
              <Autocomplete
                options={administrations}
                getOptionLabel={(option) => option?.label || ""}
                value={
                  administrations.find(
                    (a) => String(a.id) === String(header.benefiary_depart)
                  ) || null
                }
                onChange={(_, value) =>
                  setHeader({
                    ...header,
                    benefiary_depart: value ? String(value.id) : "",
                  })
                }
                disabled={isEverythingLocked || items.length > 0}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select beneficiary department"
                    size="small"
                    helperText={items.length > 0 ? "Department is locked after first item" : null}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </div>

            <div style={{ ...styles.fieldGroup, minWidth: 100, flex: "0.72 1 116px" }}>
              <label style={styles.label}>Asset</label>
              <Autocomplete
                options={assets}
                getOptionLabel={(option) => option?.label || ""}
                value={
                  assets.find((asset) => String(asset.id) === String(header.ASSET_ID)) ||
                  null
                }
                onChange={(_, value) =>
                  setHeader({ ...header, ASSET_ID: value ? String(value.id) : "" })
                }
                disabled={isEverythingLocked}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Select asset" size="small" />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </div>

            <div style={{ ...styles.fieldGroup, minWidth: 112, flex: "0.8 1 132px" }}>
              <label style={styles.label}>Project / Contract</label>
              <Autocomplete
                options={contracts}
                getOptionLabel={(option) => option?.label || ""}
                value={
                  contracts.find(
                    (contract) => String(contract.id) === String(header.PROJECT)
                  ) || null
                }
                onChange={(_, value) =>
                  setHeader({ ...header, PROJECT: value ? String(value.id) : "" })
                }
                disabled={isEverythingLocked}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Select contract / project" size="small" />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </div>
          </div>
        </div>

        <div style={styles.actionsRow}>
          {!editingItemId ? (
            <button
              style={{
                ...styles.addItemButton,
                opacity: isEverythingLocked ? ui.disabledOpacity : 1,
                cursor: isEverythingLocked ? "not-allowed" : "pointer",
              }}
              onClick={handleAddItem}
              disabled={isEverythingLocked}
            >
              + ADD ITEM
            </button>
          ) : (
            <>
              <button
                style={{
                  ...styles.successButton,
                  opacity: isEverythingLocked ? ui.disabledOpacity : 1,
                  cursor: isEverythingLocked ? "not-allowed" : "pointer",
                }}
                onClick={handleUpdateItem}
                disabled={isEverythingLocked}
              >
                UPDATE ITEM
              </button>
              <button style={styles.button} onClick={clearItemForm}>
                CANCEL EDIT
              </button>
            </>
          )}
        </div>
      </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Items</div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Req item</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Part number</th>
                <th style={styles.th}>Unit</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Comment</th>
                <th style={styles.th}>Comment ar</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td style={{ ...styles.td, textAlign: "center", color: ui.subText }} colSpan="8">
                    No items added yet. Start by selecting a product and clicking "Add Item".
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={item.ID_REQ}
                    className="items-row"
                    style={{
                      background:
                        idx % 2 === 0
                          ? "transparent"
                          : isDark
                            ? "rgba(255,255,255,0.015)"
                            : "rgba(15,23,42,0.02)",
                    }}
                  >
                    <td style={styles.td}>{item.Req_item}</td>
                    <td style={styles.td}>{item.art}</td>
                    <td style={styles.td}>{item.part_number}</td>
                    <td style={styles.td}>{item.unit}</td>
                    <td style={styles.td}>{item.qty}</td>
                    <td style={styles.td}>{item.Comment}</td>
                    <td style={styles.td}>{item.Comment_ar}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          style={{
                            ...styles.editButton,
                            opacity: isEverythingLocked ? ui.disabledOpacity : 1,
                            cursor: isEverythingLocked ? "not-allowed" : "pointer",
                          }}
                          onClick={() => handleEditItem(item)}
                          disabled={isEverythingLocked}
                        >
                          Edit
                        </button>
                        <button
                          style={{
                            ...styles.button,
                            opacity: isEverythingLocked ? ui.disabledOpacity : 1,
                            cursor: isEverythingLocked ? "not-allowed" : "pointer",
                          }}
                          onClick={() => handleDuplicateItem(item.ID_REQ)}
                          disabled={isEverythingLocked}
                        >
                          Duplicate
                        </button>
                        <button
                          style={{
                            ...styles.dangerButton,
                            opacity: isEverythingLocked ? ui.disabledOpacity : 1,
                            cursor: isEverythingLocked ? "not-allowed" : "pointer",
                          }}
                          onClick={() => handleDeleteItem(item.ID_REQ)}
                          disabled={isEverythingLocked}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={approvalDialogOpen}
        onClose={approvalSubmitLoading ? undefined : handleCloseApprovalDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Approve Request by Passcode</DialogTitle>
        <DialogContent>
          <div style={{ marginTop: 4, marginBottom: 12, fontSize: 13, color: ui.subText }}>
            Enter the passcode that was sent to your email to approve this requisition.
          </div>

          {approvalError ? (
            <Alert severity="error" style={{ marginBottom: 12 }}>
              {approvalError}
            </Alert>
          ) : null}

          <TextField
            label="Approval Code"
            value={approvalCodeInput}
            onChange={(e) => setApprovalCodeInput(e.target.value)}
            fullWidth
            autoFocus
            inputProps={{ maxLength: 20 }}
            disabled={approvalSubmitLoading}
          />
        </DialogContent>
        <DialogActions>
          <button
            style={styles.button}
            onClick={handleCloseApprovalDialog}
            disabled={approvalSubmitLoading}
          >
            CANCEL
          </button>
          <button
            style={{ ...styles.successButton, opacity: approvalSubmitLoading ? ui.disabledOpacity : 1 }}
            onClick={handleApproveByCode}
            disabled={approvalSubmitLoading}
          >
            {approvalSubmitLoading ? "APPROVING..." : "CONFIRM APPROVAL"}
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
