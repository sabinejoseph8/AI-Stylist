/** Shared preference fields. Confirmation and persistence remain explicit actions. */
export const FIELDS = [
 ['occasion','Occasion'],['season','Season / date'],['color','Color'],['style','Style'],
 ['budget','Budget'],['lookType','Look type'],['wardrobe','Owned wardrobe'],
] as const;
export type Field=typeof FIELDS[number][0];
export type Note={value:string;status:'missing'|'tentative'|'confirmed';revision:number;sequence:number;source:'speech'|'touch'|null};
