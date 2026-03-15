import { ApiMeta } from "../api-meta";
import { ApiErrorResponse, ApiSuccessResponse } from "../api-response";
import { PaginationMeta } from "../pagination-meta";
import { buildPaginationMeta } from "./pagination.builder";

type MetaInput<TMeta extends ApiMeta> = Omit<Partial<TMeta>, "timestamp">;

export interface ResponseFactoryConfig {
  getTimestamp?: () => string;
}

export interface SuccessOptions<TMeta extends ApiMeta = ApiMeta> {
  message?: string;
  meta?: MetaInput<TMeta>;
  extractMeta?: MetaInput<TMeta>;
}

export interface ErrorPayload<
  TCode extends string = string,
  TDetails = unknown,
> {
  code: TCode;
  message: string;
  details?: TDetails;
}

export interface ErrorOptions<TMeta extends ApiMeta = ApiMeta> {
  meta?: MetaInput<TMeta>;
  extractMeta?: MetaInput<TMeta>;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
  message?: string;
  meta?: Omit<Partial<PaginationMeta>, "timestamp" | "pagination">;
  extractMeta?: Omit<Partial<PaginationMeta>, "timestamp" | "pagination">;
}

export interface ResponseFactory {
  ok<TData, TMeta extends ApiMeta = ApiMeta>(
    data: TData,
    options?: SuccessOptions<TMeta>,
  ): ApiSuccessResponse<TData, TMeta>;
  fail<
    TCode extends string = string,
    TDetails = unknown,
    TMeta extends ApiMeta = ApiMeta,
  >(
    error: ErrorPayload<TCode, TDetails>,
    options?: ErrorOptions<TMeta>,
  ): ApiErrorResponse<TCode, TDetails, TMeta>;
  paginated<TData>(
    data: TData[],
    options: PaginationOptions,
  ): ApiSuccessResponse<TData[], PaginationMeta>;
}

export function createResponseFactory(
  config: ResponseFactoryConfig = {},
): ResponseFactory {
  const getTimestamp = config.getTimestamp ?? (() => new Date().toISOString());

  function withMeta<TMeta extends ApiMeta>(
    meta?: MetaInput<TMeta>,
    extractMeta?: MetaInput<TMeta>,
  ): TMeta {
    return {
      timestamp: getTimestamp(),
      ...(extractMeta ?? {}),
      ...(meta ?? {}),
    } as TMeta;
  }

  return {
    ok<TData, TMeta extends ApiMeta = ApiMeta>(
      data: TData,
      options?: SuccessOptions<TMeta>,
    ): ApiSuccessResponse<TData, TMeta> {
      return {
        success: true,
        data,
        message: options?.message,
        meta: withMeta(options?.meta, options?.extractMeta),
      };
    },

    fail<
      TCode extends string = string,
      TDetails = unknown,
      TMeta extends ApiMeta = ApiMeta,
    >(
      error: ErrorPayload<TCode, TDetails>,
      options?: ErrorOptions<TMeta>,
    ): ApiErrorResponse<TCode, TDetails, TMeta> {
      return {
        success: false,
        error,
        meta: withMeta(options?.meta, options?.extractMeta),
      };
    },

    paginated<TData>(
      data: TData[],
      options: PaginationOptions,
    ): ApiSuccessResponse<TData[], PaginationMeta> {
      const pagination = buildPaginationMeta(
        options.page,
        options.limit,
        options.total,
      );

      return {
        success: true,
        data,
        message: options.message,
        meta: {
          timestamp: getTimestamp(),
          pagination,
          ...(options.extractMeta ?? {}),
          ...(options.meta ?? {}),
        },
      };
    },
  };
}

const responseFactory = createResponseFactory();

export const ok = responseFactory.ok;
export const fail = responseFactory.fail;
export const paginated = responseFactory.paginated;