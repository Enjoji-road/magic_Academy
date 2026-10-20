"""Exact rational point-light projection and opaque polygon-union verification.
Run at repository root. Spoilers are confined to research/fire.
No third-party dependencies. Coordinates: x across the wall, y lamp-to-wall,
z vertical; all lights and plate centres have z=0. Plates parallel to the wall.
"""
from fractions import Fraction as F
from itertools import combinations
import json,time
from pathlib import Path
STAR=[(0,-24),(7,-9),(24,-7),(11,4),(16,22),(0,12),(-16,22),(-11,4),(-24,-7),(-7,-9)]
WALL=F(12);LAMPS={'left':F(9),'right':F(15)}

def project(plate,side):
 x,y,w=map(F,(plate['x'],plate['y'],plate.get('width',1)))
 scale=WALL/y;cx=LAMPS[side]+(x-LAMPS[side])*scale
 return {'id':plate['id'],'center':cx,'width':w*scale,'scale':scale,'polygon':crest(cx,w*scale)}

def crest(center,width):return [(F(center)+F(x,48)*F(width),F(z,48)*F(width)) for x,z in STAR]

def edges(polys):return [(p[i],p[(i+1)%len(p)]) for p in polys for i in range(len(p))]

def critical_x(polys):
 es=edges(polys);xs={p[0] for poly in polys for p in poly}
 for (a,b),(c,d) in combinations(es,2):
  ax,ay=a;bx,by=b;cx,cy=c;dx,dy=d
  ux,uy=bx-ax,by-ay;vx,vy=dx-cx,dy-cy;den=ux*vy-uy*vx
  if not den:continue
  t=((cx-ax)*vy-(cy-ay)*vx)/den;s=((cx-ax)*uy-(cy-ay)*ux)/den
  if 0<=t<=1 and 0<=s<=1:xs.add(ax+t*ux)
 return sorted(xs)

def cross_section(polys,x):
 intervals=[]
 for poly in polys:
  zs=[]
  for a,b in edges([poly]):
   if min(a[0],b[0])<x<max(a[0],b[0]):zs.append(a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]))
  zs.sort()
  assert len(zs)%2==0
  intervals.extend(zip(zs[::2],zs[1::2]))
 intervals.sort();out=[]
 for lo,hi in intervals:
  if out and lo<=out[-1][1]:out[-1]=(out[-1][0],max(out[-1][1],hi))
  else:out.append((lo,hi))
 return tuple(out)

def same_region(a,b):
 # In each band between all edge intersections, union boundaries are linear.
 # Equality at two distinct interior x values proves equal boundary functions.
 if not a and not b:return True
 xs=critical_x(a+b)
 for lo,hi in zip(xs,xs[1:]):
  if lo==hi:continue
  for ratio in [F(1,3),F(2,3)]:
   x=lo+(hi-lo)*ratio
   if cross_section(a,x)!=cross_section(b,x):return False
 return True

def components(polys):
 groups=[]
 for poly in sorted(polys,key=lambda p:min(x for x,z in p)):
  lo=min(x for x,z in poly);hi=max(x for x,z in poly)
  if groups and lo<groups[-1]['hi']:
   groups[-1]['polys'].append(poly);groups[-1]['hi']=max(groups[-1]['hi'],hi)
  else:groups.append({'lo':lo,'hi':hi,'polys':[poly]})
 return groups

