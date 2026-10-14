import {LocalDraftOutfit} from '../outfits/local-draft-outfit.ts';
import {DraftOutfitPanel} from './draft-outfit-panel.tsx';
import {LocalPrivacy} from '../privacy/local-privacy.ts';
import {PrivacyPanel} from './privacy-panel.tsx';
import {LocalShoppingList} from '../shopping/local-shopping-list.ts';
import {ShoppingListPanel} from './shopping-list-panel.tsx';
import {LocalSavedLooks} from '../looks/local-saved-looks.ts';
import {SampleLookPreview,SavedLooksPanel} from './saved-looks-panel.tsx';
import {LocalWardrobe} from '../media/local-wardrobe.ts';
import {WardrobePanel} from './wardrobe-panel.tsx';
import React,{useEffect,useState} from 'react';
import {AccountPanel} from './account-panel.tsx';
import {NotebookPanel} from './notebook-panel.tsx';
const destinations=['Stylist','Wardrobe','Saved looks','Profile'] as const;
export function App(){
 const [draftActive,setDraftActive]=useState(true);
 const [draft]=useState(()=>new LocalDraftOutfit());
 const [privacy]=useState(()=>new LocalPrivacy());
 const [shopping]=useState(()=>new LocalShoppingList());
 const [looks]=useState(()=>new LocalSavedLooks());
 const [wardrobe]=useState(()=>new LocalWardrobe({createURL:blob=>URL.createObjectURL(blob),revokeURL:url=>URL.revokeObjectURL(url)}));
 useEffect(()=>{const exit=()=>{draft.clear();privacy.cancel();wardrobe.clear();looks.clear();shopping.clear();};window.addEventListener('pagehide',exit);return()=>{window.removeEventListener('pagehide',exit);draft.clear();privacy.cancel();wardrobe.clear();looks.clear();shopping.clear();};},[wardrobe,looks,shopping,privacy,draft]);
 useEffect(()=>{
  const unbind=[privacy.bind('wardrobe',{read:()=>{const items=wardrobe.exportItems();return{data:{items:items.map(item=>({id:item.id,description:item.description,ownership:'owned',photoId:'wardrobe_photo_'+item.id}))},photos:items.map(item=>({id:'wardrobe_photo_'+item.id,blob:item.blob}))};},clear:()=>wardrobe.clear()}),privacy.bind('looks',{read:()=>({data:{looks:looks.snapshot().looks},photos:[]}),clear:()=>looks.clear()}),privacy.bind('shopping',{read:()=>({data:{entries:shopping.snapshot().entries},photos:[]}),clear:()=>shopping.clear()})];
  const unsubscribe=[wardrobe.subscribe(()=>privacy.invalidate()),looks.subscribe(()=>privacy.invalidate()),shopping.subscribe(()=>privacy.invalidate())];
  return()=>{for(const stop of unsubscribe)stop();for(const stop of unbind)stop();privacy.cancel();};
 },[wardrobe,looks,shopping,privacy]);
 const [page,setPage]=useState<typeof destinations[number]>('Stylist');
 return <><a className="skip" href="#main">Skip to content</a><header><a className="wordmark" href="#main">AI Stylist<span>Your personal fashion journal</span></a><span className="badge">Local development preview</span></header>
 <main id="main" tabIndex={-1}><p className="eyebrow">A foundation for your next look</p><h1>{page==='Stylist'?'Your style, thoughtfully considered.':page}</h1><p className="intro">This local preview uses sample content. It does not sign you in, connect to a stylist, save personal information, or offer products for purchase.</p>
 <div className="layout" hidden={page!=='Stylist'}><section className="card"><span className="badge">Stylist preparation</span><h2>A conversation shaped around you</h2><p>Your stylist will collect preferences naturally during your first conversation, then suggest one checked look at a time.</p><button onClick={()=>setPage('Profile')}>Preview account screens</button> <button disabled>Stylist unavailable in this preview</button><p className="muted">Accounts, avatar and microphone are not connected in this preview.</p></section><NotebookPanel visible={page==='Stylist'} wardrobe={wardrobe} privacy={privacy} draft={draft} onActiveChange={setDraftActive}/></div><div hidden={page!=='Stylist'}><SampleLookPreview model={looks} shopping={shopping}/></div><DraftOutfitPanel model={draft} visible={page==='Stylist'} active={draftActive}/><SavedLooksPanel model={looks} shopping={shopping} visible={page==='Saved looks'}/><ShoppingListPanel model={shopping} visible={page==='Saved looks'}/><WardrobePanel model={wardrobe} visible={page==='Wardrobe'}/>{page==='Profile'?<AccountPanel/>:null}<PrivacyPanel model={privacy} visible={page==='Profile'}/>
 </main><nav aria-label="Primary navigation">{destinations.map(name=><button key={name} aria-current={page===name?'page':undefined} onClick={()=>setPage(name)}>{name}</button>)}</nav></>;
}
