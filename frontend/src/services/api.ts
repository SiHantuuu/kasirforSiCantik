// services/api.ts
const BASE_URL = 'https://backend-kasirfor-si-cantik.vercel.app/';

// Payment Method API calls
export const fetchPaymentMethods = async () => {
  const response = await fetch(`${BASE_URL}/api/jenis-pembayaran`);
  if (!response.ok) {
    throw new Error('Failed to fetch payment methods');
  }
  return response.json();
};

export const createPaymentMethod = async (paymentMethod: {
  nama_pembayaran: string;
}) => {
  const response = await fetch(`${BASE_URL}/api/jenis-pembayaran`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentMethod),
  });
  if (!response.ok) {
    throw new Error('Failed to create payment method');
  }
  return response.json();
};

export const updatePaymentMethod = async (
  id: string,
  paymentMethod: { nama_pembayaran: string }
) => {
  const response = await fetch(`${BASE_URL}/api/jenis-pembayaran/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentMethod),
  });
  if (!response.ok) {
    throw new Error('Failed to update payment method');
  }
  return response.json();
};

export const deletePaymentMethod = async (id: string) => {
  const response = await fetch(`${BASE_URL}/api/jenis-pembayaran/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete payment method');
  }
  return response.json();
};

// Product API calls
export async function fetchProducts() {
  try {
    const response = await fetch(`${BASE_URL}/api/produk`);
    const data = await response.json();
    console.log('Data produk:', data);
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export const createProduct = async (product: {
  nama_produk: string;
  harga: number;
  kategori: string;
}) => {
  const response = await fetch(`${BASE_URL}/api/produk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(product),
  });
  if (!response.ok) {
    throw new Error('Failed to create product');
  }
  return response.json();
};

export const updateProduct = async (
  id: string,
  product: { nama_produk: string; harga: number; kategori: string }
) => {
  const response = await fetch(`${BASE_URL}/api/produk/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(product),
  });
  if (!response.ok) {
    throw new Error('Failed to update product');
  }
  return response.json();
};

export const deleteProduct = async (id: string) => {
  const response = await fetch(`${BASE_URL}/api/produk/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
  return response.json();
};

// Transaction API calls
export const fetchTransactions = async () => {
  const response = await fetch(`${BASE_URL}/api/transaksi`);
  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }
  return response.json();
};

export const createTransaction = async (transaction: {
  tanggal: string;
  tipe: 'langsung' | 'preorder';
  pembeli?: string;
  status: 'lunas' | 'pending';
  total: number;
  jenis_pembayaran_id: string;
  produk: { produk: string; jumlah: number }[];
}) => {
  const response = await fetch(`${BASE_URL}/api/transaksi`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });
  if (!response.ok) {
    throw new Error('Failed to create transaction');
  }
  return response.json();
};

export const updateTransaction = async (
  id: string,
  transaction: {
    status?: string;
    total?: number;
    jenis_pembayaran_id?: string;
  }
) => {
  const response = await fetch(`${BASE_URL}/api/transaksi/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });
  if (!response.ok) {
    throw new Error('Failed to update transaction');
  }
  return response.json();
};

export const deleteTransaction = async (id: string) => {
  const response = await fetch(`${BASE_URL}/api/transaksi/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete transaction');
  }
  return response.json();
};