def make(plates,ink):
 projected={side:[project(p,side) for p in plates] for side in LAMPS}
 observed={side:[p['polygon'] for p in ps]+[crest(*ink)] for side,ps in projected.items()}
 unchanged=[]
 for a in components(observed['left']):
  for b in components(observed['right']):
   if a['lo']==b['lo'] and a['hi']==b['hi'] and same_region(a['polys'],b['polys']):unchanged.append((a['lo']+a['hi'])/2)
 candidates=[];one_view={s:[] for s in LAMPS}
 # Candidate painting centres include every actual projected/painted centre;
 # widths include both observed magnification classes. No owner input is used.
 centres=sorted({p['center'] for ps in projected.values() for p in ps}|{F(ink[0])})
 widths=sorted({p['width'] for ps in projected.values() for p in ps}|{F(ink[1])})
 for cx in centres:
  for w in widths:
   fits={s:same_region([p['polygon'] for p in ps]+[crest(cx,w)],observed[s]) for s,ps in projected.items()}
   for side,yes in fits.items():
    if yes:one_view[side].append([cx,w])
   if all(fits.values()):candidates.append([cx,w])
 groups={}
 for side,ps in projected.items():
  g={}
  for p in ps:g.setdefault(str(p['center']),[]).append(p['id'])
  groups[side]=g
 return {'projected':{s:[{k:v for k,v in p.items() if k!='polygon'} for p in ps] for s,ps in projected.items()},'same_full_images':unchanged,'painting_candidates':candidates,'single_view_candidates':one_view,'same_center_owners':groups,'visible_components':{s:len(components(v)) for s,v in observed.items()},'observed':observed}

PLATES=[{'id':'A','x':10,'y':4,'width':1},{'id':'B','x':14,'y':4,'width':1},{'id':'C','x':F(15,2),'y':6,'width':1},{'id':'D','x':F(27,2),'y':6,'width':1},{'id':'E','x':F(33,2),'y':6,'width':1}]
CASES={
 'A_five_coplanar':([{'id':chr(65+i),'x':x,'y':6,'width':1} for i,x in enumerate([F(9,2),F(15,2),F(21,2),F(27,2),F(33,2)])],(9,2)),
 'B_two_depths_containment':(PLATES,(6,2)),
 'C_partial_overlap':([dict(p,x=F(16)) if p['id']=='E' else dict(p) for p in PLATES],(6,2))
}

def serial(v):
 if isinstance(v,F):return int(v) if v.denominator==1 else str(v)
 if isinstance(v,dict):return{k:serial(x) for k,x in v.items()}
 if isinstance(v,(list,tuple)):return[serial(x) for x in v]
 return v

if __name__=='__main__':
 start=time.perf_counter();out={}
 for name,(plates,ink) in CASES.items():
  result=make(plates,ink);result.pop('observed');out[name]=serial(result)
  assert result['painting_candidates']==[[F(ink[0]),F(ink[1])]],(name,result['painting_candidates'])
  print(name,{k:out[name][k] for k in ['same_full_images','painting_candidates','visible_components']},flush=True)
 # All selected-view overlaps are true opaque containment, not additive darkening.
 selected=make(*CASES['B_two_depths_containment'])
 for side in LAMPS:
  by={}
  for p in selected['projected'][side]:by.setdefault(p['center'],[]).append(p)
  for centre,ps in by.items():
   if len(ps)>1:
    largest=max(ps,key=lambda p:p['width'])
    assert same_region([crest(p['center'],p['width']) for p in ps],[crest(largest['center'],largest['width'])])
 # Paint is fully covered by a genuine shadow in the left observation.
 assert same_region(selected['observed']['left'][:-1],selected['observed']['left'])
 # Removing C leaves pixels unchanged, but makes left-only ownership reasoning decisive.
 no_c=make([p for p in PLATES if p['id']!='C'],(6,2))
 out['ablation_remove_C']={'same_observed_pixels':all(same_region(selected['observed'][s],no_c['observed'][s]) for s in LAMPS),'left_only_candidates':serial(no_c['single_view_candidates']['left'])}
 out['model']={'light':'single point source; inactive lamp shutter closed','wall_y':12,'lamp_x':serial(LAMPS),'plate_width':1,'plate_centres_z':0,'opaque_union':'exact rational polygon cross sections; no opacity summation','seconds':round(time.perf_counter()-start,3)}
 Path('research/fire/projection-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
 print('Verification saved',flush=True)
