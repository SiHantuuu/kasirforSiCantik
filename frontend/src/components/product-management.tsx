'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/services/api';
import { toast } from 'sonner';

export interface Product {
  id: string;
  nama_produk: string;
  harga: number;
  kategori: string;
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState<string>('makanan');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

const loadProducts = async () => {
  try {
    setIsLoading(true);
    const data = await fetchProducts();

    // Mapping data sebelum menyimpan ke state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedProductsData = data.map((product: any) => ({
      id: product._id,
      ...product, // Menyimpan properti lainnya
    }));

    setProducts(transformedProductsData);
  } catch (error) {
    toast.error('Gagal memuat data produk');
    console.error('Failed to fetch products:', error);
  } finally {
    setIsLoading(false);
  }
};


  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditMode(true);
      setCurrentProduct(product);
      setProductName(product.nama_produk);
      setProductPrice(product.harga.toString());
      setProductCategory(product.kategori);
    } else {
      setEditMode(false);
      setCurrentProduct(null);
      setProductName('');
      setProductPrice('');
      setProductCategory('makanan');
    }
    setOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productName || !productPrice) {
      toast.error('Mohon lengkapi semua data produk');
      return;
    }

    try {
      setIsLoading(true);

      if (editMode && currentProduct) {
        await updateProduct(currentProduct.id, {
          nama_produk: productName,
          harga: Number.parseFloat(productPrice),
          kategori: productCategory,
        });
        toast.success('Produk berhasil diperbarui');
      } else {
        await createProduct({
          nama_produk: productName,
          harga: Number.parseFloat(productPrice),
          kategori: productCategory,
        });
        toast.success('Produk baru berhasil ditambahkan');
      }

      // Reload products after create/update
      await loadProducts();
      setOpen(false);
      setProductName('');
      setProductPrice('');
    } catch (error) {
      toast.error(
        editMode ? 'Gagal memperbarui produk' : 'Gagal menambahkan produk'
      );
      console.error('Failed to save product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        setIsLoading(true);
        await deleteProduct(id);
        await loadProducts();
        toast.success('Produk berhasil dihapus');
      } catch (error) {
        toast.error('Gagal menghapus produk');
        console.error('Failed to delete product:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredProducts = products.filter((product) =>
    product.nama_produk.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-pink-700 flex items-center">
            <Heart className="mr-2 h-5 w-5 fill-pink-500 text-pink-500" />{' '}
            Manajemen Produk
          </h2>
          <p className="text-pink-600">
            Tambah, edit, atau hapus produk yang tersedia
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-pink-500 hover:bg-pink-600 text-white"
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="border-pink-200">
            <DialogHeader>
              <DialogTitle className="text-pink-700">
                {editMode ? 'Edit Produk' : 'Tambah Produk Baru'}
              </DialogTitle>
              <DialogDescription className="text-pink-600">
                {editMode
                  ? 'Ubah informasi produk yang sudah ada'
                  : 'Tambahkan produk baru ke dalam sistem'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product-name" className="text-pink-700">
                  Nama Produk
                </Label>
                <Input
                  id="product-name"
                  placeholder="Masukkan nama produk"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price" className="text-pink-700">
                  Harga (Rp)
                </Label>
                <Input
                  id="product-price"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Masukkan harga produk"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category" className="text-pink-700">
                  Kategori
                </Label>
                <Select
                  value={productCategory}
                  onValueChange={(value) => setProductCategory(value)}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    id="product-category"
                    className="border-pink-200 focus:ring-pink-400"
                  >
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="border-pink-200">
                    <SelectItem value="makanan">Makanan</SelectItem>
                    <SelectItem value="minuman">Minuman</SelectItem>
                  </SelectContent>
                </Select>
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
                onClick={handleSaveProduct}
                className="bg-pink-500 hover:bg-pink-600 text-white"
                disabled={isLoading}
              >
                {isLoading
                  ? 'Menyimpan...'
                  : editMode
                  ? 'Simpan Perubahan'
                  : 'Tambah Produk'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex mb-4">
        <Input
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm border-pink-200 focus:border-pink-400 focus:ring-pink-400"
        />
      </div>

      <Card className="pink-shadow border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-700">Daftar Produk</CardTitle>
          <CardDescription className="text-pink-600">
            {filteredProducts.length} produk tersedia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !open ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-pink-500">Memuat data produk...</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="rounded-md border border-pink-200">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b bg-pink-50">
                      <th className="p-2 text-left font-medium text-pink-700">
                        Nama Produk
                      </th>
                      <th className="p-2 text-left font-medium text-pink-700">
                        Kategori
                      </th>
                      <th className="p-2 text-left font-medium text-pink-700">
                        Harga
                      </th>
                      <th className="p-2 text-left font-medium text-pink-700">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b border-pink-100 hover:bg-pink-50/50"
                        >
                          <td className="p-2 text-pink-700">
                            {product.nama_produk}
                          </td>
                          <td className="p-2 text-pink-700">
                            {product.kategori === 'makanan'
                              ? 'Makanan'
                              : 'Minuman'}
                          </td>
                          <td className="p-2 text-pink-700">
                            Rp {product.harga.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(product)}
                                className="text-pink-700 hover:bg-pink-100 hover:text-pink-900"
                                disabled={isLoading}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteProduct(product.id)}
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
                          colSpan={4}
                          className="p-2 text-center text-pink-500"
                        >
                          {searchTerm
                            ? 'Tidak ada produk yang sesuai dengan pencarian'
                            : 'Belum ada produk tersedia'}
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
