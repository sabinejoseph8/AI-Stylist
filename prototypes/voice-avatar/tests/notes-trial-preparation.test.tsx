import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {NotesTrialPreparation} from '../src/notes-trial-preparation.tsx';
import {createNotebookRehearsal} from '../src/note-browser-rehearsal.ts';
describe('private notes trial preparation page',()=>{
 it('shows the full boundary and instructions before any action, with start disabled',()=>{
  const html=renderToStaticMarkup(<NotesTrialPreparation/>);
  expect(html).toContain('Live testing is disabled');expect(html).toContain('no microphone, camera, network connection or paid service');
  expect(html).toContain('Provider retention terms apply');expect(html).toContain('additional $2 allowance has not been approved');
  expect(html).toContain('85 seconds including setup');expect(html).toContain('Read all steps first');expect(html.match(/<li>/g)).toHaveLength(6);
  expect(html).toContain('disabled="">Start local rehearsal');expect(html).not.toContain('checked=""');
 });
 it('rehearses two budget turns and touch confirmation without network or media',async()=>{
  let status='';const owner=createNotebookRehearsal({simulation:true,scenario:'budget',page:new EventTarget(),visibility:Object.assign(new EventTarget(),{hidden:false}),changed:()=>{},status:s=>{status=s.state;}});
  async function wait(check:()=>boolean){const start=Date.now();while(!check()){if(Date.now()-start>4000)throw Error('Fixture did not settle');await new Promise(r=>setTimeout(r,20));}}
  try{
   await wait(()=>status==='ready');expect(await owner.play()).toBe(true);
   await wait(()=>status==='ready'&&owner.session.snapshot().connection.notes?.notes.budget.value==='USD 500 maximum (items only)');
   expect(await owner.play()).toBe(true);
   await wait(()=>status==='ready'&&owner.session.snapshot().connection.notes?.notes.budget.value==='USD 350 maximum (items only)');
   expect(owner.session.edit('budget','USD 350 maximum (items only)')).toBe(true);
   await wait(()=>owner.session.snapshot().connection.notes?.notes.budget.status==='confirmed');
   expect(await owner.play()).toBe(false);owner.dispose();expect(owner.session.snapshot().ended).toBe(true);expect(owner.session.snapshot().connection.notes).toBeNull();
  }finally{owner.dispose();}
 });
});
