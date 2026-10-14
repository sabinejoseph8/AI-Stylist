import {expect,it} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {App} from '../src/web/app.tsx';
import {navigationClearance} from '../src/web/navigation-clearance.ts';
const css=readFileSync(new URL('../src/web/style.css',import.meta.url),'utf8');
const tokens=readFileSync(new URL('../src/web/tokens.css',import.meta.url),'utf8');
function luminance(hex:string){const rgb=hex.match(/\w\w/g)!.map(h=>parseInt(h,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const color=(name:string)=>tokens.match(new RegExp('--'+name+':(#[0-9a-fA-F]{6})'))![1];
it('has one named main landmark, one page heading, skip link and named navigation',()=>{const html=renderToStaticMarkup(React.createElement(App));expect(html.match(/<main[ >]/g)).toHaveLength(1);expect(html.match(/<h1[ >]/g)).toHaveLength(1);expect(html).toContain('aria-labelledby="page-heading"');expect(html).toContain('href="#main"');expect(html).toContain('aria-label="Primary navigation"');expect(html).toContain('aria-current="page"');expect(html).not.toContain('tabindex="1"');});
it.each(['ink','secondary','brand','success','attention','error'])('%s text retains at least 4.5 contrast on approved light surfaces',ink=>{for(const surface of ['canvas','surface','paper'])expect(contrast(color(ink),color(surface))).toBeGreaterThanOrEqual(4.5);});
it('primary text and focus outlines retain adequate token contrast',()=>{expect(contrast('#FFFFFF',color('brand'))).toBeGreaterThanOrEqual(4.5);for(const surface of ['canvas','surface','paper'])expect(contrast(color('focus'),color(surface))).toBeGreaterThanOrEqual(3);});
it('text sizes respect root preferences and use scalable units',()=>{expect(tokens).toContain('font-size:100%');expect(css).not.toMatch(/font(?:-size)?:\d+(?:\.\d+)?px/);expect(css).toContain('font:2.5rem/1.2');});
it('touch targets, form reflow and measured navigation clearance are explicit',()=>{expect(css).toContain('min-width:44px');expect(css).toContain('min-height:44px');expect(css).toContain('scroll-padding-block:1rem calc(var(--navigation-height');expect(css).toContain('padding-bottom:calc(var(--navigation-height');expect(css).toContain('.layout>*{min-width:0}');expect(css).toContain('overflow-wrap:anywhere');});
it('reduced motion suppresses transitions, repeated animation and smooth scrolling',()=>{expect(css).toMatch(/@media\(prefers-reduced-motion:reduce\).*animation-duration:\.01ms!important/);expect(css).toContain('animation-iteration-count:1!important');expect(css).toContain('transition-duration:.01ms!important');expect(css).toContain('scroll-behavior:auto!important');});
it.each([[0,'0px'],[72.4,'73px'],[180,'180px'],[10000,'10000px'],[-1,null],[NaN,null],[Infinity,null],[10001,null]])('safe navigation clearance for %s', (height,expected)=>{expect(navigationClearance(height as number)).toBe(expected);});
it('enlarged-text fixture is development-only and does not disable zoom',()=>{const html=readFileSync(new URL('./accessibility-zoom.html',import.meta.url),'utf8');expect(html).toContain('font-size:200%!important');expect(html).not.toMatch(/user-scalable=no|maximum-scale=1/);const config=readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8');expect(config).not.toContain('accessibility-zoom.html');});

it('navigation adapts its column count to scalable text without splitting words',()=>{expect(css).toContain('repeat(auto-fit,minmax(min(100%,4rem),1fr))');expect(css).toContain('overflow-wrap:normal');const html=renderToStaticMarkup(React.createElement(App));expect(html).toContain('class="navigation-items"');});
