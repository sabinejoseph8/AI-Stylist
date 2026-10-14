/** Sabine's 14 October 2026 MVP decision. No provider activation or credential read. */
export const MVP_SOCIAL_PROVIDERS=Object.freeze(['google'] as const);
export function isMvpSocialProvider(value:unknown):value is 'google'{return value==='google';}
