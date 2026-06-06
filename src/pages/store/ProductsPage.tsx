import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductCard } from '@/components/products/ProductCard';
import type { Category, Pagination, Product } from '@/types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'name', label: 'Name A-Z' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Gray', 'Navy', 'Beige'];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = useMemo(() => ({
    category: searchParams.get('category') || '',
    subcategory: searchParams.get('subcategory') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    size: searchParams.get('size') || '',
    color: searchParams.get('color') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    bestSeller: searchParams.get('bestSeller') === 'true',
    specialCombo: searchParams.get('specialCombo') === 'true',
    crazyDeal: searchParams.get('crazyDeal') === 'true',
    page: searchParams.get('page') || '1',
  }), [searchParams]);

  const updateFilter = useCallback((key: string, value: string | boolean) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === '' || value === false) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      if (key !== 'page') next.delete('page');
      return next;
    });
  }, [setSearchParams]);

  const clearFilters = () => {
    const search = searchParams.get('search');
    setSearchParams(search ? { search } : {});
  };

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      page: filters.page,
      limit: '12',
      sort: filters.sort,
    };
    if (filters.category) params.category = filters.category;
    if (filters.subcategory) params.subcategory = filters.subcategory;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.size) params.size = filters.size;
    if (filters.color) params.color = filters.color;
    if (filters.search) params.search = filters.search;
    if (filters.bestSeller) params.bestSeller = 'true';
    if (filters.specialCombo) params.specialCombo = 'true';
    if (filters.crazyDeal) params.crazyDeal = 'true';
    return params;
  }, [filters]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<{ categories: Category[]; subcategories: Category[] }>('/categories');
      return data;
    },
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: async () => {
      const { data } = await api.get<{ products: Product[]; pagination: Pagination }>('/products', {
        params: queryParams,
      });
      return data;
    },
  });

  const subcategories = useMemo(() => {
    if (!categoriesData?.subcategories || !filters.category) return [];
    return categoriesData.subcategories.filter((sub) => {
      const parentId = typeof sub.parent === 'string' ? sub.parent : sub.parent?._id;
      return parentId === filters.category;
    });
  }, [categoriesData, filters.category]);

  const activeFilterCount = [
    filters.category,
    filters.subcategory,
    filters.minPrice,
    filters.maxPrice,
    filters.size,
    filters.color,
    filters.bestSeller,
    filters.specialCombo,
    filters.crazyDeal,
  ].filter(Boolean).length;

  const FilterPanel = ({ className }: { className?: string }) => (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto py-1 px-2 text-xs">
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={filters.category || 'all'} onValueChange={(v) => updateFilter('category', v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoriesData?.categories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {subcategories.length > 0 && (
        <div className="space-y-2">
          <Label>Subcategory</Label>
          <Select value={filters.subcategory || 'all'} onValueChange={(v) => updateFilter('subcategory', v === 'all' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="All subcategories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subcategories</SelectItem>
              {subcategories.map((sub) => (
                <SelectItem key={sub._id} value={sub._id}>{sub.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Price Range</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            min={0}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            min={0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Size</Label>
        <Select value={filters.size || 'all'} onValueChange={(v) => updateFilter('size', v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Any size" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any size</SelectItem>
            {SIZES.map((size) => (
              <SelectItem key={size} value={size}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <Select value={filters.color || 'all'} onValueChange={(v) => updateFilter('color', v === 'all' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Any color" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any color</SelectItem>
            {COLORS.map((color) => (
              <SelectItem key={color} value={color}>{color}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Collections</Label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filters.bestSeller}
            onChange={(e) => updateFilter('bestSeller', e.target.checked)}
            className="rounded border-input"
          />
          Best Sellers
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filters.specialCombo}
            onChange={(e) => updateFilter('specialCombo', e.target.checked)}
            className="rounded border-input"
          />
          Special Combos
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filters.crazyDeal}
            onChange={(e) => updateFilter('crazyDeal', e.target.checked)}
            className="rounded border-input"
          />
          Crazy Deals
        </label>
      </div>
    </div>
  );

  return (
    <div className="container-custom py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {filters.search ? `Results for "${filters.search}"` : 'Shop All Products'}
        </h1>
        {data?.pagination && (
          <p className="text-muted-foreground mt-1">
            {data.pagination.total} product{data.pagination.total !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 border rounded-lg p-6">
            <FilterPanel />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <Button
              variant="outline"
              className="lg:hidden gap-2"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <Label htmlFor="sort" className="text-sm text-muted-foreground whitespace-nowrap">Sort by</Label>
              <Select value={filters.sort} onValueChange={(v) => updateFilter('sort', v)}>
                <SelectTrigger id="sort" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="text-center py-16 border rounded-lg bg-muted/30">
              <p className="text-muted-foreground mb-4">Failed to load products.</p>
              <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
            </div>
          )}

          {data && data.products.length === 0 && (
            <div className="text-center py-16 border rounded-lg">
              <p className="text-muted-foreground mb-4">No products match your filters.</p>
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            </div>
          )}

          {data && data.products.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {data.products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {data.pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page <= 1}
                    onClick={() => updateFilter('page', String(data.pagination.page - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {data.pagination.page} of {data.pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page >= data.pagination.pages}
                    onClick={() => updateFilter('page', String(data.pagination.page + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-background shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Filters</h3>
              <Button variant="ghost" size="icon" onClick={() => setMobileFiltersOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <FilterPanel />
              <Button className="w-full mt-6" onClick={() => setMobileFiltersOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}