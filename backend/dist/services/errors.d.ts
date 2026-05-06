export interface ApiError {
    status: number;
    message: string;
    code: string;
}
export declare function mapDbError(err: unknown): ApiError;
//# sourceMappingURL=errors.d.ts.map