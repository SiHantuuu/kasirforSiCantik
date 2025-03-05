'use client';

import { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar-nav';
import { CashierForm } from '@/components/cashier-form';
import { ProductManagement } from '@/components/product-management';
import { PaymentMethodManagement } from '@/components/payment-method-management';
import { TransactionHistory } from '@/components/transaction-history';

export type Transaction = {
  id: string;
  customerName: string;
  paymentMethod: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  date: string;
  deliveryType: 'pickup' | 'po';
  isPaid: boolean;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  category: 'makanan' | 'minuman';
};

export type PaymentMethod = {
  id: string;
  name: string;
};

export function CashierDashboard() {
  const [activeTab, setActiveTab] = useState<string>('cashier');
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const storedProducts = localStorage.getItem('products');
    const storedPaymentMethods = localStorage.getItem('paymentMethods');
    const storedTransactions = localStorage.getItem('transactions');

    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedPaymentMethods)
      setPaymentMethods(JSON.parse(storedPaymentMethods));
    if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addProduct = (product: Product) => {
    setProducts([...products, product]);
  };

  const addPaymentMethod = (paymentMethod: PaymentMethod) => {
    setPaymentMethods([...paymentMethods, paymentMethod]);
  };

  const addTransaction = (transaction: Transaction) => {
    setTransactions([...transactions, transaction]);
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    const updatedTransactions = transactions.map((transaction) =>
      transaction.id === updatedTransaction.id
        ? updatedTransaction
        : transaction
    );
    setTransactions(updatedTransactions);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {activeTab === 'cashier' && (
          <CashierForm
            products={products}
            paymentMethods={paymentMethods}
            onAddTransaction={addTransaction}
            onAddProduct={addProduct}
            onAddPaymentMethod={addPaymentMethod}
          />
        )}
        {activeTab === 'products' && (
          <ProductManagement
            products={products}
            setProducts={setProducts}
            onAddProduct={addProduct}
          />
        )}
        {activeTab === 'payment-methods' && (
          <PaymentMethodManagement
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
            onAddPaymentMethod={addPaymentMethod}
          />
        )}
        {activeTab === 'history' && (
          <TransactionHistory
            transactions={transactions}
            onUpdateTransaction={updateTransaction}
          />
        )}
      </div>
    </div>
  );
}
