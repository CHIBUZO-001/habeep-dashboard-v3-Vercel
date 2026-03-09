export const errorPageByCode = {
  '404': {
    code: '404',
    title: 'Page Not Found',
    message: 'The page you are trying to access does not exist in this workspace.',
    hint: 'It may have been moved, renamed, or is not available to your role.',
  },
  '401': {
    code: '401',
    title: 'Unauthorized',
    message: 'You are not authenticated for this request.',
    hint: 'Please sign in again to continue.',
  },
  '403': {
    code: '403',
    title: 'Access Forbidden',
    message: 'Your current role does not have permission to view this resource.',
    hint: 'Contact a super admin to request access.',
  },
  '500': {
    code: '500',
    title: 'Server Error',
    message: 'Something went wrong while processing this request.',
    hint: 'Try again shortly. If it persists, contact engineering.',
  },
} as const

export type AppErrorCode = keyof typeof errorPageByCode
