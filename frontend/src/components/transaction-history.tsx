'use client';

import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { fetchTransactions, updateTransaction } from '@/services/api';

// Interface for the API response
interface ProductItem {
  produk: {
    _id: string;
    nama_produk: string;
    harga: number;
  };
  jumlah: number;
  _id: string;
}

interface PaymentMethod {
  _id: string;
  nama_pembayaran: string;
}

interface ApiTransaction {
  _id: string;
  tanggal: string;
  pembeli: string;
  tipe: 'langsung' | 'preorder';
  status: 'lunas' | 'pending';
  total: number;
  jenis_pembayaran: PaymentMethod;
  produk: ProductItem[];
  __v: number;
}

// Interface for the frontend transaction format
interface Transaction {
  id: string;
  date: string;
  customerName: string;
  deliveryType: 'pickup' | 'po';
  isPaid: boolean;
  total: number;
  paymentMethod: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        const data = await fetchTransactions();

        // Mapping untuk mengubah _id menjadi id dan sesuaikan format
        const formattedData = data.map(
          ({
            _id,
            tanggal,
            pembeli,
            tipe,
            status,
            total,
            jenis_pembayaran,
            produk,
          }: ApiTransaction) => ({
            id: _id,
            date: tanggal,
            customerName: pembeli || 'Umum',
            deliveryType: tipe === 'langsung' ? 'pickup' : 'po',
            isPaid: status === 'lunas',
            total,
            paymentMethod: jenis_pembayaran.nama_pembayaran,
            items: produk.map(({ produk, jumlah }) => ({
              id: produk._id,
              name: produk.nama_produk,
              price: produk.harga,
              quantity: jumlah,
            })),
          })
        );

