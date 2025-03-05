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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Product } from '@/components/cashier-dashboard';

interface ProductManagementProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onAddProduct: (product: Product) => void;
}

export function ProductManagement({
  products,
  setProducts,
  onAddProduct,
}: ProductManagementProps) {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState<'makanan' | 'minuman'>(
    'makanan'
  );
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditMode(true);
      setCurrentProduct(product);
      setProductName(product.name);
      setProductPrice(product.price.toString());
      setProductCategory(product.category);
    } else {
      setEditMode(false);
      setCurrentProduct(null);
      setProductName('');
      setProductPrice('');
      setProductCategory('makanan');
    }
    setOpen(true);
  };

  const handleSaveProduct = () => {
    if (!productName || !productPrice) {
      alert('Mohon lengkapi semua data produk');
      return;
    }

    if (editMode && currentProduct) {
      const updatedProducts = products.map((p) =>
        p.id === currentProduct.id
          ? {
              ...p,
              name: productName,
              price: Number.parseFloat(productPrice),
              category: productCategory,
            }
          : p
      );
      setProducts(updatedProducts);
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: productName,
        price: Number.parseFloat(productPrice),
        category: productCategory,
      };
      onAddProduct(newProduct);
    }

    setOpen(false);
    setProductName('');
    setProductPrice('');
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category" className="text-pink-700">
                  Kategori
                </Label>
                <Select
                  value={productCategory}
                  onValueChange={(value: 'makanan' | 'minuman') =>
                    setProductCategory(value)
                  }
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
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveProduct}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                {editMode ? 'Simpan Perubahan' : 'Tambah Produk'}
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
                        <td className="p-2 text-pink-700">{product.name}</td>
                        <td className="p-2 text-pink-700">
                          {product.category === 'makanan'
                            ? 'Makanan'
                            : 'Minuman'}
                        </td>
                        <td className="p-2 text-pink-700">
                          Rp {product.price.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(product)}
                              className="text-pink-700 hover:bg-pink-100 hover:text-pink-900"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProduct(product.id)}
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
                      <td colSpan={4} className="p-2 text-center text-pink-500">
                        Belum ada produk tersedia
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
