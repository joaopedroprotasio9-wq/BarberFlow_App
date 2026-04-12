import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, orderBy, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Barbershop, Product } from '../types';
import { Plus, Package, ShoppingCart, AlertTriangle, Trash2, X, Loader2, Minus, PlusCircle } from 'lucide-react';

interface InventoryProps {
  barbershop: Barbershop;
}

export function Inventory({ barbershop }: InventoryProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit for base64 in Firestore
        alert('A imagem é muito grande. Por favor, escolha uma imagem menor que 500KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, `barbershops/${barbershop.id}/products`),
      orderBy('name', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });

    return () => unsub();
  }, [barbershop.id]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name,
        description,
        imageUrl,
        price: Number(price),
        stock: Number(stock),
        minStock: Number(minStock),
        barbershopId: barbershop.id
      };

      if (editingProduct) {
        await updateDoc(doc(db, `barbershops/${barbershop.id}/products`, editingProduct.id), productData);
      } else {
        await addDoc(collection(db, `barbershops/${barbershop.id}/products`), productData);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setImageUrl(product.imageUrl || '');
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setMinStock(product.minStock.toString());
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setPrice('');
    setStock('');
    setMinStock('');
  };

  const handleSale = async (product: Product) => {
    if (product.stock <= 0) return;
    try {
      const productRef = doc(db, `barbershops/${barbershop.id}/products`, product.id);
      await updateDoc(productRef, { stock: increment(-1) });
      
      await addDoc(collection(db, `barbershops/${barbershop.id}/sales`), {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        totalPrice: product.price,
        date: new Date().toISOString(),
        barbershopId: barbershop.id
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, `barbershops/${barbershop.id}/products`, productId));
      setIsDeleting(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Estoque</h2>
          <p className="text-zinc-500 text-sm">Controle de produtos e vendas rápidas.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-zinc-700 transition-all group overflow-hidden">
              {product.imageUrl ? (
                <div className="h-48 w-full relative overflow-hidden">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent opacity-60" />
                </div>
              ) : (
                <div className="h-48 w-full bg-zinc-800 flex items-center justify-center text-zinc-600">
                  <Package className="w-12 h-12" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
                    <p className="text-2xl font-bold text-emerald-500">R$ {product.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.stock <= product.minStock && (
                      <div className="flex items-center gap-1 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        <AlertTriangle className="w-3 h-3" />
                        Baixo
                      </div>
                    )}
                    <button 
                      onClick={() => handleEdit(product)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {product.description && (
                  <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{product.description}</p>
                )}

                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl mb-6">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Disponível</p>
                    <p className={`text-xl font-bold ${product.stock <= product.minStock ? 'text-red-500' : 'text-white'}`}>
                      {product.stock} un
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Mínimo</p>
                    <p className="text-sm font-bold text-zinc-400">{product.minStock} un</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleSale(product)}
                    disabled={product.stock <= 0}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Venda Rápida
                  </button>
                  <button 
                    onClick={() => setIsDeleting(product.id)}
                    className="p-3 rounded-xl bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 text-zinc-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Excluir Produto?</h3>
            <p className="text-zinc-500 text-sm mb-8">Esta ação não pode ser desfeita. O produto será removido permanentemente.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleting(null)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteProduct(isDeleting)}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white">
                <X />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome do Produto</label>
                <input 
                  required
                  placeholder="Ex: Pomada Modeladora"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Descrição (Opcional)</label>
                <textarea 
                  placeholder="Para que serve este produto?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Foto do Produto</label>
                <div className="flex flex-col gap-4">
                  {imageUrl && (
                    <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-zinc-700">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-700 border-dashed rounded-2xl cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <PlusCircle className="w-8 h-8 text-zinc-500 mb-2" />
                        <p className="text-sm text-zinc-500">Clique para fazer upload</p>
                        <p className="text-xs text-zinc-600 mt-1">PNG, JPG ou WEBP (Máx. 500KB)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-800"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-zinc-900 px-2 text-zinc-500">Ou use uma URL</span>
                    </div>
                  </div>
                  <input 
                    type="url"
                    placeholder="https://exemplo.com/foto.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Preço de Venda (R$)</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Estoque Atual</label>
                  <input 
                    required
                    type="number"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Estoque Mínimo</label>
                  <input 
                    required
                    type="number"
                    placeholder="5"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
              >
                {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
