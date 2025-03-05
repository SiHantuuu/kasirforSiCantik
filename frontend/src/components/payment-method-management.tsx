'use client';

import type React from 'react';

import { useState } from 'react';
import { Edit, Plus, Trash, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PaymentMethod } from '@/components/cashier-dashboard';

interface PaymentMethodManagementProps {
  paymentMethods: PaymentMethod[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  onAddPaymentMethod: (paymentMethod: PaymentMethod) => void;
}

export function PaymentMethodManagement({
  paymentMethods,
  setPaymentMethods,
  onAddPaymentMethod,
}: PaymentMethodManagementProps) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [methodName, setMethodName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditMode(true);
      setCurrentMethod(method);
      setMethodName(method.name);
    } else {
      setEditMode(false);
      setCurrentMethod(null);
      setMethodName('');
    }
    setOpen(true);
  };

  const handleSaveMethod = () => {
    if (!methodName) {
      alert('Mohon masukkan nama metode pembayaran');
      return;
    }

    if (editMode && currentMethod) {
      const updatedMethods = paymentMethods.map((m) =>
        m.id === currentMethod.id ? { ...m, name: methodName } : m
      );
      setPaymentMethods(updatedMethods);
    } else {
      const newMethod: PaymentMethod = {
        id: Date.now().toString(),
        name: methodName,
      };
      onAddPaymentMethod(newMethod);
    }

    setOpen(false);
    setMethodName('');
  };

  const handleDeleteMethod = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini?')) {
      setPaymentMethods(paymentMethods.filter((m) => m.id !== id));
    }
  };

  const filteredMethods = paymentMethods.filter((method) =>
    method.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-pink-700 flex items-center">
            <Heart className="mr-2 h-5 w-5 fill-pink-500 text-pink-500" />{' '}
            Manajemen Metode Pembayaran
          </h2>
          <p className="text-pink-600">
            Tambah, edit, atau hapus metode pembayaran yang tersedia
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Metode Pembayaran
            </Button>
          </DialogTrigger>
          <DialogContent className="border-pink-200">
            <DialogHeader>
              <DialogTitle className="text-pink-700">
                {editMode
                  ? 'Edit Metode Pembayaran'
                  : 'Tambah Metode Pembayaran Baru'}
              </DialogTitle>
              <DialogDescription className="text-pink-600">
                {editMode
                  ? 'Ubah informasi metode pembayaran yang sudah ada'
                  : 'Tambahkan metode pembayaran baru ke dalam sistem'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="method-name" className="text-pink-700">
                  Nama Metode Pembayaran
                </Label>
                <Input
                  id="method-name"
                  placeholder="Contoh: Tunai, Transfer Bank, QRIS"
                  value={methodName}
                  onChange={(e) => setMethodName(e.target.value)}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-pink-200 text-pink-700 hover:bg-pink-100"
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveMethod}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                {editMode ? 'Simpan Perubahan' : 'Tambah Metode Pembayaran'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex mb-4">
        <Input
          placeholder="Cari metode pembayaran..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-pink-200 focus:border-pink-400 focus:ring-pink-400"
        />
      </div>

      <Card className="pink-shadow border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-700">
            Daftar Metode Pembayaran
          </CardTitle>
          <CardDescription className="text-pink-600">
            {filteredMethods.length} metode pembayaran tersedia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="rounded-md border border-pink-200">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b bg-pink-50">
                    <th className="p-2 text-left font-medium text-pink-700">
                      Nama Metode Pembayaran
                    </th>
                    <th className="p-2 text-left font-medium text-pink-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMethods.length > 0 ? (
                    filteredMethods.map((method) => (
                      <tr
                        key={method.id}
                        className="border-b border-pink-100 hover:bg-pink-50/50"
                      >
                        <td className="p-2 text-pink-700">{method.name}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(method)}
                              className="text-pink-700 hover:bg-pink-100 hover:text-pink-900"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMethod(method.id)}
                              className="text-pink-700 hover:bg-pink-100 hover:text-pink-900"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-2 text-center text-pink-500">
                        Belum ada metode pembayaran tersedia
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
