import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Tag, MapPin } from "lucide-react";

export default function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);

  const statusColor = product.status === "Available" ? "text-[#00E676] bg-[#00E676]/10" :
                      product.status === "Leased" ? "text-red-400 bg-red-400/10" :
                      "text-yellow-400 bg-yellow-400/10";

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative bg-white border border-zinc-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#2E5BFF]/30"
      whileHover={{ y: -4 }}
    >
      <Link to={`/products/${product.id}`}>
        <div className="aspect-square overflow-hidden relative">
          {(product.images?.[0] || product.image_url) ? (
            <img
              src={product.images?.[0] || product.image_url}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
              <Tag size={40} className="text-zinc-400" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <span className={`${statusColor} text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full`}>
              {product.status}
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            className="absolute inset-0 bg-gradient-to-t from-[#F7F8FA] via-transparent to-transparent"
          />
        </div>

        <div className="p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{product.category}</p>
          <h3 className="text-zinc-900 font-semibold text-base mb-1 group-hover:text-[#2E5BFF] transition-colors">
            {product.title}
          </h3>
          {product.location_name && (
            <p className="text-zinc-400 text-xs flex items-center gap-1 mb-2">
              <MapPin size={10} /> {product.location_name}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[#2E5BFF] font-bold text-lg">KSH {product.price_per_day}</span>
              <span className="text-zinc-400 text-xs">/day</span>
            </div>
            {product.quantity_available != null && product.quantity_available > 0 && (
              <span className="text-[10px] text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                {product.quantity_available} left
              </span>
            )}
            <motion.div
              animate={{ x: hovered ? 0 : -8, opacity: hovered ? 1 : 0 }}
              className="text-[#2E5BFF]"
            >
              <ArrowRight size={18} />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}