export interface PageQuery {
  page: number;
  perPage: number;
}

export interface SortByQuery {
  orderBy: string | undefined;
  orderDirection: "asc" | "desc";
}

export interface PageRepresentation<T> {
  meta: Meta;
  data: T[];
}

export interface Meta {
  count: number;
}

export interface BusinessService {
  id: number;
  name: string;
  description?: string;
  owner: Owner;
}

export interface Owner {
  name: string;
  surname: string;
  email: string;
}

export interface BusinessServicePage {
  _embedded: {
    "business-service": BusinessService[];
  };
  total_count: number;
}
