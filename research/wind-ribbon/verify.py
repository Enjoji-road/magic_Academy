"""Independent topology, geometry, reading and visibility checks (spoilers).
Does not import or execute the browser's model or answer checker.
Python 3 + numpy, results written beside this script.
"""
from pathlib import Path
import json, math, re, itertools
import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
data = json.loads(re.search(r"const DATA = (\{.*?\});", (ROOT/'wind-ribbon-data.js').read_text(), re.S)[1])
G=data['geometry'];N=data['stations'];L=2*G['straight']+2*math.pi*G['radius']
def smooth(t):
    t=np.clip(t,0,1);return t*t*(3-2*t)
def independent_point(s,v,wind='still'):
    s,v=np.broadcast_arrays(s,v);l=s*L;d=G['straight'];r=G['radius']
    x=np.zeros_like(l);z=np.zeros_like(l);nx=np.zeros_like(l);nz=np.zeros_like(l)
    a=l<=d;b=(l>d)&(l<=d+math.pi*r);c=(l>d+math.pi*r)&(l<=2*d+math.pi*r);e=~(a|b|c)
    x[a]=-d/2+l[a];z[a]=0;nx[a]=0;nz[a]=1
    t=(l[b]-d)/r;x[b]=d/2+r*np.sin(t);z[b]=-r+r*np.cos(t);nx[b]=np.sin(t);nz[b]=np.cos(t)
    x[c]=d/2-(l[c]-d-math.pi*r);z[c]=-2*r;nx[c]=0;nz[c]=-1
    t=(l[e]-2*d-math.pi*r)/r;x[e]=-d/2-r*np.sin(t);z[e]=-r-r*np.cos(t);nx[e]=-np.sin(t);nz[e]=-np.cos(t)
    angle=math.pi*smooth((s-G['twistStart'])/(G['twistEnd']-G['twistStart']))
    dz=v*G['halfWidth']*np.sin(angle)*nz
    x=x+v*G['halfWidth']*np.sin(angle)*nx;z=z+dz
    y=G['taskY']+v*G['halfWidth']*np.cos(angle)+G['shear']*z
    w=data['winds'][wind] if isinstance(wind,str) else wind
    z=z+w[2]*smooth((np.abs(y-G['taskY'])-40)/25)*(1-smooth((np.abs(x)-240)/40))
    yy=y-G['taskY'];radius=np.hypot(yy,z);a=w[1]*smooth((radius-85)/200)
    y=G['taskY']+np.cos(a)*yy-np.sin(a)*z;z=np.sin(a)*yy+np.cos(a)*z;x=x+w[0]*z
    return np.stack([x,y,z],axis=-1)
def projection(p,view):
    a,b=data['views'][view];x=np.cos(a)*p[...,0]+np.sin(a)*p[...,2];z=-np.sin(a)*p[...,0]+np.cos(a)*p[...,2]
    return np.stack([x,np.cos(b)*p[...,1]-np.sin(b)*z,np.sin(b)*p[...,1]+np.cos(b)*z],axis=-1)

# The boundary of a rectangle with the reversed short ends identified.
def vertex(s,e,twisted=True):
    if s==N:return (0,-e if twisted else e)
    return (s,e)
def adjacency(twisted=True):
    graph={}
    for e in(-1,1):
        for i in range(N):
            a,b=vertex(i,e,twisted),vertex(i+1,e,twisted)
            graph.setdefault(a,set()).add(b);graph.setdefault(b,set()).add(a)
    return graph
def components(graph):
    unseen=set(graph);groups=[]
    while unseen:
        todo=[next(iter(unseen))];group=set()
        while todo:
            q=todo.pop()
            if q in group:continue
            group.add(q);todo.extend(graph[q]-group)
        groups.append(group);unseen-=group
    return groups
def read(twisted=True,direction=1,omit=None):
    graph=adjacency(twisted);start=(data['start']['station'],data['start']['edge']);stop=(data['stop']['station'],data['stop']['edge'])
    prev=(start[0]-direction,start[1]);cur=start;letters=[];visited=[]
    glyphs={(g['station'],g['edge']):g for g in data['glyphs']}
    while cur not in visited:
        if cur==stop:break
        visited.append(cur)
        if cur in glyphs:
            g=glyphs[cur];letters.append('?' if omit and omit(g) else g['text'])
        choices=graph[cur]-{prev};assert len(choices)==1
        prev,cur=cur,next(iter(choices))
    return ''.join(letters),visited

