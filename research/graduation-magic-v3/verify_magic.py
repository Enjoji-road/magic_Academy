"""Independent finite semantics and counterexample search. Python 3 standard library.
Does not import JS rules or use the JS answer checker to derive expected results.
"""
from pathlib import Path
from itertools import product, permutations
import hashlib, json, subprocess, math

HERE=Path(__file__).resolve().parent
IDS=('fire','water','wind','earth')
# Independently specified NEW proposal, not a claim about the official game.
NEED={'fire':'earth','water':'fire','wind':'water','earth':'wind'}

def independently_alive(nodes):
    """Follow each support chain until hand, absent/wrong source, or a closed cycle.
    This traversal differs from the JS greatest-fixed-point implementation.
    """
    out={}
    for origin in IDS:
        seen=set();current=origin
        while True:
            p=nodes[current]
            if not p['exists']:out[origin]=False;break
            if p['manual']:out[origin]=True;break
            src=p['from']
            if src!=NEED[current]:out[origin]=False;break
            if current in seen:out[origin]=True;break
            seen.add(current);current=src
    return out

def is_clear(nodes,charge=8):
    a=independently_alive(nodes)
    return charge>0 and all(nodes[k]['exists'] and not nodes[k]['manual'] and a[k] for k in IDS)

def make_nodes(inputs,manual=()):
    return {k:dict(exists=True,manual=k in manual,**{'from':s}) for k,s in zip(IDS,inputs)}

