import asyncio, json, os
from playwright.async_api import async_playwright
STUB=open('t2.py').read().split('STUB="""')[1].split('"""')[0]
STUB=STUB.replace("this.flyTo=()=>{};","""this.flyTo=()=>{};this.jumpTo=()=>{};window.__lastOpts=o;
 this.once=(e,f)=>{if(e==='idle')setTimeout(f,30)};this.remove=()=>{};
 this.getCanvas=()=>{const c=document.createElement('canvas');const w=o.container.clientWidth,h=o.container.clientHeight;c.width=Math.round(w*(o.pixelRatio||1));c.height=Math.round(h*(o.pixelRatio||1));const x=c.getContext('2d');x.fillStyle=o.style&&o.style.sources&&o.style.sources.sat?'#4a5a3a':'#f2efe9';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#e08a3c';x.lineWidth=30;x.beginPath();x.moveTo(0,0);x.lineTo(c.width,c.height);x.stroke();x.fillStyle='#333';x.font='60px sans-serif';x.fillText('Siegritz',c.width/2,c.height/2);return c};""")
STYLE={"version":8,"sources":{"openmaptiles":{"type":"vector","url":"https://tiles.openfreemap.org/planet"}},"layers":[{"id":"background","type":"background","paint":{"background-color":"#f8f4f0"}},{"id":"road","type":"line","source":"openmaptiles","source-layer":"transportation"},{"id":"place","type":"symbol","source":"openmaptiles","source-layer":"place","paint":{"text-color":"#333"}}]}
PHOTON={"features":[{"geometry":{"coordinates":[11.2111,49.8514]},"properties":{"name":"Siegritz","county":"Landkreis Bamberg","state":"Bayern","country":"Deutschland","osm_value":"village"}}]}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1440,'height':900})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        async def handle(route):
            u=route.request.url
            if u=='https://tiles.openfreemap.org/planet':
                await route.fulfill(status=200,content_type='application/json',body=json.dumps({'tiles':['https://tiles.openfreemap.org/planet/x/{z}/{x}/{y}.pbf'],'maxzoom':14}))
            elif '/styles/' in u: await route.fulfill(status=200,content_type='application/json',body=json.dumps(STYLE))
            elif '/planet/x/' in u:
                z,x,y=u.split('/planet/x/')[1].replace('.pbf','').split('/'); fn=f'tiles/{z}_{x}_{y}.pbf'
                if os.path.exists(fn): await route.fulfill(status=200,body=open(fn,'rb').read())
                else: await route.fulfill(status=204,body='')
            elif 'photon' in u: await route.fulfill(status=200,content_type='application/json',body=json.dumps(PHOTON))
            elif 'maplibre-gl.js' in u: await route.fulfill(status=200,content_type='application/javascript',body=STUB)
            else: await route.fulfill(status=404,body='')
        await pg.route('**/*',lambda r: asyncio.ensure_future(handle(r)) if not r.request.url.startswith('file:') else r.continue_())
        await pg.goto('file:///home/claude/proto/Kartenstudio_Prototyp.html'); await pg.wait_for_timeout(300)
        await pg.fill('#lq','Siegritz'); await pg.click('#lgo'); await pg.wait_for_timeout(300)
        await pg.click('#lresults button'); await pg.wait_for_timeout(300)
        await pg.click('#gen'); await pg.wait_for_function("()=>DATA&&document.getElementById('picker').classList.contains('hidden')",timeout=10000)
        await pg.click('.sec[data-s=stil] .sh'); await pg.wait_for_timeout(200)
        await pg.click('#styles button[data-p=mittelmeer]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path='s1.png')
        await pg.click('#styles button[data-p=cyber]'); await pg.click('details.cust summary'); await pg.wait_for_timeout(200)
        await pg.screenshot(path='s2.png')
        await pg.click('#modeTabs button[data-m=std]'); await pg.wait_for_timeout(200)
        await pg.click('#bases button[data-b=satellit]'); await pg.wait_for_timeout(800)
        print('lastopts', await pg.evaluate("()=>({pr:__lastOpts.pixelRatio,zoom:__lastOpts.zoom,w:__lastOpts.container.style.width,src:Object.keys(__lastOpts.style.sources),vis:__lastOpts.style.layers.map(l=>l.id+':'+(l.layout&&l.layout.visibility))})"))
        await pg.screenshot(path='s3.png')
        await pg.click('.sec[data-s=elemente] .sh'); await pg.wait_for_timeout(200); await pg.screenshot(path='s4.png')
        await pg.click('#undo'); await pg.wait_for_timeout(300); await pg.click('#redo'); await pg.wait_for_timeout(300)
        await pg.click('#dlBtn'); 
        async with pg.expect_download() as d: await pg.click('#dlGo')
        dl=await d.value; await dl.save_as('s_out.png'); print('png ok')
        print('state',await pg.evaluate("()=>[S.mode,S.base,S.preset,RASTER.size]"))
        print('errors',errs)
        await b.close()
asyncio.run(main())