def mesh(wind,ns=184,nv=10):
    ss,vv=np.meshgrid(np.linspace(0,1,ns+1),np.linspace(-1,1,nv+1),indexing='ij')
    p=independent_point(ss,vv,wind);tris=[]
    for i in range(ns):
        for j in range(nv):
            tris.extend([[p[i,j],p[i+1,j],p[i+1,j+1]],[p[i,j],p[i+1,j+1],p[i,j+1]]])
    for support in data['supports']:
        lo,hi=support['min'],support['max'];p=np.array([[hi[i] if k&(1<<i) else lo[i] for i in range(3)] for k in range(8)])
        for a,b,c,d in ((0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)):
            tris.extend([[p[a],p[b],p[c]],[p[a],p[c],p[d]]])
    return np.array(tris)
def visible(world_point,triangles,view):
    tri=projection(triangles,view);p=projection(world_point,view);a,b,c=tri[:,0],tri[:,1],tri[:,2]
    u=b[:,:2]-a[:,:2];v=c[:,:2]-a[:,:2];w=p[:2]-a[:,:2]
    den=u[:,0]*v[:,1]-u[:,1]*v[:,0];good=np.abs(den)>1e-9
    beta=np.divide(w[:,0]*v[:,1]-w[:,1]*v[:,0],den,out=np.zeros_like(den),where=good)
    gamma=np.divide(u[:,0]*w[:,1]-u[:,1]*w[:,0],den,out=np.zeros_like(den),where=good)
    hit=good&(beta>=-1e-7)&(gamma>=-1e-7)&(beta+gamma<=1+1e-7)
    depths=a[:,2]+beta*(b[:,2]-a[:,2])+gamma*(c[:,2]-a[:,2])
    return not np.any(hit&(depths>p[2]+1.25))

results={}
graph=adjacency();groups=components(graph)
assert len(groups)==1 and len(groups[0])==2*N
assert all(len(n)==2 for n in graph.values())
assert len(components(adjacency(False)))==2
# Quotient rectangular grid: chi=V-E+F=0, and one boundary component.
ns,nv=100,10
V=ns*(nv+1);E=ns*(nv+1)+ns*nv;F=ns*nv
assert V-E+F==0
answer,path=read();assert len(path)<2*N and answer=='よあけをつぐいと'
assert all((g['station'],g['edge']) in path for g in data['glyphs'])
results['topology']={'connected_surfaces':1,'boundary_components':len(groups),'boundary_vertices':2*N,'euler_characteristic':V-E+F,'orientable':False,'ordinary_ring_boundary_components':2}
results['reading']={'answer':answer,'glyph_count':len(answer),'task_omitted':read(omit=lambda g:data['task']['from']<=g['station']<=data['task']['to'])[0],'twist_omitted':read(twisted=False)[0],'reversed':read(direction=-1)[0],'permutations_of_visible_glyphs':math.factorial(len(answer))}
results['reading']['single_glyph_ablation']={g['id']:read(omit=lambda h,g=g:h['id']==g['id'])[0] for g in data['glyphs']}
assert results['reading']['task_omitted'].count('?')==4
assert results['reading']['twist_omitted']!=answer
results['reading']['raw_kana_completions_if_task_letters_unknown']=46**4
results['reading']['cognitive_necessity_proven']=False
results['reading']['reason']='Tracing the actual edge without naming its topology is valid. Dictionary guessing and mental discovery cannot be ruled out by permutation counts.'

