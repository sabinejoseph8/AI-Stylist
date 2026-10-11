import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {budgetEditValue,noteEditVersion,NotebookConnectionEditor} from '../src/notebook-connection-editor.tsx';
import {NotebookState} from '../src/notebook-state.ts';
import {encodeNoteUpdate} from '../src/note-update-wire.ts';
import type {PreparedBrowserNoteSession} from '../src/note-browser-session.ts';
describe('rehearsal touch editor',()=>{
 it.each(['','-1','1e2','NaN','Infinity','100001','1.001','500 USD'])('does not infer a budget from %s',value=>expect(budgetEditValue(value,true)).toBeNull());
 it('requires explicit scope and produces a bounded USD item maximum',()=>{expect(budgetEditValue('350',false)).toBeNull();expect(budgetEditValue('350.25',true)).toBe('USD 350.25 maximum (items only)');expect(budgetEditValue('0',true)).toBe('USD 0 maximum (items only)');});
 it('binds drafts to the connection and displayed field version',()=>{const state=new NotebookState();state.edit('color','Blue');const notes=encodeNoteUpdate('s1',1,state.snapshot(),null);const version=noteEditVersion(notes,'color');state.edit('color','Green');expect(version).toEqual({sessionId:'s1',notebookSession:1,revision:1});});
 it('provides seven labelled edit controls and separate confirmation for tentative nonbudget notes',()=>{const state=new NotebookState();state.capture({session:1,field:'style',baseRevision:0,sequence:1,value:'Structured',confirmed:false});state.capture({session:1,field:'budget',baseRevision:0,sequence:1,value:'500',confirmed:false});const html=renderToStaticMarkup(<NotebookConnectionEditor notes={encodeNoteUpdate('s1',1,state.snapshot(),null)} ready={false} session={{} as PreparedBrowserNoteSession}/>);expect(html.match(/aria-label="Edit rehearsal /g)).toHaveLength(7);expect(html).toContain('Confirm rehearsal style');expect(html).not.toContain('Confirm rehearsal budget');expect(html).toContain('aria-labelledby="connection-edit-title"');expect(html).toContain('It does not save a customer preference or approve a look');expect(html.match(/disabled=""/g)).toHaveLength(9);});
});
