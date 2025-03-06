'use client';

import React, { useState, useEffect } from 'react';
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
import {
  fetchPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '@/services/api'; // Pastikan path import sudah benar

// Menyesuaikan interface dengan format API
export interface PaymentMethod {
  id: string;
  nama_pembayaran: string;
}

// Untuk kompatibilitas dengan komponen lain
interface DisplayPaymentMethod {
  id: string;
  name: string;
}

interface PaymentMethodManagementProps {
  onAddPaymentMethod?: (paymentMethod: DisplayPaymentMethod) => void;
}

export function PaymentMethodManagement({
  onAddPaymentMethod,
}: PaymentMethodManagementProps) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(
    null
  );
  const [methodName, setMethodName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mengambil data metode pembayaran saat komponen dimuat
 useEffect(() => {
   const loadPaymentMethods = async () => {
     setIsLoading(true);
     setError(null);
     try {
       const data = await fetchPaymentMethods();

       // Mapping untuk mengganti _id menjadi id
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const transformedPaymentMethods = data.map(({ _id, ...rest }: any) => ({
         id: _id,
         ...rest, // Menyimpan properti lainnya
       }));

       setPaymentMethods(transformedPaymentMethods);
     } catch (err) {
       setError('Gagal memuat metode pembayaran. Silakan coba lagi.');
       console.error('Error fetching payment methods:', err);
     } finally {
       setIsLoading(false);
     }
   };

   loadPaymentMethods();
 }, []);


  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditMode(true);
      setCurrentMethod(method);
      setMethodName(method.nama_pembayaran);
    } else {
      setEditMode(false);
      setCurrentMethod(null);
      setMethodName('');
    }
    setOpen(true);
  };

  const handleSaveMethod = async () => {
    if (!methodName) {
      alert('Mohon masukkan nama metode pembayaran');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (editMode && currentMethod) {
        // Update metode pembayaran yang sudah ada
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const updated = await updatePaymentMethod(currentMethod.id, {
          nama_pembayaran: methodName,
        });

        setPaymentMethods(
          paymentMethods.map((m) =>
            m.id === currentMethod.id
              ? { ...m, nama_pembayaran: methodName }
              : m
          )
        );
      } else {
        // Tambah metode pembayaran baru
        const newMethod = await createPaymentMethod({
          nama_pembayaran: methodName,
        });

        setPaymentMethods([...paymentMethods, newMethod]);

        // Jika prop onAddPaymentMethod tersedia, panggil dengan format yang sesuai
        if (onAddPaymentMethod) {
          onAddPaymentMethod({
            id: newMethod.id,
            name: newMethod.nama_pembayaran,
          });
        }
      }

      setOpen(false);
      setMethodName('');
    } catch (err) {
      setError(
        editMode
          ? 'Gagal mengupdate metode pembayaran. Silakan coba lagi.'
          : 'Gagal menambah metode pembayaran. Silakan coba lagi.'
      );
      console.error('Error saving payment method:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus metode pembayaran ini?')) {
      setIsLoading(true);
      setError(null);

      try {
        await deletePaymentMethod(id);
        setPaymentMethods(paymentMethods.filter((m) => m.id !== id));
      } catch (err) {
        setError('Gagal menghapus metode pembayaran. Silakan coba lagi.');
        console.error('Error deleting payment method:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredMethods = paymentMethods.filter((method) =>
    method.nama_pembayaran.toLowerCase().includes(searchTerm.toLowerCase())
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
              disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-pink-200 text-pink-700 hover:bg-pink-100"
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveMethod}
                className="bg-pink-500 hover:bg-pink-600 text-white"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Menyimpan...'
                  : editMode
                  ? 'Simpan Perubahan'
                  : 'Tambah Metode Pembayaran'}
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
          {error && <div className="text-red-500 mb-4">{error}</div>}

          {isLoading && !paymentMethods.length ? (
            <div className="text-center p-4">Memuat data...</div>
          ) : (
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
                          <td className="p-2 text-pink-700">
                            {method.nama_pembayaran}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(method)}
                                className="text-pink-700 hover:bg-pink-100 hover:text-pink-900"
                                disabled={isLoading}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMethod(method.id)}
                                className="text-pink-700 hover:bg-pink-100 hover:text-pink-900"
                                disabled={isLoading}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="p-2 text-center text-pink-500"
                        >
                          {searchTerm
                            ? 'Tidak ditemukan metode pembayaran yang sesuai'
                            : 'Belum ada metode pembayaran tersedia'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
