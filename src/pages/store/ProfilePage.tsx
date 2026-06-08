import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  User,
  MapPin,
  Package,
  Plus,
  Pencil,
  Trash2,
  LogOut,
  Shield,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import type { Address, Order, User as UserType } from '@/types';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
});

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().default('US'),
  isDefault: z.boolean().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type AddressFormData = z.infer<typeof addressSchema>;

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'orders', label: 'Orders', icon: Package },
] as const;

type TabId = (typeof TABS)[number]['id'];

const orderStatusVariant: Record<Order['orderStatus'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'secondary',
  processing: 'secondary',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
};

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const { setAuth, accessToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get<{ user: UserType }>('/auth/me');
      return data.user;
    },
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get<{ orders: Order[] }>('/orders/my');
      return data.orders;
    },
    enabled: activeTab === 'orders',
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: user ? { name: user.name, phone: user.phone || '' } : undefined,
  });

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'US', isDefault: false },
  });

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await api.patch<{ user: UserType }>('/auth/profile', data);
      return response.data.user;
    },
    onSuccess: (updatedUser) => {
      if (accessToken) setAuth(updatedUser, accessToken);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const addressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      if (editingAddress?._id) {
        const response = await api.patch<{ user: UserType }>(`/auth/addresses/${editingAddress._id}`, data);
        return response.data.user;
      }
      const response = await api.post<{ user: UserType }>('/auth/addresses', data);
      return response.data.user;
    },
    onSuccess: (updatedUser) => {
      if (accessToken) setAuth(updatedUser, accessToken);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAddressDialogOpen(false);
      setEditingAddress(null);
      addressForm.reset({ country: 'US', isDefault: false });
      toast.success(editingAddress ? 'Address updated' : 'Address added');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to save address');
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await api.delete<{ user: UserType }>(`/auth/addresses/${addressId}`);
      return response.data.user;
    },
    onSuccess: (updatedUser) => {
      if (accessToken) setAuth(updatedUser, accessToken);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Address deleted');
    },
    onError: () => toast.error('Failed to delete address'),
  });

  const openAddAddress = () => {
    setEditingAddress(null);
    addressForm.reset({ label: '', street: '', city: '', state: '', zipCode: '', country: 'US', isDefault: false });
    setAddressDialogOpen(true);
  };

  const openEditAddress = (address: Address) => {
    setEditingAddress(address);
    addressForm.reset({
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setAddressDialogOpen(true);
  };

  if (userLoading) {
    return (
      <div className="container-custom py-8 md:py-12">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="container-custom py-24 text-center">
        <p className="text-muted-foreground mb-4">Failed to load profile.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['profile'] })}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 md:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">My Account</h1>
      <p className="text-muted-foreground mb-8">{user.email}</p>

      <div className="flex flex-col lg:flex-row gap-8">
        <nav className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <div className="border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-6">Profile Information</h2>
              <form
                onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))}
                className="space-y-4 max-w-md"
              >
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...profileForm.register('name')} className="mt-1" />
                  {profileForm.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email} disabled className="mt-1 bg-muted" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...profileForm.register('phone')} className="mt-1" placeholder="+1 (555) 000-0000" />
                </div>
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t max-w-md">
                <h3 className="font-medium flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4" />
                  Account Security
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={async () => {
                      await logout();
                      navigate('/');
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="gap-2"
                    onClick={async () => {
                      await logout(true);
                      navigate('/login');
                    }}
                  >
                    Sign Out All Devices
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg">Saved Addresses</h2>
                <Button size="sm" onClick={openAddAddress} className="gap-1">
                  <Plus className="h-4 w-4" /> Add Address
                </Button>
              </div>

              {user.addresses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No addresses saved yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {user.addresses.map((address) => (
                    <div key={address._id} className="border rounded-lg p-4 relative">
                      {address.isDefault && (
                        <Badge className="mb-2" variant="secondary">Default</Badge>
                      )}
                      <p className="font-medium">{address.label}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {address.street}<br />
                        {address.city}, {address.state} {address.zipCode}<br />
                        {address.country}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => openEditAddress(address)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => address._id && deleteAddressMutation.mutate(address._id)}
                          disabled={deleteAddressMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-6">Order History</h2>
              {ordersLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              )}
              {orders && orders.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No orders yet.</p>
                  <Button asChild><Link to="/products">Start Shopping</Link></Button>
                </div>
              )}
              {orders && orders.length > 0 && (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Link
                      key={order._id}
                      to={`/orders/${order._id}`}
                      className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="font-medium">{order.orderNumber}</span>
                        <div className="flex gap-2">
                          <Badge variant={orderStatusVariant[order.orderStatus]}>
                            {order.orderStatus}
                          </Badge>
                          <Badge variant="outline">{order.paymentStatus}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                        <span className="font-semibold text-foreground">{formatPrice(order.total)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add Address'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={addressForm.handleSubmit((data) => addressMutation.mutate(data))}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="label">Label</Label>
              <Input id="label" placeholder="Home, Work, etc." {...addressForm.register('label')} className="mt-1" />
              {addressForm.formState.errors.label && (
                <p className="text-sm text-destructive mt-1">{addressForm.formState.errors.label.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="street">Street</Label>
              <Input id="street" {...addressForm.register('street')} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" {...addressForm.register('city')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" {...addressForm.register('state')} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" {...addressForm.register('zipCode')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...addressForm.register('country')} className="mt-1" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...addressForm.register('isDefault')} className="rounded" />
              Set as default address
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddressDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addressMutation.isPending}>
                {addressMutation.isPending ? 'Saving...' : 'Save Address'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
