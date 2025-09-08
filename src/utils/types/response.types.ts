export interface ResponseObject<T> {
  success: boolean;
  error: string;
  message?: string;
  data?: T;
}

export type CommonResponse = ReturnType<typeof makeResponse>;
export function makeResponse<T>(arg: ResponseObject<T>) {
  return {
    success: arg.success,
    error: arg.error ?? '',
    message: arg.message ?? '',
    data: arg.data ?? {},
  };
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
