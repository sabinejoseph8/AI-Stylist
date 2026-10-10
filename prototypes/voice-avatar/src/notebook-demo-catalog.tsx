import React,{useState} from 'react';
import {createDemoAdapters} from './demo-catalog.ts';
import type {CatalogProduct} from './catalog-contract.ts';
export function NotebookDemoCatalog(){
 const [query,setQuery]=useState(''),[items,setItems]=useState<CatalogProduct[]>([]),[message,setMessage]=useState('Search the internal demo catalog.');
 async function search(){try{const groups=await Promise.all(createDemoAdapters().map(a=>a.search({text:query,limit:20})));const results=groups.flat();setItems(results);setMessage(results.length?`${results.length} synthetic ${results.length===1?'item':'items'}. These are not real products and cannot be purchased.`:'No demo items match. Try green, blue, shoes or bag.');}catch{setItems([]);setMessage('Demo search could not complete. Try again.');}}
 return <details className="camera-panel"><summary>Explore the synthetic catalog</summary><p>Internal development fixtures only. Original illustrations and sample prices do not represent real products, stock or retailer recommendations. No shopping links or checkout are available.</p>
 <form onSubmit={e=>{e.preventDefault();void search();}}><label>Search demo items<input maxLength={200} value={query} onChange={e=>setQuery(e.target.value)}/></label><button type="submit">Search demo catalog</button></form>
 <p role="status" aria-live="polite">{message}</p><div className="demo-catalog-grid">{items.map(item=><article key={`${item.sourceId}:${item.variantId}`}><img src={item.image.url} alt={`Original illustration: ${item.name}`} width="180" height="210"/><h3>{item.name}</h3><p>{item.category} · {item.colors.join(', ')} · Size {item.size??'not specified'}</p><p>Sample item price: {item.priceCents===null?'unknown':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(item.priceCents/100)}</p><p>Synthetic · Not purchasable · Availability unknown</p></article>)}</div></details>;
}