def check():
    absent=dict(exists=False,manual=False,**{'from':None})
    opts=[absent]+[dict(exists=True,manual=m,**{'from':s}) for s in (None,)+IDS for m in (False,True)]
    h=hashlib.sha256();states=0;clear_count=0
    for parts in product(opts,repeat=4):
        nodes=dict(zip(IDS,parts));a=independently_alive(nodes);ok=is_clear(nodes)
        h.update((''.join(str(int(a[k])) for k in IDS)+str(int(ok))+'\n').encode());states+=1;clear_count+=ok
    runtime=json.loads(subprocess.check_output(['node',str(HERE/'verify_runtime.cjs')],text=True))
    assert runtime['states']==states and runtime['sha256']==h.hexdigest()
    assert runtime['recovered']==states and runtime['restored']==states
    pairs={f'{r}<-{s}':NEED[r]==s for r,s in product(IDS,repeat=2)}
    # Self-targeting removes the external held donor, but remains false in both models.
    assert runtime['pairs']==pairs
    configurations=list(product((None,)+IDS,repeat=4))
    winners=[list(c) for c in configurations if is_clear(make_nodes(c))]
    assert winners==[[NEED[k] for k in IDS]]
    omission={}
    for missing in IDS:
        count=0
        for c in configurations:
            ns=make_nodes(c);ns[missing]=absent
            count+=is_clear(ns)
        omission[missing]=count
    assert all(x==0 for x in omission.values())
    # Bindings may be constructed in ANY order after their targets are present.
    order_ok=0
    for order in permutations(IDS):
        ns=make_nodes((None,)*4,manual=IDS)
        for k in order:ns[k]['from']=NEED[k]
        for k in IDS:ns[k]['manual']=False
        order_ok+=is_clear(ns)
    assert order_ok==24
    # Blind all-spells-on-all-objects never creates a relation between effects.
    object_sweep_success=0
    for order in permutations(IDS):
        ns=make_nodes((None,)*4)
        object_sweep_success+=is_clear(ns)
    # Every source and recipient used once in simple nested sweeps (no hidden hint).
    sweep_success=0;sweeps=0
    for recipients in permutations(IDS):
        for sources in permutations(IDS):
            for column_major in (False,True):
                ns=make_nodes((None,)*4)
                actions=product(sources,recipients) if column_major else ((s,r) for r,s in product(recipients,sources))
                for s,r in actions:ns[r]['from']=s
                sweep_success+=is_clear(ns);sweeps+=1
    assert object_sweep_success==0 and sweep_success==0
    # Important counterexample: after discovering 'one loop', only six directed
    # Hamiltonian cycles remain. Do NOT cite 625 as proof of brute-force immunity.
    cycles=[]
    for tail in permutations(IDS[1:]):
        order=(IDS[0],)+tail;ns=make_nodes((None,)*4)
        for i,r in enumerate(order):ns[r]['from']=order[(i-1)%4]
        cycles.append((order,is_clear(ns)))
    assert sum(ok for _,ok in cycles)==1
    # Hypothesis domain = all 16-bit, context-independent acceptance relations.
    # Four positives alone do not identify the law. Full positive/negative table does.
    observations={(r,s):NEED[r]==s for r,s in product(IDS,repeat=2)}
    hypotheses=[]
    obs_keys=list(observations)
    for bits in product((False,True),repeat=16):
        relation=dict(zip(obs_keys,bits))
        if all(relation[k]==v for k,v in observations.items()):hypotheses.append(bits)
    assert len(hypotheses)==1
    dropped_rows={r:2**4 for r in IDS}
    # With three exclusive receiver rows known, requiring ONE four-attribute loop
    # forces the fourth edge. Therefore fourth room is confirmation, not independent.
    missing_room_final_candidates={}
    for missing in IDS:
        remaining=[r for r in IDS if r!=missing];possible=[]
        for order, _ in cycles:
            mapping={r:order[(i-1)%4] for i,r in enumerate(order)}
            if all(mapping[r]==NEED[r] for r in remaining):possible.append(mapping)
        missing_room_final_candidates[missing]=len(possible)
    assert all(n==1 for n in missing_room_final_candidates.values())
    # Energy is finite: no eternal flame. A preserved circuit remains a pattern at 0.
    charge=8;night_states=[]
    good=make_nodes(tuple(NEED[k] for k in IDS))
    for t in range(9):
        night_states.append({'night':t,'charge':charge,'lit':is_clear(good,charge)})
        charge=max(0,charge-1)
    assert night_states[-1]['lit'] is False
    # Band quotient. Same station model as the official drawing; independent walk.
    station,edge=560,1;seen=[]
    for i in range(2000):
        seen.append((station,edge));station+=1
        if station==1000:station=0;edge=-edge
    assert (station,edge)==(560,1) and len(set(seen))==2000
    assert seen[1000]==(560,-1)
    assert sum(20<=s<=235 for s,e in seen)==432
    # All created-node states, including malformed references to absent sources,
    # recover by recreating all four and rebinding. No finite-use consumables.
    recoverable=0
    for parts in product(opts,repeat=4):
        ns={k:dict(p) for k,p in zip(IDS,parts)}
        for k in IDS:ns[k]={'exists':True,'manual':True,'from':None}
        for k in IDS:ns[k]['from']=NEED[k];ns[k]['manual']=False
        assert is_clear(ns);recoverable+=1
    return {
      'schema':3,'new_fictional_laws':True,
      'independent_semantics':{'states':states,'fingerprint_sha256':h.hexdigest(),'js_matches_python':True,'clear_states_at_charge_8':clear_count},
      'support_table':pairs,
      'final_connections':{'tested':len(configurations),'solutions':winners,'unique_within_defined_model':True},
      'missing_attribute_successes':omission,'construction_orders_pass':order_ok,
      'recoverable_states':recoverable,'simple_object_sweep_success':object_sweep_success,
      'js_actual_action_recoveries':runtime['recovered'],'js_restore_observable_equivalence':runtime['restored'],
      'all_effects_nested_sweeps':{'tested':sweeps,'successes':sweep_success},
      'brute_force_limitation':{'four_effects_loop_topologies':len(cycles),'winning_loops':sum(ok for _,ok in cycles),'interpretation':'Six trials suffice once the loop idea is known. Not brute-force-proof.'},
      'hypothesis_identification':{'all_16_binary_relations_considered':65536,'all_16_observations_remaining':1,'only_four_positive_observations_remaining':4096,'remove_one_receiver_row_remaining':dropped_rows,'assumptions':['context-independent deterministic pair effects','no ternary-only rules','one fixed rule set throughout']},
      'missing_room_given_three_exclusive_rows_and_one_loop_goal':missing_room_final_candidates,
      'independent_four_room_necessity':False,
      'night_states':night_states,
      'band_boundary':{'vertices':2000,'components':1,'center_lap_flips_edge':True,'task_region_vertices':432},
      'not_proven':['human discovery and enjoyment','all four rooms individually indispensable','resistance to six-loop guessing after the main insight','physical realism (the new law is explicitly fictional)','future integrated regressions before integration']
    }

if __name__=='__main__':
    result=check();(HERE/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k in ('independent_semantics','final_connections','construction_orders_pass','brute_force_limitation','independent_four_room_necessity')},ensure_ascii=False,indent=2))
