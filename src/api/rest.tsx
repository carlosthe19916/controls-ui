import { AxiosPromise } from "axios";
import { APIClient } from "axios-config";

import { BusinessServicePage, PageQuery, SortByQuery } from "./models";

export const BASE_URL = "controls";
export const BUSINESS_SERVICES = BASE_URL + "/business-service";

const headers = { Accept: "application/hal+json" };

export const getBusinessServices = (
  filters: {
    filterText?: string;
  },
  pagination: PageQuery,
  sortBy?: SortByQuery
): AxiosPromise<BusinessServicePage> => {
  let sortByQuery: string | undefined = undefined;
  if (sortBy) {
    sortByQuery = `${sortBy.orderDirection === "desc" ? "-" : ""}${
      sortBy.orderBy
    }`;
  }

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

  return APIClient.get(`${BUSINESS_SERVICES}?${query.join("&")}`, { headers });
};

export const deleteBusinessService = (id: number): AxiosPromise => {
  return APIClient.delete(`${BUSINESS_SERVICES}/${id}`);
};
