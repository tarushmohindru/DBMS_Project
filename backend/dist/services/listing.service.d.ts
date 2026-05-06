import { CreateListingInput } from '../validators/listing.validator';
export declare function getActiveListings(): Promise<any[]>;
export declare function getAllListings(filters?: {
    status?: string;
    seller_id?: number;
}): Promise<any[]>;
export declare function getListingById(listing_id: number): Promise<any>;
export declare function createListing(seller_id: number, input: CreateListingInput): Promise<any>;
export declare function cancelListing(listing_id: number, seller_id: number): Promise<any>;
export declare function adminCancelListing(listing_id: number): Promise<any>;
export declare function getActiveListingsCursor(): Promise<any[]>;
//# sourceMappingURL=listing.service.d.ts.map