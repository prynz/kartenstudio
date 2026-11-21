# Baut prototyp/Kartenstudio_Prototyp.html aus shell.html + script.js + Schriften
import base64, pathlib
here=pathlib.Path(__file__).parent; root=here.parent.parent
bb=lambda f:base64.b64encode((root/'design'/f).read_bytes()).decode()
sh=(here/'shell.html').read_text(); js=(here/'script.js').read_text()
t=sh.replace('__SCRIPT__',js).replace('__XB__',bb('inter-xb.woff')).replace('__MD__',bb('inter-md.woff')).replace('__FR__',bb('frak.woff'))
(root/'prototyp'/'Kartenstudio_Prototyp.html').write_text(t); print('fertig')
