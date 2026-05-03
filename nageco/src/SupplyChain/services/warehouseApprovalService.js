import axios from "axios";

const API_BASE = "http://10.0.2.2:5000";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getMyWarehouseApprovals = async () => {
  const res = await axios.get(
    `${API_BASE}/requisition-workflow/warehouse-approvals/my-requests`,
    getAuthConfig()
  );
  return res.data;
};

export const getWarehouseApprovalKpi = async () => {
  const res = await axios.get(
    `${API_BASE}/requisition-workflow/warehouse-approvals/kpi`,
    getAuthConfig()
  );
  return res.data;
};

export const getWarehouseApprovalDetails = async (approvalId) => {
  const res = await axios.get(
    `${API_BASE}/requisition-workflow/warehouse-approvals/${approvalId}`,
    getAuthConfig()
  );
  return res.data;
};

export const approveWarehouseRequest = async (approvalId, payload) => {
  const res = await axios.post(
    `${API_BASE}/requisition-workflow/warehouse-approvals/${approvalId}/approve`,
    payload,
    getAuthConfig()
  );
  return res.data;
};

export const rejectWarehouseRequest = async (approvalId, payload) => {
  const res = await axios.post(
    `${API_BASE}/requisition-workflow/warehouse-approvals/${approvalId}/reject`,
    payload,
    getAuthConfig()
  );
  return res.data;
};

export const approveWarehouseByCode = async (approvalId, payload) => {
  const res = await axios.post(
    `${API_BASE}/requisition-workflow/warehouse-approvals/${approvalId}/approve-by-code`,
    payload,
    getAuthConfig()
  );
  return res.data;
};
