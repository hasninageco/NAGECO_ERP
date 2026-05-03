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

export const getMyApprovals = async (query = {}) => {
  const res = await axios.get(
    `${API_BASE}/requisition-workflow/management-approvals/my-requests`,
    {
      ...getAuthConfig(),
      params: query,
    }
  );
  return res.data;
};

export const getManagementApprovalKpi = async () => {
  const res = await axios.get(
    `${API_BASE}/requisition-workflow/management-approvals/kpi`,
    getAuthConfig()
  );
  return res.data;
};

export const getApprovalDetails = async (approvalId) => {
  const res = await axios.get(
    `${API_BASE}/requisition-workflow/management-approvals/${approvalId}`,
    getAuthConfig()
  );
  return res.data;
};

export const approveRequest = async (approvalId, payload) => {
  const res = await axios.post(
    `${API_BASE}/requisition-workflow/management-approvals/${approvalId}/approve`,
    payload,
    getAuthConfig()
  );
  return res.data;
};

export const rejectRequest = async (approvalId, payload) => {
  const res = await axios.post(
    `${API_BASE}/requisition-workflow/management-approvals/${approvalId}/reject`,
    payload,
    getAuthConfig()
  );
  return res.data;
};
