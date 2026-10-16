#!/usr/bin/env python3
"""Import a read-only Markdown snapshot. Does not change project documents."""
from pathlib import Path
import json,re,html,sys,hashlib,subprocess
root=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[3]
files={'product':'Project Memory/product-spec.md','design':'Project Memory/design.md','tech':'Project Memory/tech-spec.md','plan':'docs/progress.md'}
def inline(t):
 t=html.escape(t)
 t=re.sub(r'`([^`]+)`',r'<code>\1</code>',t)
 t=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',t)
 t=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',lambda m:'<a href="'+m.group(2)+'" target="_blank" rel="noopener noreferrer">'+m.group(1)+'</a>' if m.group(2).startswith('https://') else m.group(1),t)
 return t

def render(md):
 lines=md.splitlines();out=[];i=0
 while i<len(lines):
  l=lines[i].strip()
  if not l:i+=1;continue
  if l.startswith('```'):
   block=[];i+=1
   while i<len(lines) and not lines[i].strip().startswith('```'):block.append(lines[i]);i+=1
   out.append('<pre><code>'+html.escape('\n'.join(block))+'</code></pre>');i+=1;continue
  h=re.match(r'^(#{1,6}) (.*)',l)
  if h:out.append('<h'+str(min(len(h[1])+1,6))+'>'+inline(h[2])+'</h'+str(min(len(h[1])+1,6))+'>');i+=1;continue
  if l.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    row=[c.strip() for c in lines[i].strip().strip('|').split('|')]
    if not all(re.fullmatch(r':?-+:?',c) for c in row):rows.append(row)
    i+=1
   out.append('<div class="table-scroll"><table>'+''.join('<tr>'+''.join(('<th>' if k==0 else '<td>')+inline(c)+('</th>' if k==0 else '</td>') for c in r)+'</tr>' for k,r in enumerate(rows))+'</table></div>');continue
  if re.match(r'^(- |\d+\. )',l):
   items=[]
   while i<len(lines) and re.match(r'^(- |\d+\. )',lines[i].strip()):
    items.append(re.sub(r'^(- |\d+\. )','',lines[i].strip()));i+=1
   out.append('<ul>'+''.join('<li>'+inline(c)+'</li>' for c in items)+'</ul>');continue
  paragraph=[l];i+=1
  while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|- |\d+\. )',lines[i].strip()):paragraph.append(lines[i].strip());i+=1
  out.append('<p>'+inline(' '.join(paragraph).replace('\\',''))+'</p>')
 return '\n'.join(out)

def sections(md,pattern):
 matches=list(re.finditer(pattern,md,re.M))
 return [{'title':m.group(1),'text':md[m.end():matches[j+1].start() if j+1<len(matches) else len(md)].strip()} for j,m in enumerate(matches)]
docs={}
for key,file in files.items():
 text=(root/file).read_text();docs[key]={'path':file,'markdown':text,'html':render(text),'digest':hashlib.sha256(text.encode()).hexdigest()}
product=sections(docs['product']['markdown'],r'^### (PS-\d+:[^\n]+)')
# End the last requirement before the subsequent acceptance section.
for p in product:p['text']=p['text'].split('\n## ')[0];p['html']=render(p['text'])
design=docs['design']['markdown']
principles=re.findall(r'^\d+\. \*\*([^*]+)\*\* (.*)',design,re.M)
palette=[]
for name,value,use in re.findall(r'^\| ([^|]+) \| `(#\w{6})` \| ([^|]+) \|',design,re.M):palette.append({'name':name.strip(),'hex':value,'use':use.strip()})
components=sections(design.split('## Main UI components\n')[1].split('\n## Required interface states')[0],r'^### ([^\n]+)')
for c in components:c['html']=render(c['text'])
plan=docs['plan']['markdown'];phases=[];tasks=[];seen=set();phase=None
for line in plan.splitlines():
 m=re.match(r'^## Phase (\d+): (.*)',line)
 if m:phase={'number':int(m[1]),'title':m[2],'tasks':[]};phases.append(phase)
 t=re.match(r'^- \[([ x])\] (.*)',line)
 if not t or not phase:continue
 idmatch=re.match(r'(?:\*\*)?([1-8][a-f]|D\d+|X\d+)[: ]',t[2])
 if not idmatch:continue
 taskid=idmatch[1]
 if taskid in seen:continue
 seen.add(taskid)
 clean=t[2].replace('**','');title,sep,body=clean.partition('. ')
 task={'id':taskid,'phase':phase['number'],'title':title,'description':body,'sourceDone':t[1]=='x','sourceHash':hashlib.sha256(clean.encode()).hexdigest()[:16]}
 tasks.append(task);phase['tasks'].append(taskid)
# Preserve exact phase verification sections without the dated evidence diary.
phasechunks=sections(plan,r'^## (Phase \d+:[^\n]+)')
for phase,chunk in zip(phases,phasechunks):
 text=chunk['text'].split('\n## ')[0]
 auto=re.search(r'### Focused automated tests[^\n]*\n(.*?)(?=\n### |\Z)',text,re.S)
 manual=re.search(r'### Manual verification[^\n]*\n(.*?)(?=\n### |\Z)',text,re.S)
 phase['automatedHtml']=render(auto[1]) if auto else '<p>See the complete plan for the phase checks.</p>'
 phase['manualHtml']=render(manual[1]) if manual else '<p>See the complete plan for the manual verification steps.</p>'
 phase['dependency']=next((l.split('**Dependencies:**',1)[1].strip() for l in text.splitlines() if '**Dependencies:**' in l),'Follow the preceding phase exit gate.')
summary_match=re.search(r'^## Summary\s*\n+(.*?)(?=\n\s*\n|\Z)',plan,re.M|re.S)
current_checkpoint=summary_match[1].strip() if summary_match else 'The plan summary is unavailable. Read the complete source plan for current evidence.'
source_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
snapshot_date=subprocess.check_output(['git','show','-s','--format=%cs',source_commit],cwd=root,text=True).strip()
data={'currentCheckpoint':current_checkpoint,'snapshot':snapshot_date,'sourceCommit':source_commit,'docs':docs,'requirements':product,'principles':[{'title':a.rstrip('.'),'description':b} for a,b in principles],'palette':palette,'components':components,'phases':phases,'tasks':tasks}
Path('content/documents.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
# Keep the local served artifact aligned; this does not deploy or publish.
subprocess.run([sys.executable,str(Path(__file__).resolve().parent/'build-worker.py')],check=True)
print(f'Imported 4 documents, {len(product)} requirements, {len(palette)} colors, {len(tasks)} tasks in {len(phases)} phases.')