        setTransactions(formattedData);
      } catch (err) {
        setError('Failed to load transactions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by search term
    const matchesSearch =
      transaction.customerName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.items.some((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Filter by type
    if (filterType === 'all') {
      return matchesSearch;
    } else if (filterType === 'today') {
      const today = new Date().toISOString().split('T')[0];
      const transactionDate = new Date(transaction.date)
        .toISOString()
        .split('T')[0];
      return matchesSearch && transactionDate === today;
    } else if (filterType === 'week') {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const transactionDate = new Date(transaction.date);
      return (
        matchesSearch && transactionDate >= lastWeek && transactionDate <= today
      );
    } else if (filterType === 'month') {
      const today = new Date();
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();
      const transactionDate = new Date(transaction.date);
      return (
        matchesSearch &&
        transactionDate.getMonth() === thisMonth &&
        transactionDate.getFullYear() === thisYear
      );
    }
    return matchesSearch;
  });

  const handlePaymentStatusChange = async (
    transaction: Transaction,
    isPaid: boolean
  ) => {
    try {
      // First, update the transaction in the API
      await updateTransaction(transaction.id, {
        status: isPaid ? 'lunas' : 'pending',
      });

      // If successful, update the local state
      const updatedTransactions = transactions.map((t) => {
        if (t.id === transaction.id) {
          return { ...t, isPaid };
        }
        return t;
      });

      setTransactions(updatedTransactions);

      // Update selected transaction if it's the one being modified
      if (selectedTransaction && selectedTransaction.id === transaction.id) {
        setSelectedTransaction({ ...selectedTransaction, isPaid });
      }
    } catch (err) {
      setError('Failed to update transaction status');
      console.error(err);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');

    // Judul dokumen
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Laporan Transaksi', doc.internal.pageSize.width / 2, 20, {
      align: 'center',
    });

    // Tanggal cetak
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`,
      doc.internal.pageSize.width / 2,
      28,
      { align: 'center' }
    );

    // Persiapkan data untuk tabel
    const tableData = filteredTransactions.map((transaction) => [
      transaction.id,
      formatDate(transaction.date),
      transaction.customerName || 'Umum',
      transaction.paymentMethod,
      transaction.deliveryType === 'pickup'
        ? 'Ambil Langsung'
        : 'Pre-Order (PO)',
      transaction.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar',
      `Rp ${transaction.total.toLocaleString('id-ID')}`,
      transaction.items
        .map((item) => `${item.name} (x${item.quantity})`)
        .join(', '), // Produk yang dibeli
    ]);

    // Tambahkan tabel dengan auto-formatting
    autoTable(doc, {
      startY: 35,
      head: [
        [
          'ID',
          'Tanggal',
          'Pembeli',
          'Metode',
          'Tipe',
          'Status',
          'Total',
          'Produk',
        ],
      ],
      body: tableData,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [255, 105, 180], // Warna pink sesuai tema
        textColor: 255,
      },
    });

    // Dapatkan posisi akhir tabel dengan cara yang benar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable.finalY;

    // Tambahkan ringkasan di bawah tabel
    const totalTransactions = filteredTransactions.length;
    const totalRevenue = filteredTransactions.reduce(
      (sum, t) => sum + t.total,
      0
    );

    doc.setFontSize(10);
    doc.text(`Total Transaksi: ${totalTransactions}`, 15, finalY + 10);
    doc.text(
      `Total Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}`,
      15,
      finalY + 20
    );

    // Simpan PDF
    doc.save('laporan-transaksi.pdf');
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Transaksi');

    // Tambahkan Header
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Pembeli', key: 'customerName', width: 20 },
      { header: 'Metode Pembayaran', key: 'paymentMethod', width: 20 },
      { header: 'Tipe Pengambilan', key: 'deliveryType', width: 20 },
      { header: 'Status Pembayaran', key: 'isPaid', width: 20 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Produk', key: 'products', width: 30 },
    ];

    // Tambahkan Data
    filteredTransactions.forEach((transaction) => {
      worksheet.addRow({
        id: transaction.id,
        date: formatDate(transaction.date),
        customerName: transaction.customerName || 'Umum',
        paymentMethod: transaction.paymentMethod,
        deliveryType:
          transaction.deliveryType === 'pickup'
            ? 'Ambil Langsung'
            : 'Pre-Order (PO)',
        isPaid: transaction.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar',
        total: `Rp ${transaction.total.toLocaleString('id-ID')}`,
        products: transaction.items
          .map((p) => `${p.name} (x${p.quantity})`)
          .join('; '),
      });
    });

    // Styling Header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    // Simpan file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, 'laporan-transaksi.xlsx');
  };

  if (loading) {
    return <div className="text-center p-8">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-pink-700 flex items-center">
          <Heart className="mr-2 h-5 w-5 fill-pink-500 text-pink-500" /> History
          Transaksi
        </h2>
        <p className="text-pink-600">Lihat dan export riwayat transaksi</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="space-y-2 flex-1">
          <Label htmlFor="search" className="text-pink-700">
            Cari Transaksi
          </Label>
          <Input
            id="search"
            placeholder="Cari berdasarkan nama pembeli atau produk"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
          />
        </div>
        <div className="space-y-2 w-full sm:w-[180px]">
          <Label htmlFor="filter" className="text-pink-700">
            Filter
          </Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger
              id="filter"
              className="border-pink-200 focus:ring-pink-400"
            >
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="border-pink-200">
              <SelectItem value="all">Semua Transaksi</SelectItem>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportToPDF}
            className="border-pink-200 text-pink-700 hover:bg-pink-100"
          >
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportToExcel}
            className="border-pink-200 text-pink-700 hover:bg-pink-100"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      <Card className="pink-shadow border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-700">Daftar Transaksi</CardTitle>
          <CardDescription className="text-pink-600">
            {filteredTransactions.length} transaksi ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="rounded-md border border-pink-200">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b bg-pink-50">
                    <th className="p-2 text-left font-medium text-pink-700">
                      ID
                    </th>
                    <th className="p-2 text-left font-medium text-pink-700">
                      Tanggal
                    </th>
                    <th className="p-2 text-left font-medium text-pink-700">
                      Pembeli
                    </th>
                    <th className="p-2 text-left font-medium text-pink-700">
                      Tipe
                    </th>
                    <th className="p-2 text-left font-medium text-pink-700">
                      Status
                    </th>
                    <th className="p-2 text-left font-medium text-pink-700">
                      Total
                    </th>
                    <th className="p-2 text-left font-medium text-pink-700">
                      Produk
                    </th>
                    <th className="p-2 text-left font-medium text-pink-700">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-pink-100 hover:bg-pink-50/50"
                      >
                        <td className="p-2 text-pink-700">{transaction.id}</td>
                        <td className="p-2 text-pink-700">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="p-2 text-pink-700">
                          {transaction.customerName}
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              transaction.deliveryType === 'pickup'
                                ? 'outline'
                                : 'secondary'
                            }
                            className="bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-200"
                          >
                            {transaction.deliveryType === 'pickup'
                              ? 'Langsung'
                              : 'PO'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {transaction.isPaid ? (
                            <Badge
                              variant="success"
                              className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                            >
                              Lunas
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                            >
                              Belum Bayar
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 text-pink-700">
                          Rp {transaction.total.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 text-pink-700 max-w-[200px] truncate">
                          {transaction.items
                            .map((item) => `${item.name} (x${item.quantity})`)
                            .join(', ')}
                        </td>
                        <td className="p-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setSelectedTransaction(transaction)
                                }
                                className="text-pink-700 hover:bg-pink-100 hover:text-pink-900"
                              >
                                Detail
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl border-pink-200">
                              <DialogHeader>
                                <DialogTitle className="text-pink-700">
                                  Detail Transaksi
                                </DialogTitle>
                                <DialogDescription className="text-pink-600">
                                  ID Transaksi: {selectedTransaction?.id}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedTransaction && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium text-pink-700">
                                        Informasi Transaksi
                                      </h4>
                                      <p className="text-pink-700">
                                        Tanggal:{' '}
                                        {formatDate(selectedTransaction.date)}
                                      </p>
                                      <p className="text-pink-700">
                                        Pembeli:{' '}
                                        {selectedTransaction.customerName}
                                      </p>
                                      {selectedTransaction.deliveryType ===
                                        'po' && (
                                        <div className="flex items-center space-x-2 mt-2">
                                          <Checkbox
                                            id="transaction-paid"
                                            checked={selectedTransaction.isPaid}
                                            onCheckedChange={(checked) =>
                                              handlePaymentStatusChange(
                                                selectedTransaction,
                                                checked === true
                                              )
                                            }
                                            className="border-pink-400 text-pink-500 focus:ring-pink-500"
                                          />
                                          <Label
                                            htmlFor="transaction-paid"
                                            className="text-pink-700"
                                          >
                                            Sudah Dibayar
                                          </Label>
                                        </div>
                                      )}
                                      <p className="text-pink-700">
                                        Metode Pembayaran:{' '}
                                        {selectedTransaction.paymentMethod}
                                      </p>
                                      <p className="text-pink-700">
                                        Tipe Pengambilan:{' '}
                                        {selectedTransaction.deliveryType ===
                                        'po'
                                          ? 'Pre-Order (PO)'
                                          : 'Ambil Langsung'}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <h4 className="font-medium text-pink-700">
                                        Total
                                      </h4>
                                      <p className="text-2xl font-bold text-pink-700">
                                        Rp{' '}
                                        {selectedTransaction.total.toLocaleString(
                                          'id-ID'
                                        )}
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 border-pink-200 text-pink-700 hover:bg-pink-100"
                                        onClick={() => {
                                          // Download individual receipt
                                          let content = 'BUKTI TRANSAKSI\n\n';
                                          content += `ID: ${selectedTransaction.id}\n`;
                                          content += `Tanggal: ${formatDate(
                                            selectedTransaction.date
                                          )}\n`;
                                          content += `Pembeli: ${selectedTransaction.customerName}\n`;
                                          content += `Metode Pembayaran: ${selectedTransaction.paymentMethod}\n`;
                                          content += `Tipe Pengambilan: ${
                                            selectedTransaction.deliveryType ===
                                            'pickup'
                                              ? 'Ambil Langsung'
                                              : 'Pre-Order (PO)'
                                          }\n`;
                                          content += `Status Pembayaran: ${
                                            selectedTransaction.isPaid
                                              ? 'Sudah Dibayar'
                                              : 'Belum Dibayar'
                                          }\n`;
                                          content += `\nItem yang dibeli:\n`;

                                          selectedTransaction.items.forEach(
                                            (item) => {
                                              content += `- ${item.name} (${
                                                item.quantity
                                              } x Rp ${item.price.toLocaleString(
                                                'id-ID'
                                              )}) = Rp ${(
                                                item.price * item.quantity
                                              ).toLocaleString('id-ID')}\n`;
                                            }
                                          );

                                          content += `\nTotal: Rp ${selectedTransaction.total.toLocaleString(
                                            'id-ID'
                                          )}\n`;

                                          const blob = new Blob([content], {
                                            type: 'text/plain',
                                          });
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `bukti-transaksi-${selectedTransaction.id}.txt`;
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                          URL.revokeObjectURL(url);
                                        }}
                                      >
                                        <Download className="mr-2 h-4 w-4" />{' '}
                                        Unduh Bukti
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2 text-pink-700">
                                      Daftar Item
                                    </h4>
                                    <div className="rounded-md border border-pink-200">
                                      <table className="w-full">
                                        <thead>
                                          <tr className="border-b bg-pink-50">
                                            <th className="p-2 text-left font-medium text-pink-700">
                                              Produk
                                            </th>
                                            <th className="p-2 text-left font-medium text-pink-700">
                                              Harga
                                            </th>
                                            <th className="p-2 text-left font-medium text-pink-700">
                                              Jumlah
                                            </th>
                                            <th className="p-2 text-left font-medium text-pink-700">
                                              Subtotal
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {selectedTransaction.items.map(
                                            (item, index) => (
                                              <tr
                                                key={index}
                                                className="border-b border-pink-100"
                                              >
                                                <td className="p-2 text-pink-700">
                                                  {item.name}
                                                </td>
                                                <td className="p-2 text-pink-700">
                                                  Rp{' '}
                                                  {item.price.toLocaleString(
                                                    'id-ID'
                                                  )}
                                                </td>
                                                <td className="p-2 text-pink-700">
                                                  {item.quantity}
                                                </td>
                                                <td className="p-2 text-pink-700">
                                                  Rp{' '}
                                                  {(
                                                    item.price * item.quantity
                                                  ).toLocaleString('id-ID')}
                                                </td>
                                              </tr>
                                            )
                                          )}
                                        </tbody>
                                        <tfoot>
                                          <tr className="border-t bg-pink-50">
                                            <td
                                              colSpan={3}
                                              className="p-2 text-right font-medium text-pink-700"
                                            >
                                              Total:
                                            </td>
                                            <td className="p-2 font-bold text-pink-700">
                                              Rp{' '}
                                              {selectedTransaction.total.toLocaleString(
                                                'id-ID'
                                              )}
                                            </td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-2 text-center text-pink-500">
                        Belum ada transaksi tersedia
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
