import apiClient from "./apiClient";

export interface CompanyDTO {
  id?: string;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
}

export interface CompanyResponse {
  id: string;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
}

const COMPANY_BASE_URL = "/settings/company";

/**
 * Add a new company
 */
export const addCompany = async (companyData: CompanyDTO): Promise<CompanyResponse> => {
  // Don't send id field when creating a new company
  const { id, ...dataToSend } = companyData;
  console.log('CompanyService - Sending data to backend:', dataToSend);
  const response = await apiClient.post(`${COMPANY_BASE_URL}/add`, dataToSend);
  return response.data;
};

/**
 * Get all companies
 */
export const getAllCompanies = async (): Promise<CompanyResponse[]> => {
  console.log('Fetching all companies from:', `${COMPANY_BASE_URL}`);
  const response = await apiClient.get(COMPANY_BASE_URL, {
    params: { size: 1000 }
  });
  console.log('Companies fetched successfully:', response.data);

  // Backend returns paginated response with companies in data.content
  const companies = response.data?.data?.content || response.data?.content || response.data || [];
  console.log('Extracted companies array:', companies);

  return companies;
};

/**
 * Get company by ID
 */
export const getCompanyById = async (id: string): Promise<CompanyResponse> => {
  const response = await apiClient.get(`${COMPANY_BASE_URL}/${id}`);
  return response.data;
};

/**
 * Update company
 */
export const updateCompany = async (id: string, companyData: CompanyDTO): Promise<CompanyResponse> => {
  const response = await apiClient.put(`${COMPANY_BASE_URL}/${id}`, {
    id: id,
    name: companyData.name,
    address: companyData.address,
    email: companyData.email,
    phoneNumber: companyData.phoneNumber,
  });
  return response.data;
};

/**
 * Delete company
 */
export const deleteCompany = async (id: string): Promise<void> => {
  console.log('CompanyService - Deleting company ID:', id);
  await apiClient.delete(`${COMPANY_BASE_URL}/${id}`);
  console.log('Company deleted successfully');
};

/**
 * Search companies by name
 */
export const searchCompanies = async (query: string): Promise<CompanyResponse[]> => {
  console.log('Searching companies client-side with query:', query);
  const allCompanies = await getAllCompanies();

  if (!query) return allCompanies;

  const lowerQuery = query.toLowerCase();
  return allCompanies.filter(company =>
    company.name.toLowerCase().includes(lowerQuery) ||
    company.email.toLowerCase().includes(lowerQuery)
  );
};

export const companyService = {
  addCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  searchCompanies,
};
