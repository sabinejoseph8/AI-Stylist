import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
values={'HTML':(root/'ui/index.html').read_text(),'CSS':(root/'ui/style.css').read_text(),'JS':(root/'ui/app.js').read_text(),'DOCUMENTS':json.loads((root/'content/documents.json').read_text())}
(root/'worker/index.js').write_text('\n'.join('const '+k+' = '+json.dumps(v,ensure_ascii=False)+';' for k,v in values.items())+'\n'+(root/'worker/runtime.js').read_text())
