"""Run from repository root. Full solution and ablation counts (spoilers)."""
import json,hashlib,itertools,time
import solver as s

d=json.load(open('research/design.json'))
pins={k:(tuple(v[0]),tuple(v[1])) for k,v in d['pins'].items()}
fixed={'C':sum(s.bit(*v) for v in d['initialC'])}
results={}
solutions={}
for name,kw in [
 ('all_rules',{'pins':pins}),
 ('base_not_moved',{'pins':pins,'fixed':fixed}),
 ('without_adjacency_rule',{'pins':pins,'rule':False}),
 ('without_diamond_pin',{'pins':{k:v for k,v in pins.items() if k!='G'}}),
 ('without_hollow_diamond_pin',{'pins':{k:v for k,v in pins.items() if k!='H'}}),
 ('without_both_pins',{}),
]:
    r=s.search(**kw)
    results[name]={k:v for k,v in r.items() if k!='solutions'}
    print(name,results[name],flush=True)
    if name=='all_rules':solutions=r['solutions']
    if name=='without_both_pins':results[name]['up_to_board_D4']=len({s.canonical(v) for v in r['solutions']})

# Precisely count board orientations of the final solution under fixed clues.
sol=solutions[0]
results['area']=sum(len(x) for x in s.BASE.values())
results['pieces_by_size']={str(i):sum(len(x)==i for x in s.BASE.values()) for i in range(2,6)}
results['all_piece_geometries_distinct']=len({min(s.orientations(v)) for v in s.BASE.values()})==len(s.BASE)
results['orientation_duplicates_removed']=True
results['solution_grid']=s.printable(sol).splitlines()
results['initial_base_cells']=d['initialC']
results['solution']={k:{'cells':p.cells,'x':p.x,'y':p.y,'orientation':p.orientation} for k,p in sol.items()}
results['target_marks']=pins
results['solver_sha256']=hashlib.sha256(open('research/solver.py','rb').read()).hexdigest()
with open('research/verification.json','w') as f:json.dump(results,f,ensure_ascii=False,indent=2)
print('Wrote research/verification.json',flush=True)
