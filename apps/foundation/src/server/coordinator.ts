/** Foundation port only. Real identity verification and sessions belong to later tasks. */
export interface SessionCoordinator {
 readonly available:boolean;
 start():Readonly<{started:false;reason:'accounts-not-connected'}>;
}
export function createFoundationCoordinator():SessionCoordinator{
 return Object.freeze({available:false,start:()=>Object.freeze({started:false as const,reason:'accounts-not-connected' as const})});
}
