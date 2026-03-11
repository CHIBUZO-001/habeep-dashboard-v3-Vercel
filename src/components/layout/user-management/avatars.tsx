import { useState } from 'react'

import { cn } from '../../../lib/cn'
import type { AgentsListItem, LandlordsListItem, TenantsListItem, UserBaseListItem } from '../../../services'

import {
  getAgentDisplayName,
  getAgentInitials,
  getLandlordDisplayName,
  getLandlordInitials,
  getTenantDisplayName,
  getTenantInitials,
  getUserDisplayName,
  getUserInitials,
} from './utils'

type UserAvatarProps = {
  user: UserBaseListItem
  className: string
}

type TenantAvatarProps = {
  tenant: TenantsListItem
  className: string
}

type AgentAvatarProps = {
  agent: AgentsListItem
  className: string
}

type LandlordAvatarProps = {
  landlord: LandlordsListItem
  className: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const imageUrl = user.userProfileImage.trim()
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const shouldShowImage = Boolean(imageUrl) && failedImageUrl !== imageUrl

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-200',
        className,
      )}
    >
      {shouldShowImage ? (
        <img
          src={imageUrl}
          alt={getUserDisplayName(user)}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        getUserInitials(user)
      )}
    </div>
  )
}

export function TenantAvatar({ tenant, className }: TenantAvatarProps) {
  const imageUrl = tenant.profileImage.trim()
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const shouldShowImage = Boolean(imageUrl) && failedImageUrl !== imageUrl

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200',
        className,
      )}
    >
      {shouldShowImage ? (
        <img
          src={imageUrl}
          alt={getTenantDisplayName(tenant)}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        getTenantInitials(tenant)
      )}
    </div>
  )
}

export function AgentAvatar({ agent, className }: AgentAvatarProps) {
  const imageUrl = agent.profileImage.trim()
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const shouldShowImage = Boolean(imageUrl) && failedImageUrl !== imageUrl

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200',
        className,
      )}
    >
      {shouldShowImage ? (
        <img
          src={imageUrl}
          alt={getAgentDisplayName(agent)}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        getAgentInitials(agent)
      )}
    </div>
  )
}

export function LandlordAvatar({ landlord, className }: LandlordAvatarProps) {
  const imageUrl = landlord.profileImage.trim()
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const shouldShowImage = Boolean(imageUrl) && failedImageUrl !== imageUrl

  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-amber-100 text-sm font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
        className,
      )}
    >
      {shouldShowImage ? (
        <img
          src={imageUrl}
          alt={getLandlordDisplayName(landlord)}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        getLandlordInitials(landlord)
      )}
    </div>
  )
}
