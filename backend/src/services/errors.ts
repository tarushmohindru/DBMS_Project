// Maps PostgreSQL errors (standard codes + custom PL/pgSQL exceptions) to HTTP responses

export interface ApiError {
  status:  number;
  message: string;
  code:    string;
}

export function mapDbError(err: unknown): ApiError {
  const e = err as { code?: string; message?: string };
  const message = e.message || '';
  const pgCode  = e.code    || '';

  // Custom PL/pgSQL RAISE EXCEPTION (code P0001)
  if (pgCode === 'P0001') {
    if (message.includes('DUPLICATE_CREDIT_ISSUANCE')) {
      return { status: 409, message: 'Credits already issued for this production log',  code: 'DUPLICATE_CREDIT_ISSUANCE'    };
    }
    if (message.includes('INSUFFICIENT_WALLET_BALANCE')) {
      return { status: 400, message: 'Insufficient wallet balance to complete purchase', code: 'INSUFFICIENT_WALLET_BALANCE' };
    }
    if (message.includes('LOG_NOT_VERIFIED')) {
      return { status: 400, message: 'Production log has not been verified yet',         code: 'LOG_NOT_VERIFIED'            };
    }
    if (message.includes('SELF_PURCHASE_NOT_ALLOWED')) {
      return { status: 400, message: 'A company cannot purchase its own listings',       code: 'SELF_PURCHASE_NOT_ALLOWED'   };
    }
    if (message.includes('LISTING_NOT_ACTIVE')) {
      return { status: 400, message: 'Marketplace listing is sold or cancelled',         code: 'LISTING_NOT_ACTIVE'          };
    }
    if (message.includes('INSUFFICIENT_QUANTITY')) {
      return { status: 400, message: 'Requested quantity exceeds available quantity',    code: 'INSUFFICIENT_QUANTITY'       };
    }
    if (message.includes('WALLET_NOT_FOUND')) {
      return { status: 404, message: 'Company wallet not found',                         code: 'WALLET_NOT_FOUND'            };
    }
    if (message.includes('LOG_NOT_FOUND')) {
      return { status: 404, message: 'Record not found',                                 code: 'NOT_FOUND'                   };
    }
    return { status: 400, message: message, code: 'DB_PROCEDURE_ERROR' };
  }

  // Standard PostgreSQL error codes
  switch (pgCode) {
    case '23505': return { status: 409, message: 'Duplicate record detected',                code: 'UNIQUE_VIOLATION'     };
    case '23503': return { status: 400, message: 'Referenced record does not exist',         code: 'FK_VIOLATION'         };
    case '23514': return { status: 400, message: 'Value violates database constraint',       code: 'CHECK_VIOLATION'      };
    case '23502': return { status: 400, message: 'Required field cannot be null',            code: 'NOT_NULL_VIOLATION'   };
    case '22003': return { status: 400, message: 'Numeric value out of range',               code: 'NUMERIC_OVERFLOW'     };
    default:      return { status: 500, message: 'An internal database error occurred',      code: 'INTERNAL_ERROR'       };
  }
}
