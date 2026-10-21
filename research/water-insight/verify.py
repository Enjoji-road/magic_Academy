"""Research II: spoilers. Independent pressure/displacement equations and inverse search."""
from itertools import product
from math import isclose
from pathlib import Path
import json, random

P0,RHO,G=101325.,998.,9.81
VT,VC,W0,D,ORIGINAL,AREA,HEAD=5000.,5000.,3430.,20.,2730.,.01,.8
checks=0
def check(v):
    global checks
    assert v
    checks+=1
def initial(r=ORIGINAL):return {'water':r,'air':VT-r+D,'bell':VC-W0,'lost':0.,'open':False}
def space(s):return VT-s['water']+D
def pg(s):return P0*s['air']/space(s)
def closed_capacity(s):
    # Solve in final water volume, independently of the JS delta-volume bisection.
    low=s['water'];high=VT
    def residual(w):return P0*s['air']/(VT-w+D)-P0-RHO*G*(HEAD-w*1e-6/AREA)
    if residual(low)>=-1e-7:return 0.
    if residual(high)<=0:return high-low
    for _ in range(80):
        w=(low+high)/2
        if residual(w)>0:high=w
        else:low=w
    return (low+high)/2-s['water']
def step(s,action):
    s=dict(s)
    if action=='open':s['open']=True
    elif action=='close':s['open']=False
    elif action in ('small','fill'):
        requested=600. if action=='small' else VT-s['water']
        permitted=VT-s['water'] if s['open'] else closed_capacity(s)
        q=min(requested,permitted)
        if q<1e-8:q=0.
        s['water']+=q
        if VT-s['water']<1e-8:s['water']=VT
    elif action!='bath':raise ValueError(action)
    if s['open']:
        released=s['air']-space(s)
        kept=min(max(0.,released),VC-s['bell'])
        s['bell']+=kept;s['lost']+=max(0.,released-kept);s['air']=space(s)
    return s
def measure(s):return {'water_in_bell_ml':VC-s['bell'],'full':s['water']>=VT-1e-7,'open':s['open']}
def invariant(s,r=ORIGINAL):
    check(isclose(s['air']+s['bell']+s['lost'],VT-r+D+VC-W0,abs_tol=1e-6))
    check(r-1e-6<=s['water']<=VT+1e-6)
    check(0<=s['bell']<=VC+1e-6)
    check(pg(s)>=P0-1e-5)
    if s['open']:check(isclose(pg(s),P0,abs_tol=1e-5))
    else:check(pg(s)<=P0+RHO*G*(HEAD-s['water']*1e-6/AREA)+1e-4)

# A: all 6^4 settings, with all six original chambers/known connections.
pairs=((1,3),(0,2),(2,3),(0,1),(0,3),(1,2));target=(70,80,60,80,80,70)
a_solutions=[d for d in product(range(0,51,10),repeat=4) if tuple(90-min(d[i],d[j]) for i,j in pairs)==target]
check(len(a_solutions)>1)
a_groups={}
for d in product(range(0,51,10),repeat=4):a_groups.setdefault(tuple(90-min(d[i],d[j]) for i,j in pairs),[]).append(d)
a_unique=[(t,ds[0]) for t,ds in a_groups.items() if len(ds)==1]
a_good=(10,20,50,50);a_good_target=tuple(90-min(a_good[i],a_good[j]) for i,j in pairs)
check(a_groups[a_good_target]==[a_good])
# C: source level must stay high, while the vent's water seal is removed.
c_states=[{'source_full':s,'vent_wet':v,'reaches_target':bool(s and not v)} for s,v in product((False,True),repeat=2)]
check(sum(s['reaches_target'] for s in c_states)==1)
check(not c_states[0]['reaches_target'])

# B: one unknown, original water, in stated 10-mL resolution. No predefined answer table.
full_observation=measure(step(step(initial(),'open'),'fill'))
inverse=[]
for r in range(0,5001,10):
    out=step(step(initial(r),'open'),'fill')
    invariant(out,r)
    if measure(out)==full_observation and r<VT:inverse.append(r)
check(inverse==[ORIGINAL])
# If either of the two volume readings is missing, there is no unique original volume.
without_before=[(r,w0) for r in range(0,5001,10) for w0 in range(0,5001,10)
                if w0-(VT-r)==full_observation['water_in_bell_ml'] and r<VT]
without_after=list(range(10,5000,10))
check(len(without_before)>1);check(len(without_after)>1)
# A non-full positive water reading determines only how much air has moved so far.
partial=step(step(initial(),'open'),'small')
partial_candidates=[r for r in range(0,5000,10) if 0<r<VT-600 and W0-600==measure(partial)['water_in_bell_ml']]
check(len(partial_candidates)>1)

# Closed-valve positive inflow, then opening without adding water: compression is included.
s0=initial();s1=step(s0,'fill');s2=step(s1,'open');s3=step(s2,'fill')
check(s1['water']>s0['water']);check(s1['water']<VT)
check(s1['bell']==s0['bell']);check(s2['water']==s1['water']);check(s2['bell']>s1['bell'])
check(measure(s3)==full_observation)
check(0<(s1['water']-ORIGINAL)<200)

# All short action sequences; actuation never represents a correct-answer test.
actions=('small','fill','open','close','bath');samples=[]
for seq in product(actions,repeat=5):
    s=initial()
    for a in seq:s=step(s,a)
    invariant(s)
    if len(samples)<40:samples.append({'actions':seq,'physical':s})
# Long varied histories test repeated compression, opening and full/no-op states.
rng=random.Random(20261021)
for _ in range(120):
    seq=[rng.choice(actions) for _ in range(35)];s=initial()
    for a in seq:s=step(s,a);invariant(s)
    samples.append({'actions':seq,'physical':s})

# Counterfactual liquid-only connection into a levelled, closed-top measuring bell:
# no gas enters; at the same P and T its trapped gas volume cannot grow.
# Thus the bell's water volume cannot decrease, unlike observed s1 -> s2.
liquid_only_bell_water=W0
check(measure(s2)['water_in_bell_ml']<liquid_only_bell_water)

report={'checks':checks,'candidate_A':{'settings':6**4,'ambiguous_target_solutions':a_solutions,
        'unique_target_count':len(a_unique),'unique_example':{'depths':a_good,'target':a_good_target}},'candidate_C':c_states,
 'B':{'resolution_ml':10,'physical_grid_including_boundaries':501,'nonempty_nonfull_candidate_domain':499,'solutions':inverse,'baseline_bell_water_ml':W0,
      'full_observation':full_observation,'without_before':len(without_before),'without_after':len(without_after),
      'without_full_indicator_partial_candidates':len(partial_candidates),
      'closed_positive_inflow_ml':s1['water']-ORIGINAL,
      'opening_without_water_changes_bell_by_ml':s2['bell']-s1['bell'],
      'full_after_closed_prefix_matches':measure(s3)==full_observation,
      'short_sequences':len(actions)**5},
 'cross_language_samples':samples,
 'limits':['Ideal isothermal, levelled gas collection; not CFD or a physical apparatus test.',
           'Uniqueness is at the stated 10-mL measurement resolution.',
           'No automatic proof of aha, difficulty or auditory/mobile quality.',
           'No absolute protection against exhaustive typed guesses or source inspection.',
           'An unmotivated arithmetic guess can coincidentally match the answer; no claim to detect understanding.']}
if __name__=='__main__':
    Path(__file__).with_name('verification.json').write_text(json.dumps(report,ensure_ascii=False,separators=(',',':'))+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='cross_language_samples'},ensure_ascii=False,indent=2))
