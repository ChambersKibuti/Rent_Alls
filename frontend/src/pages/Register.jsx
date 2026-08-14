import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, ShoppingCart, Store, ArrowRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Register() {
  return (
    <AuthLayout
      icon={UserPlus}
      title="Join RentAlls"
      subtitle="Choose your account type to get started"
      footer={
      <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            to="/register/buyer"
            className="block p-6 rounded-xl border-2 border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-center group">
            
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-foreground font-bold text-base mb-1">Buying?</h3>
            <p className="text-muted-foreground text-xs">Browse and rent assets on demand</p>
            <div className="flex items-center justify-center gap-1 mt-3 text-primary text-xs font-medium">
              Get started <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            to="/seller-register"
            className="block p-6 rounded-xl border-2 border-border hover:border-accent/30 hover:bg-accent/5 transition-all text-center group">
            
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Store className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-foreground font-bold text-base mb-1">Selling?</h3>
            <p className="text-muted-foreground text-xs">List your assets and earn revenue</p>
            <div className="flex items-center justify-center gap-1 mt-3 text-primary text-xs font-medium">
              Get started <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </motion.div>
      </div>
    </AuthLayout>);

}