import { Bath, BedDouble, Building2, ImageOff, MapPin, PlayCircle, Ruler, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '../../../lib/cn'
import type { PropertyListItem } from '../../../services'
import {
  formatCurrencyValue,
  formatPropertyLabel,
  formatPropertyLocation,
  getPropertyMediaAssets,
  getPropertyStatusClasses,
  numberFormatter,
} from './shared'

type PropertyDetailsModalProps = {
  property: PropertyListItem
  onClose: () => void
}

type PropertyDetailFieldProps = {
  label: string
  value: string
}

function PropertyDetailField({ label, value }: PropertyDetailFieldProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  )
}

export function PropertyDetailsModal({ property, onClose }: PropertyDetailsModalProps) {
  const mediaAssets = useMemo(() => getPropertyMediaAssets(property), [property])
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0)
  const activeMedia = mediaAssets[selectedMediaIndex] ?? mediaAssets[0] ?? null

  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-0 sm:p-6">
      <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div
        className="relative z-[1] mt-4 flex max-h-[calc(90dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:mt-8 sm:w-[min(96vw,76rem)]"
        role="dialog"
        aria-modal="true"
        aria-label="Property details"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
              {property.title || property.publicId || 'Property Details'}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {formatPropertyLabel(property.type)}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {formatPropertyLabel(property.listingFor)}
              </span>
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium',
                  getPropertyStatusClasses(property),
                )}
              >
                {formatPropertyLabel(property.status)}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {property.sold ? 'Sold' : 'Unsold'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close property details"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-10 sm:pb-12">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
            <section className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
                {activeMedia ? (
                  activeMedia.kind === 'video' ? (
                    <video
                      key={activeMedia.id}
                      src={activeMedia.src}
                      poster={activeMedia.previewSrc || undefined}
                      controls
                      playsInline
                      className="aspect-[16/10] w-full bg-slate-950 object-contain"
                    />
                  ) : (
                    <img
                      key={activeMedia.id}
                      src={activeMedia.src}
                      alt={property.title || property.publicId || 'Property media'}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  )
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <ImageOff className="h-8 w-8" />
                  </div>
                )}
              </div>

              {mediaAssets.length > 0 ? (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Media</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {numberFormatter.format(mediaAssets.length)} item{mediaAssets.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                    {mediaAssets.map((mediaAsset, mediaIndex) => {
                      const isActive = mediaAsset.id === activeMedia?.id

                      return (
                        <button
                          key={mediaAsset.id}
                          type="button"
                          onClick={() => setSelectedMediaIndex(mediaIndex)}
                          className={cn(
                            'group relative overflow-hidden rounded-xl border bg-slate-50 transition-all dark:bg-slate-950/40',
                            isActive
                              ? 'border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-900/40'
                              : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700',
                          )}
                        >
                          {mediaAsset.previewSrc ? (
                            <img
                              src={mediaAsset.previewSrc}
                              alt={`${property.title || property.publicId || 'Property'} preview ${mediaIndex + 1}`}
                              className="aspect-square w-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex aspect-square items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                              <ImageOff className="h-4 w-4" />
                            </div>
                          )}

                          {mediaAsset.kind === 'video' ? (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/25 text-white">
                              <PlayCircle className="h-5 w-5 drop-shadow" />
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {property.description || 'No description provided for this property.'}
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Summary</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrencyValue(property.price, property.priceCurrency)}
                </p>
                <p className="mt-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formatPropertyLocation(property)}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <BedDouble className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Bedrooms</span>
                  </div>
                  <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {numberFormatter.format(property.bedrooms)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Bath className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Bathrooms</span>
                  </div>
                  <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {numberFormatter.format(property.bathrooms)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Plots</span>
                  </div>
                  <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {numberFormatter.format(property.plots)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Ruler className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Size</span>
                  </div>
                  <p className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {numberFormatter.format(property.size)} sqm
                  </p>
                </div>
              </div>
            </section>
          </div>

          {property.features.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Features</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {property.features.map((feature) => (
                  <span
                    key={`${property.id}-${feature}`}
                    className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {formatPropertyLabel(feature)}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <PropertyDetailField label="Public ID" value={property.publicId || 'N/A'} />
            <PropertyDetailField label="Status" value={formatPropertyLabel(property.status)} />
            <PropertyDetailField label="Listing For" value={formatPropertyLabel(property.listingFor)} />
            <PropertyDetailField label="Type" value={formatPropertyLabel(property.type)} />
            <PropertyDetailField label="Price Currency" value={property.priceCurrency || 'NGN'} />
            <PropertyDetailField label="Sold" value={property.sold ? 'Yes' : 'No'} />
            <PropertyDetailField label="Address" value={property.location.address || 'N/A'} />
            <PropertyDetailField label="City" value={property.location.city || 'N/A'} />
            <PropertyDetailField label="Agent ID" value={property.agentId || 'N/A'} />
            <PropertyDetailField label="Post ID" value={property.postId || 'N/A'} />
            <PropertyDetailField label="Created" value={property.dateCreated || 'Unknown date'} />
            <PropertyDetailField label="Updated" value={property.dateUpdated || 'Unknown date'} />
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
