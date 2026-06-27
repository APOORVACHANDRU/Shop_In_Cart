export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

export interface ProductForm {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
}

export interface PaginatedResponse {
  products: Product[];
  next_cursor: number | null;
  has_next: boolean;
}
