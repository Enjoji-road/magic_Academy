"""Runner-up: eight stones plus a four-cell open corridor, not a ninth stone.
The virtual C tetromino represents empty cells. It is exempt from the three-stone
contact rule (the solver treats C as size four, which imposes no contact restriction).
Only I/L/S tetrominoes form four-cell paths without branches or a 2x2 pool.
"""
import json,collections
import solver as s
original=s.BASE['C']
d=json.load(open('research/design.json'));pins={k:(tuple(v[0]),tuple(v[1])) for k,v in d['pins'].items()}
summary={};solutions=[]
for name,shape in {
 'I':[(0,0),(1,0),(2,0),(3,0)],
 'L':[(0,0),(0,1),(0,2),(1,2)],
 'S':[(1,0),(2,0),(0,1),(1,1)]
}.items():
 s.BASE['C']=shape;s.PLACEMENTS=s.all_placements()
 result=s.search(pins=pins)
 summary[name]={k:v for k,v in result.items() if k!='solutions'}
 solutions.extend((name,v) for v in result['solutions'])
 print(name,summary[name],flush=True)
# Boundary mouths must be endpoints of the corridor, not merely any adjacent cells.
groups=collections.defaultdict(list)
for name,sol in solutions:
 cells=set(sol['C'].cells);ends=[]
 for x,y in cells:
  degree=sum((x+dx,y+dy) in cells for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)))
  if degree==1 and (x in (0,5) or y in (0,5)):ends.append((x,y))
 if len(ends)==2:groups[tuple(sorted(ends))].append((name,sol))
summary['combined_count']=len(solutions)
summary['possible_boundary_port_pairs']={str(k):len(v) for k,v in groups.items()}
summary['unique_port_pairs']=sum(len(v)==1 for v in groups.values())
print('combined',len(solutions),'unique port pairs',summary['unique_port_pairs'],flush=True)
s.BASE['C']=original;s.PLACEMENTS=s.all_placements()
json.dump(summary,open('research/alternative-verification.json','w'),ensure_ascii=False,indent=2)
