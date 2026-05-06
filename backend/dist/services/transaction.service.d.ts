import { CreateTransactionInput } from '../validators/transaction.validator';
export declare function getAllTransactions(filters?: {
    buyer_id?: number;
    seller_id?: number;
    participant_id?: number;
}): Promise<any[]>;
export declare function getTransactionById(txn_id: number): Promise<any>;
export declare function executePurchase(buyer_id: number, input: CreateTransactionInput): Promise<any>;
//# sourceMappingURL=transaction.service.d.ts.map