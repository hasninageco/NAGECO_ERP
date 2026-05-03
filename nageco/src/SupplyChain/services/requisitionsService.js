
import axios from "axios";
import { API_BASE, buildApiUrl } from "../../utils/api";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/* ================= LOOKUPS API ================= */

export const requisitionLookupsApi = {
  getUsers: async () => {
    const res = await axios.get(
      buildApiUrl("/requisition-lookups/users"),
      getAuthConfig()
    );
    return res.data;
  },

  getAdministrations: async () => {
    const res = await axios.get(
      buildApiUrl("/requisition-lookups/administrations"),
      getAuthConfig()
    );
    return res.data;
  },

  getSections: async () => {
    const res = await axios.get(
      buildApiUrl("/requisition-lookups/sections"),
      getAuthConfig()
    );
    return res.data;
  },

  getCategories: async (sectionId) => {
    const res = await axios.get(buildApiUrl("/requisition-lookups/categories"), {
      ...getAuthConfig(),
      params: { sectionId },
    });
    return res.data;
  },

  getProducts: async (params = {}) => {
    const res = await axios.get(buildApiUrl("/requisition-lookups/products"), {
      ...getAuthConfig(),
      params,
    });
    return res.data;
  },

  getAssets: async (params = {}) => {
    const res = await axios.get(buildApiUrl("/requisition-lookups/assets"), {
      ...getAuthConfig(),
      params,
    });
    return res.data;
  },

  getContracts: async (params = {}) => {
    const res = await axios.get(buildApiUrl("/requisition-lookups/contracts"), {
      ...getAuthConfig(),
      params,
    });
    return res.data;
  },

  getCurrentEmployee: async () => {
    const res = await axios.get(
      buildApiUrl("/requisition-lookups/current-employee"),
      getAuthConfig()
    );
    return res.data;
  },
};

/* ================= WORKFLOW API ================= */

export const requisitionWorkflowApi = {
  createDraft: async (payload) => {
    const res = await axios.post(
      buildApiUrl("/requisition-workflow/drafts"),
      payload,
      getAuthConfig()
    );
    return res.data;
  },

  getDraft: async (numBn) => {
    const res = await axios.get(
      buildApiUrl(`/requisition-workflow/drafts/${numBn}`),
      getAuthConfig()
    );
    return res.data;
  },

  updateHeader: async (numBn, payload) => {
    const res = await axios.put(
      buildApiUrl(`/requisition-workflow/drafts/${numBn}/header`),
      payload,
      getAuthConfig()
    );
    return res.data;
  },

  addItem: async (numBn, payload) => {
    const res = await axios.post(
      buildApiUrl(`/requisition-workflow/drafts/${numBn}/items`),
      payload,
      getAuthConfig()
    );
    return res.data;
  },

  updateItem: async (id, payload) => {
    const res = await axios.put(
      buildApiUrl(`/requisition-workflow/items/${id}`),
      payload,
      getAuthConfig()
    );
    return res.data;
  },

  deleteItem: async (id) => {
    const res = await axios.delete(
      buildApiUrl(`/requisition-workflow/items/${id}`),
      getAuthConfig()
    );
    return res.data;
  },

  submitDraft: async (numBn) => {
    const res = await axios.post(
      buildApiUrl(`/requisition-workflow/drafts/${numBn}/submit`),
      {},
      getAuthConfig()
    );
    return res.data;
  },

  duplicateDraft: async (numBn) => {
    const res = await axios.post(
      buildApiUrl(`/requisition-workflow/drafts/${numBn}/duplicate`),
      {},
      getAuthConfig()
    );
    return res.data;
  },

  duplicateItem: async (id) => {
    const res = await axios.post(
      buildApiUrl(`/requisition-workflow/items/${id}/duplicate`),
      {},
      getAuthConfig()
    );
    return res.data;
  },

  approveByCode: async (approvalId, payload) => {
    const res = await axios.post(
      buildApiUrl(`/requisition-workflow/management-approvals/${approvalId}/approve-by-code`),
      payload,
      getAuthConfig()
    );
    return res.data;
  },

  approveWarehouseByCode: async (approvalId, payload) => {
    const res = await axios.post(
      buildApiUrl(`/requisition-workflow/warehouse-approvals/${approvalId}/approve-by-code`),
      payload,
      getAuthConfig()
    );
    return res.data;
  },
};

/* ================= COMPATIBILITY EXPORTS ================= */
/* هذه حتى لا تتكسر الصفحات القديمة الحالية */

/* Lookups */
export const getUsers = () => requisitionLookupsApi.getUsers();
export const getAdministrations = () => requisitionLookupsApi.getAdministrations();
export const getSections = () => requisitionLookupsApi.getSections();
export const getCategories = (sectionId) => requisitionLookupsApi.getCategories(sectionId);
export const getContracts = (params = {}) => requisitionLookupsApi.getContracts(params);
export const getAssets = (params = {}) => requisitionLookupsApi.getAssets(params);
export const getArticles = (params = {}) => requisitionLookupsApi.getProducts(params);
export const getCurrentEmployee = () => requisitionLookupsApi.getCurrentEmployee();

/* القديم كان يسميها Articles لكنها الآن Products */

/* Workflow */
export const createDraft = (payload) => requisitionWorkflowApi.createDraft(payload);

/* القديم يسميها getRequisition لكنها الآن getDraft */
export const getRequisition = (numBn) => requisitionWorkflowApi.getDraft(numBn);

export const updateHeader = (numBn, payload) =>
  requisitionWorkflowApi.updateHeader(numBn, payload);

export const addItem = (numBn, payload) =>
  requisitionWorkflowApi.addItem(numBn, payload);

export const updateItem = (id, payload) =>
  requisitionWorkflowApi.updateItem(id, payload);

export const deleteItem = (id) =>
  requisitionWorkflowApi.deleteItem(id);

export const submitDraft = (numBn) =>
  requisitionWorkflowApi.submitDraft(numBn);

export const duplicateDraft = (numBn) =>
  requisitionWorkflowApi.duplicateDraft(numBn);

export const duplicateItem = (id) =>
  requisitionWorkflowApi.duplicateItem(id);

export const approveByCode = (approvalId, payload) =>
  requisitionWorkflowApi.approveByCode(approvalId, payload);

export const approveWarehouseByCode = (approvalId, payload) =>
  requisitionWorkflowApi.approveWarehouseByCode(approvalId, payload);