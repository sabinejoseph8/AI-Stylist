/** Reserve the measured bottom bar plus breathing room, including text enlargement.
 * Invalid measurements use the CSS fallback instead of concealing page content. */
export function navigationClearance(height:number):string|null{
 return Number.isFinite(height)&&height>=0&&height<=10_000?`${Math.ceil(height)}px`:null;
}
