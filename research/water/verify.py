"""Independent water/air inverse check. Contains spoilers. Standard Python only."""
from itertools import combinations, product
from math import isclose
from pathlib import Path
import json

P0, RHO, G, H, T, AREA, PIPE = 101325., 998., 9.81, .9, 1.2, .001, .0001
PAIRS = tuple(combinations(range(4), 2))
ACTUAL = ((1,3),(0,2),(2,3),(0,1),(0,3),(1,2))
PROFILES = ((.1,.1,.3,.5),(.1,.3,.3,.5),(.5,.3,.1,.5))
DEPTHS = (0., .1, .3, .5, None)
checks = 0
def check(value):
    global checks
    assert value
    checks += 1

def vol(h): return AREA * (T-h) + PIPE
def shut_height():
    lo,hi=0.,H
    for _ in range(90):
        h=(lo+hi)/2
        if P0*vol(0)/vol(h)>P0+RHO*G*(H-h): hi=h
        else: lo=h
    return (lo+hi)/2
SHUT=shut_height()

def chamber(pair,depths):
    opened=[(depths[i],i) for i in pair if depths[i] is not None]
    d=min((x for x,_ in opened),default=float('inf'))
    if d>=H-SHUT: return SHUT,(),0.
    h=H-d
    air=vol(0)-(P0+RHO*G*d)*vol(h)/P0
    return h,tuple(i for x,i in opened if x==d),air

def observe(mapping,depths):
    rs=[chamber(p,depths) for p in mapping]
    return {'heights':[round(r[0]*100,6) for r in rs],
            'bubbles':sorted(set(i for r in rs for i in r[1] if depths[i]>0)),
            'cup_water_unchanged':True}

observed=[observe(ACTUAL,d) for d in PROFILES]
def candidates(indices):
    domains=[]
    for room in range(6):
        domains.append([p for p in PAIRS if all(
            isclose(chamber(p,PROFILES[k])[0]*100,observed[k]['heights'][room],abs_tol=1e-5)
            for k in indices)])
    # The endpoints do not carry source labels. Check only the visible aggregate bubbles.
    result=[]
    for mapping in product(*domains):
        if all(observe(mapping,PROFILES[k])==observed[k] for k in indices): result.append(mapping)
    return domains,result

all_states=[]
for d in product(DEPTHS,repeat=4):
    o=observe(ACTUAL,d)
    all_states.append({'depths_cm':[None if v is None else int(v*100) for v in d],**o})
    for p in ACTUAL:
        h,vents,air=chamber(p,d)
        check(0<h<=H+1e-12)
        pressure=P0+RHO*G*(H-h)
        if vents:
            check(air>0)
            check(isclose(pressure,P0+RHO*G*min(d[i] for i in vents),abs_tol=1e-7))
            check(all(d[i] is None or d[i]>=min(d[j] for j in vents) for i in p))
            check(isclose(P0*(vol(0)-air),pressure*vol(h),abs_tol=1e-7))
        else:
            check(isclose(P0*vol(0),pressure*vol(h),abs_tol=1e-7))

domains,solutions=candidates((0,1,2))
check(solutions==[ACTUAL])
check(observe(ACTUAL,(0.,0.,0.,0.))['bubbles']==[])
check(observe(ACTUAL,(None,None,None,None))['bubbles']==[])
drop=[]
for omitted in range(3):
    ds,ss=candidates(tuple(i for i in range(3) if i!=omitted))
    check(len(ss)>1)
    drop.append({'omitted_profile':omitted+1,'solutions':len(ss),
                 'alternative':ss[0] if ss[0]!=ACTUAL else ss[-1]})

# Showing only the union of bubbles cannot identify which room caused them.
bubble_only=sum(all(observe(m,PROFILES[k])['bubbles']==observed[k]['bubbles'] for k in range(3))
                for m in product(PAIRS,repeat=6))
check(bubble_only>1)
# Minima cannot reveal a unique pair in each of the 3 single measurements.
single=[]
for k in range(3):
    ds,ss=candidates((k,));single.append(len(ss));check(len(ss)>1)

# Per-room height data is deliberately sufficient; qualitative bubbles are an interpretation clue.
# A bottom takeoff with any calibrated open outlet would discharge dyed liquid continuously:
# H > d for every outlet, ordinary check valves permit outward water as well as air.
check(all(H>d for p in PROFILES for d in p))
# Thus 'bottom outlet' alternatives contradict all three records of unchanged clear outlet water.

report={'model':'isothermal ideal-gas / hydrostatic equilibrium; no CFD or real hardware validation',
        'constants_SI':{'P0':P0,'rho':RHO,'g':G,'head':H,'height':T,'area':AREA,'pipe_volume':PIPE},
        'closed_height_cm':SHUT*100,'checks':checks,'all_profiles':len(all_states),
        'connection_domain':len(PAIRS)**6,'source_height_hypotheses':2,
        'solutions_all_three':len(solutions),'solution':ACTUAL,'observed':observed,
        'drop_one_profile':drop,'one_profile_solution_counts':single,
        'bubble_only_solutions':bubble_only,
        'redundancy':'With the upper gas takeoff model understood, the height records alone give a unique mapping. Bubble labels and color are not extra independent combinatorial constraints; they justify that model.',
        'limitations':['No mathematical proof of human insight/difficulty.','Complete diagram guesses cannot be forbidden without rate limits; no partial correctness is returned.','No claim of real-device, capillary or transient-flow validation.'],
        'all_observations':all_states}
if __name__=='__main__':
    destination=Path(__file__).with_name('verification.json')
    destination.write_text(json.dumps(report,ensure_ascii=False,separators=(',',':'))+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ('all_observations','solution','observed')},ensure_ascii=False,indent=2))
