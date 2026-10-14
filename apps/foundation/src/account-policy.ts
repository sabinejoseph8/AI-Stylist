/** MVP has no social sign-in, per Sabine's 14 October 2026 decision. Legacy types are disconnected compatibility scaffolding. */
export const MVP_SOCIAL_PROVIDERS=Object.freeze([] as const);
export function isMvpSocialProvider(_value:unknown):_value is 'google'{return false;}
