import asyncio, json
from playwright.async_api import async_playwright
fx=json.load(open('fixture.json'))
STUB="""
window.__center=[11.211,49.8514];window.__zoom=15.3;
window.maplibregl={NavigationControl:function(){},Map:function(o){const self=this;const H={};
 this.on=(e,f)=>{(H[e]=H[e]||[]).push(f);if(e==='load')setTimeout(f,10)};
 this.addControl=()=>{};this.resize=()=>{};
 this.getCenter=()=>({lng:window.__center[0],lat:window.__center[1]});
 this.unproject=([x,y])=>{const el=document.getElementById('map');const W=el.clientWidth,Hh=el.clientHeight;const s=0.00003;return {lng:window.__center[0]+(x-W/2)*s,lat:window.__center[1]-(y-Hh/2)*s*0.64}};
 this.flyTo=()=>{};this.fitBounds=()=>{};}};
"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':1400,'height':950})
        errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        calls=[]
        async def handle(route):
            req=route.request
            if 'interpreter' in req.url:
                calls.append(req.post_data[:200])
                await route.fulfill(status=200,content_type='application/json',body=json.dumps(fx['osm']))
            elif 'maplibre-gl.js' in req.url:
                await route.fulfill(status=200,content_type='application/javascript',body=STUB)
            else:
                await route.fulfill(status=404,body='')
        await pg.route('**/*',lambda r: handle(r) if not r.request.url.startswith('file:') else r.continue_())
        await pg.goto('file:///home/claude/proto/Kartenstudio_Prototyp.html'); await pg.wait_for_timeout(500)
        await pg.click('#gen'); await pg.wait_for_timeout(800)
        print('A', await pg.evaluate("()=>[DATA.feats.length,DATA.MH, document.getElementById('v2').classList.contains('hidden')]"))
        await pg.click('[data-grp="frame"]')
        await pg.click('#tab1'); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{window.__center=[11.215,49.853]}")
        await pg.select_option('#aspect','1')
        await pg.click('#gen'); await pg.wait_for_timeout(800)
        print('B', await pg.evaluate("()=>[DATA.feats.length,DATA.MH, document.getElementById('v2').classList.contains('hidden'), document.getElementById('genmsg').textContent]"))
        print(calls)
        print('errors',errs)
        await b.close()
asyncio.run(main())
