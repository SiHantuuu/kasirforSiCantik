'use client';

import { useState } from 'react';
import { SidebarNav } from '@/components/sidebar-nav';
import { CashierForm } from '@/components/cashier-form';
import { ProductManagement } from '@/components/product-management';
import { PaymentMethodManagement } from '@/components/payment-method-management';
import { TransactionHistory } from '@/components/transaction-history';

export function CashierDashboard() {
  const [activeTab, setActiveTab] = useState<string>('cashier');
  const handleTransactionAdded = () => {
    console.log('Transaction added!');
  };
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {activeTab === 'cashier' && (
          <CashierForm onTransactionAdded={handleTransactionAdded} />
        )}
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'payment-methods' && <PaymentMethodManagement />}
        {activeTab === 'history' && <TransactionHistory />}
      </div>
    </div>
  );
}
