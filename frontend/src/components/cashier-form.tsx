'use client';

import { useState, useEffect } from 'react';
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash,
  Heart,
  CreditCard,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/components/product-management';
import type { PaymentMethod } from '@/components/payment-method-management';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
  fetchPaymentMethods,
  createPaymentMethod,
  fetchProducts,
  createProduct,
  createTransaction,
} from '@/services/api';
import { toast } from 'sonner';

interface CashierFormProps {
  onTransactionAdded: () => void;
}

export function CashierForm({ onTransactionAdded }: CashierFormProps) {
  // State for products and payment methods
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // State for form
  const [customerName, setCustomerName] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'po'>('pickup');
  const [isPaid, setIsPaid] = useState(true);
  const [cartItems, setCartItems] = useState<
    {
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'makanan' | 'minuman'
  >('all');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<
    'makanan' | 'minuman'
  >('makanan');
  const [newPaymentMethodName, setNewPaymentMethodName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products and payment methods on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [productsData, paymentMethodsData] = await Promise.all([
          fetchProducts(),
          fetchPaymentMethods(),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedProductsData = productsData.map((product: any) => ({
          id: product._id,
          ...product, // Menyimpan properti lainnya
        }));

        const transformedPaymentMethods = paymentMethodsData.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (method: any) => ({
            id: method._id, // Ambil nilai dari _id
            nama_pembayaran: method.nama_pembayaran,
          })
        );
        // Simpan data mentah langsung ke state
        setProducts(transformedProductsData);
        setPaymentMethods(transformedPaymentMethods);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        toast.error('Gagal memuat data. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleAddToCart = (product: Product) => {
    const existingItemIndex = cartItems.findIndex(
      (item) => item.productId === product.id
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
      setCartItems(updatedItems);
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: product.id,
          name: product.nama_produk,
          price: product.harga,
          quantity: 1,
        },
      ]);
    }
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedItems = [...cartItems];
    updatedItems[index].quantity = newQuantity;
    setCartItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...cartItems];
    updatedItems.splice(index, 1);
    setCartItems(updatedItems);
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmit = async () => {
    if (!selectedPaymentMethod || cartItems.length === 0) {
      toast.error('Mohon lengkapi semua data transaksi');
      return;
    }

    if (deliveryType === 'po' && !customerName) {
      toast.error('Mohon masukkan nama pembeli');
      return;
    }

    try {
      setIsLoading(true);

      // Format transaction data for API
      const transactionData: {
        tanggal: string;
        tipe: 'preorder' | 'langsung';
        pembeli?: string;
        status: 'lunas' | 'pending';
        total: number;
        jenis_pembayaran_id: string;
        produk: { produk: string; jumlah: number }[];
      } = {
        tanggal: new Date().toISOString(),
        tipe: deliveryType === 'po' ? 'preorder' : 'langsung',
        pembeli: deliveryType === 'po' ? customerName : 'Umum',
        status: isPaid ? 'lunas' : 'pending',
        total: calculateTotal(),
        jenis_pembayaran_id: selectedPaymentMethod,
        produk: cartItems.map((item) => ({
          produk: item.productId,
          jumlah: item.quantity,
        })),
      };

      // Send transaction to API
      await createTransaction(transactionData);

      // Reset form
      setCustomerName('');
      setSelectedPaymentMethod('');
      setDeliveryType('pickup');
      setIsPaid(true);
      setCartItems([]);
      setSearchTerm('');

      // Notify parent component that a transaction was added
      onTransactionAdded();

      toast.success('Transaksi berhasil disimpan!');
    } catch (error) {
      console.error('Failed to save transaction:', error);
      toast.error('Gagal menyimpan transaksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nama_produk
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' || product.kategori === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const makananProducts = filteredProducts.filter(
    (product) => product.kategori === 'makanan'
  );
  const minumanProducts = filteredProducts.filter(
    (product) => product.kategori === 'minuman'
  );

  const renderProductGrid = (products: Product[]) => {
    if (products.length === 0) {
      return (
        <div className="text-center py-8 text-pink-500">
          {products.length === 0
            ? 'Belum ada produk tersedia. Tambahkan produk terlebih dahulu.'
            : 'Tidak ada produk yang sesuai dengan pencarian.'}
        </div>
      );
    }

    return (
      <ScrollArea className="w-full pb-4">
        <div className="flex space-x-4 pb-4">
          {products.map((product) => {
            const inCart = cartItems.find(
              (item) => item.productId === product.id
            );

            return (
              <Card
                key={product.id}
                className={`cursor-pointer transition-all hover:shadow-md card-hover border-pink-200 min-w-[150px] sm:min-w-[180px] ${
                  inCart ? 'ring-2 ring-pink-500' : ''
                }`}
                onClick={() => handleAddToCart(product)}
              >
                <CardContent className="p-3">
                  <div className="text-center">
                    <p className="font-medium text-lg truncate text-pink-700">
                      {product.nama_produk}
                    </p>
                    <p className="text-base font-bold text-pink-600">
                      Rp {product.harga.toLocaleString('id-ID')}
                    </p>
                    {inCart && (
                      <div className="mt-1 bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mx-auto">
                        {inCart.quantity}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  };

  const handleAddProduct = async () => {
    if (!newProductName || !newProductPrice) {
      toast.error('Mohon lengkapi semua data produk');
      return;
    }

    try {
      setIsLoading(true);

      // Format product data for API
      const productData = {
        nama_produk: newProductName,
        harga: Number.parseFloat(newProductPrice),
        kategori: newProductCategory,
      };

      // Send product to API
      const newProduct = await createProduct(productData);

      // Add new product to local state
      setProducts([
        ...products,
        {
          id: newProduct.id,
          nama_produk: newProduct.nama_produk,
          harga: newProduct.harga,
          kategori: newProduct.kategori,
        },
      ]);

      setProductDialogOpen(false);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductCategory('makanan');

      toast.success('Produk berhasil ditambahkan!');
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Gagal menambahkan produk. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethodName) {
      toast.error('Mohon masukkan nama metode pembayaran');
      return;
    }

    try {
      setIsLoading(true);

      // Format payment method data for API
      const paymentMethodData = {
        nama_pembayaran: newPaymentMethodName,
      };

      // Send payment method to API
      const newMethod = await createPaymentMethod(paymentMethodData);

      // Add new payment method to local state
      setPaymentMethods([
        ...paymentMethods,
        {
          id: newMethod.id,
          nama_pembayaran: newMethod.nama_pembayaran,
        },
      ]);

      setPaymentMethodDialogOpen(false);
      setNewPaymentMethodName('');

      toast.success('Metode pembayaran berhasil ditambahkan!');
    } catch (error) {
      console.error('Failed to create payment method:', error);
      toast.error('Gagal menambahkan metode pembayaran. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-pink-700 flex items-center">
          <Heart className="mr-2 h-5 w-5 fill-pink-500 text-pink-500" /> Kasir
        </h2>
        <p className="text-pink-600">
          Catat pembelian dengan mengisi form di bawah ini
        </p>
      </div>

      {/* Informasi Pembeli Card */}
      <Card className="pink-shadow border-pink-200 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <div className="w-full h-full bg-pink-300 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <CardHeader className="relative">
          <CardTitle className="text-pink-700">Informasi Pembeli</CardTitle>
          <CardDescription className="text-pink-600">
            Masukkan data pembeli dan metode pembayaran
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="isPO"
                checked={deliveryType === 'po'}
                onCheckedChange={(checked) => {
                  setDeliveryType(checked ? 'po' : 'pickup');
                }}
                className="border-pink-400 text-pink-500 focus:ring-pink-500"
              />
              <Label htmlFor="isPO" className="cursor-pointer text-pink-700">
                Pre-Order (PO)
              </Label>
            </div>

            {deliveryType === 'po' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name" className="text-pink-700">
                    Nama Pembeli
                  </Label>
                  <Input
                    id="customer-name"
                    placeholder="Masukkan nama pembeli"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                  />
                </div>
                <div className="flex items-center space-x-2 self-end">
                  <Checkbox
                    id="isPaid"
                    checked={isPaid}
                    onCheckedChange={(checked) => setIsPaid(checked === true)}
                    className="border-pink-400 text-pink-500 focus:ring-pink-500"
                  />
                  <Label
                    htmlFor="isPaid"
                    className="cursor-pointer text-pink-700"
                  >
                    Sudah Dibayar
                  </Label>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="payment-method" className="text-pink-700">
                Metode Pembayaran
              </Label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
              >
                <SelectTrigger
                  id="payment-method"
                  className="border-pink-200 focus:ring-pink-400"
                >
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent className="border-pink-200">
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.nama_pembayaran}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Belum ada metode pembayaran
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produk Card */}
      <Card className="pink-shadow border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-700">Pilih Produk</CardTitle>
          <CardDescription className="text-pink-600">
            Klik produk untuk menambahkan ke keranjang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
            />
          </div>

          <Tabs
            defaultValue="all"
            onValueChange={(value) =>
              setActiveCategory(value as 'all' | 'makanan' | 'minuman')
            }
            className="w-full"
          >
            <TabsList className="mb-4 bg-pink-100 p-1">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-white data-[state=active]:text-pink-700"
              >
                Semua
              </TabsTrigger>
              <TabsTrigger
                value="makanan"
                className="data-[state=active]:bg-white data-[state=active]:text-pink-700"
              >
                Makanan
              </TabsTrigger>
              <TabsTrigger
                value="minuman"
                className="data-[state=active]:bg-white data-[state=active]:text-pink-700"
              >
                Minuman
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {isLoading ? (
                <div className="text-center py-8 text-pink-500">
                  Memuat produk...
                </div>
              ) : (
                renderProductGrid(filteredProducts)
              )}
            </TabsContent>

            <TabsContent value="makanan">
              {isLoading ? (
                <div className="text-center py-8 text-pink-500">
                  Memuat produk...
                </div>
              ) : (
                renderProductGrid(makananProducts)
              )}
            </TabsContent>

            <TabsContent value="minuman">
              {isLoading ? (
                <div className="text-center py-8 text-pink-500">
                  Memuat produk...
                </div>
              ) : (
                renderProductGrid(minumanProducts)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Keranjang Belanja Card */}
      <Card className="pink-shadow border-pink-200">
        <CardHeader className="flex flex-row items-center">
          <div>
            <CardTitle className="text-pink-700">Keranjang Belanja</CardTitle>
            <CardDescription className="text-pink-600">
              Daftar produk yang dibeli{' '}
              {deliveryType === 'po' && (
                <span className="font-medium">(PO)</span>
              )}
            </CardDescription>
          </div>
          <ShoppingCart className="ml-auto h-5 w-5 text-pink-500" />
        </CardHeader>
        <CardContent>
          {cartItems.length > 0 ? (
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-pink-100 pb-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-base text-pink-700">
                      {item.name}
                    </p>
                    <p className="text-sm text-pink-500">
                      Rp {item.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-pink-200 text-pink-700 hover:bg-pink-100"
                      onClick={() =>
                        handleUpdateQuantity(index, item.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-pink-700">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-pink-200 text-pink-700 hover:bg-pink-100"
                      onClick={() =>
                        handleUpdateQuantity(index, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-pink-700 hover:bg-pink-100 hover:text-pink-900"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="w-24 text-right font-medium text-pink-700">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4 border-t border-pink-100">
                <span className="font-bold text-lg text-pink-700">Total</span>
                <span className="font-bold text-lg text-pink-700">
                  Rp {calculateTotal().toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-pink-500">
              Belum ada produk di keranjang
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedPaymentMethod || cartItems.length === 0 || isLoading
            }
            className="w-full bg-pink-500 hover:bg-pink-600 text-white"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </Button>
        </CardFooter>
      </Card>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4">
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full w-14 h-14 shadow-lg bg-pink-500 hover:bg-pink-600 text-white">
              <Package className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="border-pink-200">
            <DialogHeader>
              <DialogTitle className="text-pink-700">
                Tambah Produk Baru
              </DialogTitle>
              <DialogDescription className="text-pink-600">
                Tambahkan produk baru ke dalam sistem
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quick-product-name" className="text-pink-700">
                  Nama Produk
                </Label>
                <Input
                  id="quick-product-name"
                  placeholder="Masukkan nama produk"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-product-price" className="text-pink-700">
                  Harga (Rp)
                </Label>
                <Input
                  id="quick-product-price"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Masukkan harga produk"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="quick-product-category"
                  className="text-pink-700"
                >
                  Kategori
                </Label>
                <Select
                  value={newProductCategory}
                  onValueChange={(value: 'makanan' | 'minuman') =>
                    setNewProductCategory(value)
                  }
                >
                  <SelectTrigger
                    id="quick-product-category"
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
                onClick={() => setProductDialogOpen(false)}
                className="border-pink-200 text-pink-700 hover:bg-pink-100"
              >
                Batal
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={isLoading}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                {isLoading ? 'Menambahkan...' : 'Tambah Produk'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={paymentMethodDialogOpen}
          onOpenChange={setPaymentMethodDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="rounded-full w-14 h-14 shadow-lg bg-pink-500 hover:bg-pink-600 text-white">
              <CreditCard className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="border-pink-200">
            <DialogHeader>
              <DialogTitle className="text-pink-700">
                Tambah Metode Pembayaran Baru
              </DialogTitle>
              <DialogDescription className="text-pink-600">
                Tambahkan metode pembayaran baru ke dalam sistem
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quick-method-name" className="text-pink-700">
                  Nama Metode Pembayaran
                </Label>
                <Input
                  id="quick-method-name"
                  placeholder="Contoh: Tunai, Transfer Bank, QRIS"
                  value={newPaymentMethodName}
                  onChange={(e) => setNewPaymentMethodName(e.target.value)}
                  className="border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPaymentMethodDialogOpen(false)}
                className="border-pink-200 text-pink-700 hover:bg-pink-100"
              >
                Batal
              </Button>
              <Button
                onClick={handleAddPaymentMethod}
                disabled={isLoading}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                {isLoading ? 'Menambahkan...' : 'Tambah Metode Pembayaran'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
