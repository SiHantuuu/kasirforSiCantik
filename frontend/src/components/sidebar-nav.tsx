'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  History,
  Package,
  ShoppingCart,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function SidebarNav({ activeTab, setActiveTab }: SidebarNavProps) {
  const [expanded, setExpanded] = useState(false);

  const navItems = [
    {
      id: 'cashier',
      title: 'Kasir',
      icon: ShoppingCart,
    },
    {
      id: 'products',
      title: 'Tambah Produk',
      icon: Package,
    },
    {
      id: 'payment-methods',
      title: 'Tambah Media Bayar',
      icon: CreditCard,
    },
    {
      id: 'history',
      title: 'History Bayar',
      icon: History,
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setExpanded(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  return (
    <div
      className={cn(
        'border-r bg-gradient-to-b from-pink-50 to-pink-100 min-h-screen pink-shadow transition-all duration-300',
        expanded ? 'w-64' : 'w-16'
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center border-b px-4 font-semibold text-pink-700 justify-between',
          !expanded && 'justify-center px-0'
        )}
      >
        {expanded ? (
          <>
            <span className="text-xl">✨ Sweet Cashier ✨</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden text-pink-700 hover:bg-pink-200/50"
            >
              <X className="h-5 w-5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-pink-700 hover:bg-pink-200/50"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      <TooltipProvider delayDuration={300}>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) =>
            expanded ? (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) setExpanded(false);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-all duration-200 card-hover',
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground pink-glow'
                    : 'hover:bg-pink-200/50 text-pink-700 hover:text-pink-900'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </button>
            ) : (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                    }}
                    className={cn(
                      'flex items-center justify-center rounded-md p-3 text-sm font-medium transition-all duration-200 card-hover',
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground pink-glow'
                        : 'hover:bg-pink-200/50 text-pink-700 hover:text-pink-900'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            )
          )}
        </nav>
      </TooltipProvider>

      {expanded && (
        <div className="p-4 mt-auto">
          <div className="text-xs text-pink-600 text-center italic">
            Made with 💖 for my bei :3
          </div>
        </div>
      )}
    </div>
  );
}
