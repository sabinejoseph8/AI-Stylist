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
 const [shopping]=useState(()=>new LocalShoppingList());
 const [looks]=useState(()=>new LocalSavedLooks());
 const [wardrobe]=useState(()=>new LocalWardrobe({createURL:blob=>URL.createObjectURL(blob),revokeURL:url=>URL.revokeObjectURL(url)}));
 useEffect(()=>{const exit=()=>{wardrobe.clear();looks.clear();shopping.clear();};window.addEventListener('pagehide',exit);return()=>{window.removeEventListener('pagehide',exit);wardrobe.clear();looks.clear();shopping.clear();};},[wardrobe,looks,shopping]);
 const [page,setPage]=useState<typeof destinations[number]>('Stylist');
 return <><a className="skip" href="#main">Skip to content</a><header><a className="wordmark" href="#main">AI Stylist<span>Your personal fashion journal</span></a><span className="badge">Local development preview</span></header>
 <main id="main" tabIndex={-1}><p className="eyebrow">A foundation for your next look</p><h1>{page==='Stylist'?'Your style, thoughtfully considered.':page}</h1><p className="intro">This local preview uses sample content. It does not sign you in, connect to a stylist, save personal information, or offer products for purchase.</p>
 <div className="layout" hidden={page!=='Stylist'}><section className="card"><span className="badge">Stylist preparation</span><h2>A conversation shaped around you</h2><p>Your stylist will collect preferences naturally during your first conversation, then suggest one checked look at a time.</p><button onClick={()=>setPage('Profile')}>Preview account screens</button> <button disabled>Stylist unavailable in this preview</button><p className="muted">Accounts, avatar and microphone are not connected in this preview.</p></section><NotebookPanel visible={page==='Stylist'} wardrobe={wardrobe}/></div><div hidden={page!=='Stylist'}><SampleLookPreview model={looks} shopping={shopping}/></div><SavedLooksPanel model={looks} shopping={shopping} visible={page==='Saved looks'}/><ShoppingListPanel model={shopping} visible={page==='Saved looks'}/><WardrobePanel model={wardrobe} visible={page==='Wardrobe'}/>{page==='Profile'?<AccountPanel/>:null}
 </main><nav aria-label="Primary navigation">{destinations.map(name=><button key={name} aria-current={page===name?'page':undefined} onClick={()=>setPage(name)}>{name}</button>)}</nav></>;
}
