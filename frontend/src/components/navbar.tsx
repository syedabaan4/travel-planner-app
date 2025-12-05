'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plane, Menu, User, LogOut, Settings, BookOpen, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminRoute = pathname.startsWith('/admin');

  const publicLinks = [
    { href: '/', label: 'Packages', primary: true },
    { href: '/hotels', label: 'Hotels' },
    { href: '/transport', label: 'Transport' },
    { href: '/food', label: 'Food' },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/bookings', label: 'Bookings' },
    { href: '/admin/payments', label: 'Payments' },
    { href: '/admin/customers', label: 'Customers' },
    { href: '/admin/catalogs', label: 'Catalogs' },
    { href: '/admin/hotels', label: 'Hotels' },
    { href: '/admin/transport', label: 'Transport' },
    { href: '/admin/food', label: 'Food' },
  ];

  const links = isAdminRoute ? adminLinks : publicLinks;

  const handleLogout = () => {
    logout();
    window.location.href = isAdminRoute ? '/admin/login' : '/';
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href={isAdminRoute ? '/admin/dashboard' : '/'}
            className="group flex items-center gap-2 font-semibold text-lg"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:ring-primary/40 transition">
              <Plane className="h-5 w-5" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-accent" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base">Travel Planner</span>
              <span className="text-xs text-muted-foreground">Pakistan getaways</span>
            </div>
            {isAdminRoute && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                Admin
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              const isPrimaryLink = (link as any).primary;
              if (isPrimaryLink) {
                return (
                  <Link key={link.href} href={link.href} className="px-4">
                    <div
                      className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                          : 'bg-primary/10 text-primary hover:bg-primary/15'
                      }`}
                    >
                      <span>{link.label}</span>
                    </div>
                  </Link>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm px-3 py-2 rounded-full transition ${
                    isActive
                      ? 'text-primary font-medium bg-primary/10'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.name && <p className="font-medium">{user.name}</p>}
                      {user?.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                      <p className="text-xs text-muted-foreground capitalize">
                        {user?.role}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {!isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/bookings" className="cursor-pointer">
                          <BookOpen className="mr-2 h-4 w-4" />
                          My Bookings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile/edit" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                {isAdminRoute ? (
                  <Button asChild variant="default">
                    <Link href="/admin/login">Admin Login</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="hidden sm:inline-flex">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent ${
                    pathname === link.href
                      ? 'bg-accent text-primary font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
