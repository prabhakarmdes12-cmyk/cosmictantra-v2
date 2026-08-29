'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbItem } from '@/lib/routeRegistry';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  emitSchema?: boolean;
}

export default function Breadcrumbs({ items, emitSchema = false }: BreadcrumbsProps) {
  if (!items || items.length <= 1) return null;

  // JSON-LD structured data for indexable public pages
  const jsonLd = emitSchema ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `https://cosmictantra.chiti.tech${item.href}`
    }))
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <nav aria-label="Breadcrumb" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 select-none">
        <ol className="flex items-center flex-wrap gap-1.5 text-xs font-mono-data text-[#696256] dark:text-[#9E988D]">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.href + index} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight className="w-3 h-3 text-[#8E6F1D]/50 dark:text-[#D4AF37]/50 shrink-0" />
                )}
                {index === 0 && (
                  <Home className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37] shrink-0 inline-block mr-0.5" />
                )}
                {isLast ? (
                  <span
                    aria-current="page"
                    className="font-bold text-[#1C1917] dark:text-[#FFFFFF] truncate max-w-[200px] sm:max-w-none"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-[#8E6F1D] dark:hover:text-[#F0C968] hover:underline underline-offset-4 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
