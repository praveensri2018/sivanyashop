export interface ShippingAddress {
  id?: number;
  userId?: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt?: string;
  
  // Add PascalCase properties to handle API response
  Id?: number;
  UserId?: number;
  AddressLine1?: string;
  AddressLine2?: string;
  City?: string;
  State?: string;
  PostalCode?: string;
  Country?: string;
  IsDefault?: boolean;
  CreatedAt?: string;
}