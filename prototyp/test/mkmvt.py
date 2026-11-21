import json, math, struct, os
fx=json.load(open('fixture.json'))
Z=14; EXT=4096
def tx(lon): return (lon+180)/360*2**Z
def ty(lat):
    s=math.sin(math.radians(lat)); return (0.5-math.log((1+s)/(1-s))/(4*math.pi))*2**Z
def varint(n):
    out=b''
    while True:
        b=n&0x7f; n>>=7
        if n: out+=bytes([b|0x80])
        else: out+=bytes([b]); return out
def key(f,t): return varint((f<<3)|t)
def ld(f,data): return key(f,2)+varint(len(data))+data
def zz(n): return (n<<1)^(n>>31)
def packed(vals): return b''.join(varint(v) for v in vals)
tiles={}
cls={'building':None}
for i,el in enumerate(fx['osm']['elements']):
    t=el['tags']; g=el['geometry']
    if 'building' in t: layer='building'; typ=3; props={}
    else:
        h=t['highway']; layer='transportation'; typ=2; props={'class':{'secondary':'secondary','residential':'minor','track':'track'}[h]}
    xs=[tx(p['lon']) for p in g]; ys=[ty(p['lat']) for p in g]
    for X in range(int(min(xs)),int(max(xs))+1):
        for Y in range(int(min(ys)),int(max(ys))+1):
            tiles.setdefault((X,Y),{}).setdefault(layer,[]).append((i,typ,props,[(round((x-X)*EXT),round((y-Y)*EXT)) for x,y in zip(xs,ys)]))
os.makedirs('tiles',exist_ok=True)
for (X,Y),layers in tiles.items():
    tile=b''
    for lname,feats in layers.items():
        keys=[];vals=[]
        fb=b''
        for (fid,typ,props,pts) in feats:
            tags=[]
            for k,v in props.items():
                if k not in keys: keys.append(k)
                if v not in vals: vals.append(v)
                tags+= [keys.index(k), vals.index(v)]
            if typ==3 and pts[0]==pts[-1]: pts=pts[:-1]
            geom=[ (1|(1<<3)), zz(pts[0][0]), zz(pts[0][1]) ]
            cx,cy=pts[0]
            geom.append(2|((len(pts)-1)<<3))
            for x,y in pts[1:]:
                geom+=[zz(x-cx),zz(y-cy)]; cx,cy=x,y
            if typ==3: geom.append(7|(1<<3))
            f=key(1,0)+varint(fid*10+1 if lname=='building' else fid)
            if tags: f+=ld(2,packed(tags))
            f+=key(3,0)+varint(typ)+ld(4,packed(geom))
            fb+=ld(2,f)
        L=key(15,0)+varint(2)+ld(1,lname.encode())+fb
        for k in keys: L+=ld(3,k.encode())
        for v in vals: L+=ld(4,ld(1,v.encode()))
        L+=key(5,0)+varint(EXT)
        tile+=ld(3,L)
    open(f'tiles/{Z}_{X}_{Y}.pbf','wb').write(tile)
print(len(tiles),'tiles')
