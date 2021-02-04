import { AxiosPromise } from "axios";
import { APIClient } from "axios-config";

import {
  BusinessService,
  BusinessServicePage,
  PageQuery,
  SortByQuery,
  StakeholderPage,
} from "./models";

export const BASE_URL = "controls";
export const BUSINESS_SERVICES = BASE_URL + "/business-service";
export const STAKEHOLDERS = BASE_URL + "/stakeholder";

const headers = { Accept: "application/hal+json" };

// Business services

export const getBusinessServices = (
  filters: {
    name?: string[];
    description?: string[];
    owner?: string[];
  },
  pagination: PageQuery,
  sortBy?: SortByQuery
): AxiosPromise<BusinessServicePage> => {
  let sortByQuery: string | undefined = undefined;
  // if (sortBy) {
  //   sortByQuery = `${sortBy.orderDirection === "desc" ? "-" : ""}${
  //     sortBy.orderBy
  //   }`;
  // }

  const query: string[] = [];

  //

  const params = {
    page: pagination.page - 1,
    size: pagination.perPage,
    sort: sortByQuery,
    name: filters.name,
    description: filters.description,
    "owner.displayName": filters.owner,
  };
  Object.keys(params).forEach((key) => {
    const value = (params as any)[key];

    if (value !== undefined && value !== null) {
      let queryParamValues: string[] = [];
      if (Array.isArray(value)) {
        queryParamValues = value;
      } else {
        queryParamValues = [value];
      }
      queryParamValues.forEach((v) => query.push(`${key}=${v}`));
    }
  });

  return APIClient.get(`${BUSINESS_SERVICES}?${query.join("&")}`, { headers });
};

export const deleteBusinessService = (id: number): AxiosPromise => {
  return APIClient.delete(`${BUSINESS_SERVICES}/${id}`);
};

export const createBusinessService = (
  obj: BusinessService
): AxiosPromise<BusinessService> => {
  return APIClient.post(`${BUSINESS_SERVICES}`, obj);
};

export const updateBusinessService = (
  obj: BusinessService
): AxiosPromise<BusinessService> => {
  return APIClient.put(`${BUSINESS_SERVICES}/${obj.id}`, obj);
};

// Stakeholders

export const getAllStakeholders = (): AxiosPromise<StakeholderPage> => {
  return APIClient.get(`${STAKEHOLDERS}?size=1000`, { headers });
};

export const getStakeholders = (
  filters: {
    filterText?: string;
  },
  pagination: PageQuery,
  sortBy?: SortByQuery
): AxiosPromise<StakeholderPage> => {
  let sortByQuery: string | undefined = undefined;
  // if (sortBy) {
  //   sortByQuery = `${sortBy.orderDirection === "desc" ? "-" : ""}${
  //     sortBy.orderBy
  //   }`;
  // }

  const query: string[] = [];

  //
  const params = {
    page: pagination.page - 1,
    size: pagination.perPage,
    sort: sortByQuery,
    filter: filters.filterText,
  };
  Object.keys(params).forEach((key) => {
    const value = (params as any)[key];
    if (value !== undefined) {
      query.push(`${key}=${value}`);
    }
  });

  return APIClient.get(`${STAKEHOLDERS}?${query.join("&")}`, { headers });
};
