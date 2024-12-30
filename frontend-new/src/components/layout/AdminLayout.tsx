import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { SideNav } from '@/components/navigation/SideNav';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out z-30
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <SideNav />
      </div>

        {/* Main content - adjust padding */}
        <div className="lg:pl-64"> {/* This ensures content starts after sidebar */}
        <main className="min-h-screen">
          <div className="mx-auto px-4"> {/* Removed max-w-8xl and reduced padding */}
            {children}
          </div>
        </main>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed bottom-4 right-4 p-3 bg-indigo-600 text-white rounded-full 
                 shadow-lg lg:hidden z-40 hover:bg-indigo-700 transition-colors"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}