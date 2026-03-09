import { Bath, BedDouble, Eye, ImageOff, MapPin, MoreHorizontal, Ruler } from 'lucide-react'
import { useState } from 'react'

import { cn } from '../../../lib/cn'
import type { PropertyListItem } from '../../../services'
import {
  formatCurrencyValue,
  formatPropertyLabel,
  formatPropertyLocation,
  getPrimaryPropertyImage,
  getPropertyStatusClasses,
  numberFormatter,
} from './shared'

type PropertyImageProps = {
  property: PropertyListItem
  className: string
}

type PropertyDirectoryCardProps = {
  property: PropertyListItem
  isMenuOpen: boolean
  onToggleMenu: () => void
  onViewProperty: () => void
}

function PropertyPreviewImage({ property, className }: PropertyImageProps) {
  const imageUrl = getPrimaryPropertyImage(property)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const shouldShowImage = Boolean(imageUrl) && failedImageUrl !== imageUrl

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
        className,
      )}
    >
      {shouldShowImage ? (
        <img
          src={imageUrl}
          alt={property.title || property.publicId || 'Property preview'}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        <ImageOff className="h-5 w-5" />
      )}
    </div>
  )
}

export function PropertyDirectoryCard({ property, isMenuOpen, onToggleMenu, onViewProperty }: PropertyDirectoryCardProps) {
  return (
    <li className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 sm:basis-[190px] sm:grow sm:shrink lg:basis-[clamp(220px,18vw,350px)] lg:max-w-[350px]  dark:border-slate-800 dark:bg-slate-950/40">
      <PropertyPreviewImage property={property} className="aspect-[16/10] w-full" />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {property.title || property.publicId || 'Untitled Property'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {formatPropertyLabel(property.type)} · {formatPropertyLabel(property.listingFor)}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium',
              getPropertyStatusClasses(property),
            )}
          >
            {formatPropertyLabel(property.status)}
          </span>
        </div>

        <p className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
          {formatCurrencyValue(property.price, property.priceCurrency)}
        </p>

        <p className="mt-2 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{formatPropertyLocation(property)}</span>
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 dark:bg-slate-900">
            <BedDouble className="h-3.5 w-3.5" />
            {numberFormatter.format(property.bedrooms)} bed
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 dark:bg-slate-900">
            <Bath className="h-3.5 w-3.5" />
            {numberFormatter.format(property.bathrooms)} bath
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 dark:bg-slate-900">
            <Ruler className="h-3.5 w-3.5" />
            {numberFormatter.format(property.size)} sqm
          </span>
        </div>

        <div className="mt-auto pt-4 text-[11px] text-slate-500 dark:text-slate-400">
          <p className="truncate">ID: {property.publicId || 'N/A'}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="truncate">{property.dateCreated || 'Unknown date'}</p>

            <div className="relative shrink-0" data-property-action-menu>
              <button
                type="button"
                onClick={onToggleMenu}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-label={`Open actions for ${property.title || property.publicId || 'property'}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  'absolute bottom-full right-0 z-20 mb-2 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900',
                  isMenuOpen ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-1 opacity-0',
                )}
                role="menu"
                aria-label="Property actions"
              >
                <button
                  type="button"
                  onClick={onViewProperty}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  role="menuitem"
                >
                  <Eye className="h-4 w-4" />
                  View property
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
