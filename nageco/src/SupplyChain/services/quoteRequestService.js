import axios from "axios";
import { buildApiUrl } from "../../utils/api";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getSuppliers = async (q = "") => {
  const res = await axios.get(buildApiUrl("/quote-requests/suppliers"), {
    ...getAuthConfig(),
    params: {
      q: q || undefined,
    },
  });
  return res.data;
};

export const getReadyRequisitions = async (params = {}) => {
  const res = await axios.get(buildApiUrl("/quote-requests/ready-requisitions"), {
    ...getAuthConfig(),
    params: {
      requestNo: params?.requestNo || undefined,
      q: params?.q || undefined,
    },
  });
  return res.data;
};

export const getRequisitionItems = async (numBn, q = "") => {
  const res = await axios.get(
    buildApiUrl(`/quote-requests/from-requisition/${numBn}/items`),
    {
      ...getAuthConfig(),
      params: {
        q: q || undefined,
      },
    }
  );
  return res.data;
};

export const getQuoteRowsByRequisition = async (numBn, q = "") => {
  const res = await axios.get(
    buildApiUrl(`/quote-requests/from-requisition/${numBn}/quote-rows`),
    {
      ...getAuthConfig(),
      params: {
        q: q || undefined,
      },
    }
  );
  return res.data;
};

export const previewTransfer = async (
  numBn,
  supplierIds = [],
  selectedItemIds = []
) => {
  const res = await axios.post(
    buildApiUrl(`/quote-requests/from-requisition/${numBn}/preview`),
    {
      supplierIds,
      selectedItemIds,
    },
    getAuthConfig()
  );
  return res.data;
};

export const transferToQuoteRequest = async (
  numBn,
  supplierIds = [],
  options = {}
) => {
  const res = await axios.post(
    buildApiUrl(`/quote-requests/from-requisition/${numBn}/transfer`),
    {
      supplierIds,
      isLocal: !!options?.isLocal,
      selectedItemIds: Array.isArray(options?.selectedItemIds)
        ? options.selectedItemIds
        : [],
    },
    getAuthConfig()
  );
  return res.data;
};

export const updateQuoteRow = async (idQr, payload = {}) => {
  const res = await axios.patch(
    buildApiUrl(`/quote-requests/rows/${idQr}`),
    payload,
    getAuthConfig()
  );
  return res.data;
};

export const bulkUpdateQuoteRows = async (updates = []) => {
  const res = await axios.post(
    buildApiUrl(`/quote-requests/rows/bulk-update`),
    { updates },
    getAuthConfig()
  );
  return res.data;
};
