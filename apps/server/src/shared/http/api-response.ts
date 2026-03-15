import { ApiMeta } from "./api-meta";

export interface ApiSuccessResponse<TData, TMeta extends ApiMeta = ApiMeta> {
  success: true;
  data?: TData;
  message?: string;
  meta?: TMeta;
}

export interface ApiErrorResponse<
  TCode extends string = string,
  TDetails = unknown,
  TMeta extends ApiMeta = ApiMeta,
> {
  success: false;
  error?: {
    code: TCode;
    message: string;
    details?: TDetails;
  };
  meta?: TMeta;
}

export type ApiResponse<
  TData,
  TErrorCode extends string = string,
  TErrorDetails = unknown,
> = ApiSuccessResponse<TData> | ApiErrorResponse<TErrorCode, TErrorDetails>;
