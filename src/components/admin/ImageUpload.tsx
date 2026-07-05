import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/images';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, label = 'Image', className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post<{ url: string }>('/stripe/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
      toast.success('Image uploaded');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium">{label}</p>
      {value ? (
        <div className="relative inline-block">
          <img
            src={getOptimizedImageUrl(value, 256)}
            alt="Preview"
            loading="lazy"
            decoding="async"
            className="h-32 w-32 rounded-lg object-cover border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-7 w-7 rounded-full"
            onClick={() => onChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full max-w-xs flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              <span className="text-sm">Upload image</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}

interface MultiImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MultiImageUpload({ value, onChange, className }: MultiImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const images = value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const updateImages = (next: string[]) => {
    onChange(next.join('\n'));
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post<{ url: string }>('/stripe/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateImages([...images, data.url]);
      toast.success('Image uploaded');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <div key={`${url}-${index}`} className="relative">
            <img
              src={getOptimizedImageUrl(url, 192)}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-24 w-24 rounded-lg object-cover border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
              onClick={() => updateImages(images.filter((_, i) => i !== index))}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs">Add</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}
