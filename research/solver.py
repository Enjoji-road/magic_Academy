"""Spoilers: exact-cover search for the earth examination. Python 3, stdlib only."""
from dataclasses import dataclass
from collections import defaultdict
import json, time

N=6
BASE={
 'A':[(0,0),(1,0)],
 'B':[(0,0),(1,0),(2,0)],
 'C':[(0,0),(1,0),(0,1),(1,1)],
 'D':[(0,0),(0,1),(0,2),(1,2)],
 'E':[(0,0),(1,0),(2,0),(1,1)],
 'F':[(1,0),(2,0),(0,1),(1,1)],
 'G':[(0,0),(1,0),(0,1),(1,1),(0,2)],
 'H':[(0,0),(2,0),(0,1),(1,1),(2,1)],
 'I':[(0,0),(0,1),(0,2),(1,2),(2,2)],
}

def transform(shape, rot=0, flip=False):
    points=[(-x if flip else x,y) for x,y in shape]
    for _ in range(rot):points=[(-y,x) for x,y in points]
    mx=min(x for x,y in points); my=min(y for x,y in points)
    return tuple(sorted((x-mx,y-my) for x,y in points))

def orientations(shape):return sorted({transform(shape,r,f) for r in range(4) for f in [False,True]})

def bit(x,y):return 1<<(y*N+x)

def neighbors(mask):
    out=0
    for q in range(N*N):
        if mask>>q&1:
            x=q%N;y=q//N
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                if 0<=x+dx<N and 0<=y+dy<N:out|=bit(x+dx,y+dy)
    return out&~mask

@dataclass(frozen=True)
class Placement:
    id:str
    cells:tuple
    mask:int
    rim:int
    orientation:tuple
    x:int
    y:int


def all_placements(shapes=None):
    shapes=BASE if shapes is None else shapes
    out={}
    for k,shape in shapes.items():
        arr=[]
        for s in orientations(shape):
            w=max(x for x,y in s)+1;h=max(y for x,y in s)+1
            for y in range(N-h+1):
                for x in range(N-w+1):
                    cells=tuple((x+dx,y+dy) for dx,dy in s)
                    mask=sum(bit(x,y) for x,y in cells)
                    arr.append(Placement(k,cells,mask,neighbors(mask),s,x,y))
        out[k]=arr
    return out

PLACEMENTS=all_placements()

def search(rule=True, pins=None, fixed=None, cap=None, collect=True):
    """Enumerates each placement once; orientations of identical geometry deduplicated.
    pins: {piece_id: (local_mark_cell, target_board_cell)}. Marks transform with stone.
    fixed: {piece_id: exact mask}.
    """
    pins=pins or {};fixed=fixed or {}
    bycell=[[] for _ in range(N*N)]
    for k,arr in PLACEMENTS.items():
        for p in arr:
            if k in fixed and p.mask!=fixed[k]:continue
            if k in pins:
                local,target=pins[k]
                ok=False
                for f in [False,True]:
                    for r in range(4):
                        full=transform(BASE[k],r,f)
                        if full!=p.orientation:continue
                        pts=[(-x if f else x,y) for x,y in BASE[k]]
                        mark=(-local[0] if f else local[0],local[1])
                        for _ in range(r):
                            pts=[(-y,x) for x,y in pts];mark=(-mark[1],mark[0])
                        mx=min(x for x,y in pts);my=min(y for x,y in pts)
                        if (mark[0]-mx+p.x,mark[1]-my+p.y)==tuple(target):ok=True
                if not ok:continue
            idx=ord(k)-65
            for x,y in p.cells:bycell[y*N+x].append((idx,p))
    total=0;solutions=[];nodes=0
    sizes={k:len(v) for k,v in BASE.items()}
    full=(1<<(N*N))-1
    def dfs(occupied,used,tri,four,other,selected):
        nonlocal total,nodes
        nodes+=1
        if occupied==full:
            total+=1
            if collect:solutions.append(dict(selected))
            return bool(cap and total>=cap)
        best=None
        empty=full^occupied
        while empty:
            b=empty&-empty; cell=b.bit_length()-1;empty-=b
            opts=[]
            for idx,p in bycell[cell]:
                if used>>idx&1 or p.mask&occupied:continue
                n=sizes[p.id]
                if rule:
                    if n==3 and p.rim&(tri|other):continue
                    if n!=4 and n!=3 and p.rim&tri:continue
                opts.append((idx,p))
            if not opts:return False
            if best is None or len(opts)<len(best):best=opts
            if len(best)==1:break
        for idx,p in best:
            n=sizes[p.id]
            if dfs(occupied|p.mask,used|(1<<idx),tri|(p.mask if n==3 else 0),four|(p.mask if n==4 else 0),other|(p.mask if n not in (3,4) else 0),selected+[(p.id,p)]):return True
        return False
    begin=time.perf_counter();dfs(0,0,0,0,0,[])
    return {'count':total,'nodes':nodes,'seconds':round(time.perf_counter()-begin,4),'complete':not(cap and total>=cap),'solutions':solutions}

def canonical(sol):
    """D4 symmetry of the whole square; identities of different shapes preserved."""
    variants=[]
    for f in [False,True]:
        for r in range(4):
            result=[]
            for k,p in sorted(sol.items()):
                coords=[]
                for x,y in p.cells:
                    if f:x=N-1-x
                    for _ in range(r):x,y=N-1-y,x
                    coords.append((x,y))
                result.append((k,tuple(sorted(coords))))
            variants.append(tuple(result))
    return min(variants)

def printable(sol):
    grid=[['.' for _ in range(N)] for _ in range(N)]
    for k,p in sol.items():
        for x,y in p.cells:grid[y][x]=k
    return '\n'.join(''.join(row) for row in grid)

if __name__=='__main__':
    result=search(rule=True)
    print({k:v for k,v in result.items() if k!='solutions'},flush=True)
    print('D4 classes',len({canonical(s) for s in result['solutions']}),flush=True)
    for s in result['solutions'][:12]:print(printable(s),'\n',flush=True)