seam_error=0.;pin_error=0.;collision_count=0;normal_loop_dots=[]
vv=np.linspace(-1,1,101)
for wind in data['winds']:
    seam_error=max(seam_error,float(np.max(np.abs(independent_point(0*vv,vv,wind)-independent_point(1+0*vv,-vv,wind)))))
    s,v=np.meshgrid(np.linspace(.02,.235,20),np.linspace(-.5,.5,11),indexing='ij')
    pin_error=max(pin_error,float(np.max(np.abs(independent_point(s,v,wind)-independent_point(s,v,'still')))))
    eps=1e-7
    normals=[]
    for end in (0,1):
        a=independent_point(float(end),0.,wind)
        tangent=(independent_point(eps,0.,wind)-a)/eps if end==0 else (a-independent_point(1-eps,0.,wind))/eps
        across=(independent_point(float(end),eps,wind)-independent_point(float(end),-eps,wind))/(2*eps)
        normal=np.cross(tangent,across);normals.append(normal/np.linalg.norm(normal))
    normal_loop_dots.append(float(np.dot(*normals)))
assert seam_error<1e-9 and pin_error<1e-9
assert all(abs(dot+1)<1e-8 for dot in normal_loop_dots)
# Every intermediate transition, not merely the four endpoints.
ss,vv=np.meshgrid(np.linspace(0,1,501),np.linspace(-1,1,31),indexing='ij')
for a,b in itertools.product(data['winds'].values(),repeat=2):
    for t in np.linspace(0,1,11):
        w=(1-t)*np.array(a)+t*np.array(b);p=independent_point(ss,vv,w)
        for box in data['supports']:
            collision_count+=int(np.count_nonzero(np.all((p>box['min'])&(p<box['max']),axis=-1)))
assert collision_count==0
results['geometry']={'seam_max_error':seam_error,'fixed_printed_core_max_displacement':pin_error,'half_width':G['halfWidth'],'stadium_tube_radius':G['radius'],'base_embedding_proof':'The radius-70 strip is contained in the embedded radius-180 normal tube of the stadium. The material s coordinate is unique. Three invertible ambient maps preserve injectivity.','deformation':'z shear; radial rotation; x shear. Each determinant is 1. Elastic kinematics, not CFD or inextensible cloth dynamics.','sampled_support_collisions':collision_count,'transition_samples':16*11*501*31,'limits':'Solid supports checked by dense sampling, not a continuous interval collision proof. Mesh depth ordering is a rendering approximation.'}
results['geometry']['surface_normal_after_one_centreline_loop_dot']=normal_loop_dots

visibility={};union=set();still=set()
for wind in data['winds']:
    triangles=mesh(wind)
    for view in data['views']:
        ids=[]
        for g in data['glyphs']:
            p=independent_point(g['station']/N,g['edge']*.78,wind)
            if visible(p,triangles,view):ids.append(g['id']);union.add(g['id'])
        visibility[f'{wind}/{view}']=ids
        if wind=='still':still.update(ids)
assert len(union)==len(data['glyphs'])
assert len(still)<len(data['glyphs'])
results['visibility']={'glyph_centres_visible_by_state':visibility,'all_glyphs_in_union':True,'static_view_union':sorted(still),'wind_essential_for_glyph_centres':len(still)<len(data['glyphs']),'limits':'Centre-ray test does not prove font legibility, whole-glyph visibility, or that the player interprets a connection. Static topology shortcuts must still be tested by humans.'}
critical=next(g for g in data['glyphs'] if g['id']=='g3')
footprint={}
for wind in data['winds']:
    triangles=mesh(wind)
    for view in data['views']:
        count=0
        for du,dv in itertools.product(np.linspace(-14,14,5),repeat=2):
            p=independent_point(critical['station']/N+du/L,critical['edge']*.78+dv/70,wind)
            count+=visible(p,triangles,view)
        footprint[f'{wind}/{view}']=int(count)
assert all(footprint['still/'+v]==0 for v in data['views'])
assert max(footprint.values())==25
results['visibility']['critical_glyph_25_sample_footprint']=footprint

# Export reference samples to compare against the JS implementation separately.
samples=[]
for wind in data['winds']:
    for s in (0,.02,.08,.19,.235,.29,.355,.4,.43,.49,.5,.56,.66,.69,.91,1):
        for v in (-1,-.72,0,.72,1):samples.append({'s':s,'v':v,'wind':wind,'point':independent_point(np.array(s),np.array(v),wind).tolist()})
(HERE/'independent-geometry-samples.json').write_text(json.dumps(samples,ensure_ascii=False,indent=2)+'\n')
(HERE/'verification.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(results,ensure_ascii=False,indent=2))
