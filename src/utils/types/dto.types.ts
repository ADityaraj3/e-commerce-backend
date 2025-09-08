export interface RequestInfinityScroll<
  T extends number | string | Date = number,
> {
  cursor: T | undefined;
  take: number | undefined;
}

export interface RequestPagination {
  take: number | undefined | null;
  page: number | undefined | null;
}

export enum OrderBy {
  DESC = 'desc',
  asc = 'asc',
}

export interface Pagination {
  list: Array<unknown>;
  paging: {
    totalRow?: number;
    currentPage: number;
    take: number;
  };
}

export interface InfinityPagination {
  list: Array<unknown>;
  paging: {
    totalRow?: number;
    cursor: unknown;
    take: number;
  };
}
