import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageLayout from "@/components/PageLayout";
import ProductCard from "@/components/ProductCard";
import ProductMap from "@/components/ProductMap";
import { Search, Map as MapIcon, LayoutGrid, MapPin } from "lucide-react";

const categories = ["All", "Tools", "Equipment", "Vehicles", "Electronics", "Furniture", "Houses", "Transport Services", "Hairdressing", "Other"];
const statuses = ["All", "Available", "Leased", "Maintenance"];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    base44.entities.Product.list("-created_date", 200).
    then(setProducts).
    catch(() => {}).
    finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || p.category === category;
    const matchStatus = status === "All" || p.status === status;
    const matchLocation = !locationSearch ||
    p.location_name?.toLowerCase().includes(locationSearch.toLowerCase());
    return matchSearch && matchCategory && matchStatus && matchLocation;
  });

  const productsWithCoords = filtered.filter((p) => p.latitude && p.longitude);

  return (
    <PageLayout>

      <div className="pt-28 pb-32 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900">All Products</h1>
        </div>

        {/* Search + Location */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets by name..."
              className="w-full bg-white border border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
            
          </div>
          <div className="relative flex-1">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2E5BFF]" />
            <input
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Search by location name..."
              className="w-full bg-white border border-zinc-200 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
            
          </div>
          {/* View Toggle */}
          <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1">
            <button onClick={() => setViewMode("grid")} className={`px-3 py-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-[#2E5BFF] text-white" : "text-zinc-500 hover:text-zinc-700"}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode("map")} className={`px-3 py-2 rounded-lg transition-colors ${viewMode === "map" ? "bg-[#2E5BFF] text-white" : "text-zinc-500 hover:text-zinc-700"}`}>
              <MapIcon size={16} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
            {categories.map((c) =>
            <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${category === c ? "bg-[#2E5BFF] text-white" : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-300"}`}>
                {c}
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {statuses.map((s) =>
            <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-2 text-[10px] uppercase tracking-widest font-bold rounded-lg whitespace-nowrap transition-colors ${status === s ? s === "Available" ? "bg-[#00E676]/10 text-[#00E676]" : s === "Leased" ? "bg-red-400/10 text-red-400" : "bg-[#2E5BFF]/10 text-[#2E5BFF]" : "text-zinc-400 hover:text-zinc-600"}`}>
                {s}
              </button>
            )}
          </div>
        </div>

        {loading ?
        <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#2E5BFF] border-t-transparent rounded-full animate-spin" />
          </div> :
        filtered.length === 0 ?
        <div className="text-center py-20">
            <p className="text-zinc-400 text-sm">No assets match your filters.</p>
          </div> :
        viewMode === "grid" ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
          </div> :

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
            {/* Map */}
            <div className="lg:col-span-2 h-[400px] lg:h-full">
              <ProductMap
              products={productsWithCoords}
              onSelectProduct={setSelectedProduct}
              selectedLatLng={selectedProduct ? [selectedProduct.latitude, selectedProduct.longitude] : null} />
            
            </div>
            {/* Side List */}
            <div className="h-[400px] lg:h-full overflow-y-auto space-y-2 pr-1">
              <p className="text-xs text-zinc-400 uppercase tracking-widest px-2">
                {productsWithCoords.length} mapped · {filtered.length - productsWithCoords.length} without location
              </p>
              {filtered.map((product) =>
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${selectedProduct?.id === product.id ? "border-[#2E5BFF] bg-[#2E5BFF]/5" : "border-zinc-200 bg-white hover:border-zinc-300"}`}>
              
                  <div className="flex items-center gap-3">
                    {product.images?.[0] || product.image_url ?
                <img src={product.images?.[0] || product.image_url} alt={product.title} className="w-12 h-12 rounded-lg object-cover border border-zinc-300 shrink-0" /> :

                <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                        <MapPin size={16} className="text-zinc-300" />
                      </div>
                }
                    <div className="min-w-0 flex-1">
                      <p className="text-zinc-900 text-xs font-medium truncate">{product.title}</p>
                      <p className="text-zinc-400 text-[10px]">{product.location_name || "No location set"}</p>
                      <p className="text-[#2E5BFF] text-xs font-bold">KSH {product.price_per_day}/day</p>
                    </div>
                    {product.quantity_available != null &&
                <span className="text-[10px] text-[#00E676] font-bold">{product.quantity_available} left</span>
                }
                  </div>
                </button>
            )}
            </div>
          </div>
        }
      </div>

    </PageLayout>);

}