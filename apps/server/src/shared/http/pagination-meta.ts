import { ApiMeta } from "./api-meta";
import { PaginationOptions } from "./pagination";

export interface PaginationMeta extends ApiMeta {
  pagination: PaginationOptions;
}
