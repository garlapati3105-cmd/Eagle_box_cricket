'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center z-10"
      >
        <div className="text-7xl mb-6 animate-float">🛑</div>
        
        <div className="glass-card-dark p-8 border border-red-500/20 bg-red-500/5 rounded-2xl shadow-2xl">
          <span className="text-xs font-black bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full uppercase tracking-wider">
            Access Denied
          </span>
          
          <h1 className="text-3xl font-black text-white mt-6 tracking-tight">
            Unauthorized Entry
          </h1>
          
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            You do not have the required permissions to view this secure venue directory. Please sign in with the correct administrative credentials to continue.
          </p>

          <div className="mt-8 space-y-3">
            <Link href="/login?role=admin">
              <button className="btn-eagle w-full justify-center py-3 text-sm font-bold shadow-lg">
                🔐 Login as Admin
              </button>
            </Link>
            
            <Link href="/">
              <button className="btn-eagle-outline w-full justify-center py-3 text-sm font-semibold">
                🏠 Back to Home
              </button>
            </Link>
          </div>
        </div>

        <p className="text-gray-600 text-[11px] mt-6">
          Eagle Box Cricket • Restricted Administrative Network
        </p>
      </motion.div>
    </div>
  );
}
