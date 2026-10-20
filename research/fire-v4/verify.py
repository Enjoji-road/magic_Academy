#!/usr/bin/env python3
"""Fire IV: shared physical relief, point-light projection, and inverse problem.

SPOILERS. Standard library only; generates verification.json in this directory.
The displayed aperture patterns come from intersections of real through-slots.
"""
from fractions import Fraction as Q
from itertools import product
from math import prod
from pathlib import Path
import hashlib
import json

DIGIT_SEGMENTS = ["abcdef", "bc", "abdeg", "abcdg", "bcfg", "acdfg", "acdefg", "abc", "abcdefg", "abcdfg"]
MASKS = [sum(1 << (ord(c)-97) for c in s) for s in DIGIT_SEGMENTS]
REVERSE = {m: i for i, m in enumerate(MASKS)}
TRUE_DIGITS = (9, 8, 9, 1, 6, 1)
WALL = Q(12)
LIGHTS = {"first": Q(0), "second": Q(1)}
PLATES = [{"id": chr(65+i), "a": Q(a), "b": Q(b),
           "x": Q(a, b+1), "y": Q(12, b+1), "z": Q(6, b+1),
           "width": Q(78, 100*(b+1)), "height": Q(132, 100*(b+1))}
          for i, (a, b) in enumerate([(-1,1),(0,1),(1,1),(-1,2),(0,2),(1,2)])]
OUTER = [(0,66),(28,50),(39,22),(39,-25),(23,-55),(0,-66),(-23,-55),(-39,-25),(-39,22),(-28,50)]
OUTER = [(Q(x,100), Q(z,100)) for x,z in OUTER]


def horizontal(z):
    return [(Q(x,1000), Q(y,1000)+z) for x,y in [(-180,0),(-140,40),(140,40),(180,0),(140,-40),(-140,-40)]]


def vertical(x,z):
    return [(Q(a,1000)+x,Q(b,1000)+z) for a,b in [(0,130),(40,90),(40,-90),(0,-130),(-40,-90),(-40,90)]]


HOLES = {"a": horizontal(Q(35,100)), "g": horizontal(Q(0)), "d": horizontal(Q(-35,100)),
         "b": vertical(Q(22,100),Q(175,1000)), "c": vertical(Q(22,100),Q(-175,1000)),
         "f": vertical(Q(-22,100),Q(175,1000)), "e": vertical(Q(-22,100),Q(-175,1000))}
CENTERS = {k: (sum(x for x,z in p)/len(p), sum(z for x,z in p)/len(p)) for k,p in HOLES.items()}


def projection(p, light):
    m = WALL/p["y"]
    return {"id": p["id"], "x": light+(p["x"]-light)*m,
            "z": p["z"]*m, "scale": m, "width": p["width"]*m, "height": p["height"]*m}


def grouping(light):
    slots = {}
    for i,p in enumerate(PLATES):
        t = projection(p, light)
        slots.setdefault(t["x"],[]).append(i)
    return sorted(slots.items())


GROUPS = {side: grouping(x) for side,x in LIGHTS.items()}


def observe(digits, side):
    result=[]
    for x, group in GROUPS[side]:
        holes=127
        for i in group:
            holes &= MASKS[digits[i]]
        result.append({"x": x, "owners": [chr(65+i) for i in group], "mask": holes, "digit": REVERSE.get(holes)})
    return result


OBS = {s: observe(TRUE_DIGITS,s) for s in LIGHTS}
CONSTRAINTS = [(s,x,g,o["mask"]) for s in LIGHTS for (x,g),o in zip(GROUPS[s],OBS[s])]


def inverse_counts():
    counts={0:0,1:0,2:0,3:0}
    examples={k:[] for k in counts}
    omitted=[0]*len(CONSTRAINTS)
    winners=[]
    for digits in product(range(10),repeat=6):
        masks=[MASKS[d] for d in digits]
        flags=0
        for j,(side,x,group,wanted) in enumerate(CONSTRAINTS):
            h=127
            for i in group:
                h &= masks[i]
            if h==wanted: flags |= 1<<j
        # First three measurements are from source first, next four second.
        matched=(1 if flags&7==7 else 0)|(2 if flags&120==120 else 0)
        for k in counts:
            if matched&k==k:
                counts[k]+=1
                if len(examples[k])<4:examples[k].append("".join(map(str,digits)))
        if matched==3:winners.append("".join(map(str,digits)))
        for j in range(7):
            if flags | (1<<j)==127:omitted[j]+=1
    assert winners==["989161"]
    assert counts[1]==675 and counts[2]==135
    return {"digit_domain_size":10**6, "counts_by_observed_source_subset":counts,
            "example_alternatives":examples, "winners":winners,
            "remove_one_displayed_glyph_constraint":[{"source":s,"x":x,"owners":[chr(65+i) for i in g],"solutions":omitted[j]}
                for j,(s,x,g,w) in enumerate(CONSTRAINTS)]}


def independent_slot_counts():
    result={}
    for sources in range(4):
        bit_counts=[]
        for bit in range(7):
            n=0
            for pattern in range(64):
                ok=True
                for side,x,group,w in CONSTRAINTS:
                    if not sources & (1 if side=="first" else 2):continue
                    h=1
                    for i in group:h &= (pattern>>i)&1
                    if h != (w>>bit)&1:ok=False;break
                n+=ok
            bit_counts.append(n)
        result[str(sources)]={"per_slot_counts":bit_counts,"six_leaf_patterns":str(prod(bit_counts))}
    assert result["3"]["six_leaf_patterns"]=="1"
    return result


def point_in(poly,p,include_boundary):
    x,z=p;inside=False
    for i,(ax,az) in enumerate(poly):
        bx,bz=poly[(i+1)%len(poly)]
        cross=(bx-ax)*(z-az)-(bz-az)*(x-ax)
        if cross==0 and min(ax,bx)<=x<=max(ax,bx) and min(az,bz)<=z<=max(az,bz):return include_boundary
        if (az>z)!=(bz>z) and x < ax+(z-az)*(bx-ax)/(bz-az):inside=not inside
    return inside


def blocked_by_plate(index,light,wall_point):
    p=PLATES[index];x,z=wall_point
    # Intersect the original 3D ray with Y=p.y, then measure the hit in the
    # plate's own coordinates. This does NOT use the precomputed wall group.
    t=p["y"]/WALL
    hit_x=light+(x-light)*t-p["x"]
    hit_z=z*t-p["z"]
    m=WALL/p["y"]
    local=(hit_x*m,hit_z*m)
    if not point_in(OUTER,local,True):return False
    return not any(point_in(HOLES[k],local,False) for k in DIGIT_SEGMENTS[TRUE_DIGITS[index]])


def ray_checks():
    checks=0;vertex_checks=0
    for side,light in LIGHTS.items():
        for p in PLATES:
            projected=projection(p,light)
            assert projected["width"]==Q(78,100)
            assert projected["height"]==Q(132,100)
            assert projected["z"]==6
            m=projected["scale"]
            for poly in [OUTER,*HOLES.values()]:
                for dx,dz in poly:
                    px,pz=p["x"]+dx/m,p["z"]+dz/m
                    wx=light+(px-light)*m;wz=pz*m
                    assert wx==projected["x"]+dx and wz==projected["z"]+dz
                    vertex_checks+=1
        # Compare independently ray-traced opaque metal with grouped masks.
        for o in OBS[side]:
            for k,(dx,dz) in CENTERS.items():
                for delta in [Q(0),Q(1,200),Q(-1,200)]:
                    wall_point=(o["x"]+dx+delta,Q(6)+dz)
                    actual=any(blocked_by_plate(i,light,wall_point) for i in range(6))
                    expected=not bool(o["mask"]&(1<<(ord(k)-97)))
                    assert actual==expected
                    checks+=1
            for dx,dz in [(Q(0),Q(1,2)),(Q(0),Q(-1,2)),(Q(1,3),Q(0)),(Q(-1,3),Q(0)),(Q(1,2),Q(0))]:
                wall_point=(o["x"]+dx,Q(6)+dz)
                actual=any(blocked_by_plate(i,light,wall_point) for i in range(6))
                expected=point_in(OUTER,(dx,dz),True)
                assert actual==expected
                checks+=1
        # Distinct rosettes are separated: no unintended partial overlap.
        xs=[x for x,g in GROUPS[side]]
        assert all(b-a > Q(78,100) for a,b in zip(xs,xs[1:]))
    return {"rational_ray_checks":checks,"projected_polygon_vertex_checks":vertex_checks,
            "full_region_argument":"Coincident congruent outer shapes; mutually disjoint identical slot polygons. Union of opaque metal gives intersection of aperture sets, hence bitwise AND exactly, including consistent edges. Noncoincident outer shapes are disjoint. Supports stay below Z=5.4; apertures stay above Z=5.6.",
            "point_source_only":True,"finite_flame_validated":False}


def shortcut_audit():
    visible={o["digit"] for obs in OBS.values() for o in obs}
    assert 8 not in visible and 8 in TRUE_DIGITS
    # Generic experiments with the wall-coordinate slot sequences. This is
    # a bounded shortcut audit, NOT a claim to exclude every human shortcut.
    merged={}
    for x in range(-3,2):
        ms=[o["mask"] for obs in OBS.values() for o in obs if o["x"]==x]
        u=0
        for value in ms:u|=value
        merged[str(x)]={"OR":u,"OR_digit":REVERSE.get(u)}
    return {"visible_numerals":sorted(visible),"answer_uses_unseen_numeral":8,
            "literal_concatenation_permutation_cannot_answer":True,
            "raw_wall_coordinate_OR":merged,
            "raw_merge_has_one_row_original_has_two":True,
            "source_code_inspection_or_general_solver_prevention_claimed":False,
            "blind_six_digit_space":10**6,
            "caution":"This is resistance to enumerating displayed answers, not proof of human understanding or a cryptographic answer secret."}


def serialize(value):
    if isinstance(value,Q):return int(value) if value.denominator==1 else str(value)
    raise TypeError(type(value))


def main():
    report={"schema":"fire-v4-1","answer":"989161","original_digits":TRUE_DIGITS,
            "world":{"wall_y":WALL,"sources":LIGHTS,"plates":PLATES,
                     "single_source_selector":"A single opaque observation hood admits one candle at a time; other lit candles are covered.",
                     "reading_order":"A B C, then D E F, as printed in the original-crest archive diagram."},
            "all_admissible_states":{"closed":[],**OBS},
            "inverse":inverse_counts(),"all_128_slot_patterns_per_leaf":independent_slot_counts(),
            "geometry":ray_checks(),"shortcuts":shortcut_audit(),
            "human_tested":False,"mobile_browser_tested":False}
    text=json.dumps(report,ensure_ascii=False,indent=2,default=serialize)+"\n"
    path=Path(__file__).with_name("verification.json")
    path.write_text(text,encoding="utf-8")
    print(json.dumps({"winners":report["inverse"]["winners"],
                      "subset_counts":report["inverse"]["counts_by_observed_source_subset"],
                      "slot_counts":report["all_128_slot_patterns_per_leaf"],
                      "geometry":report["geometry"],"sha256":hashlib.sha256(text.encode()).hexdigest()},ensure_ascii=False))


if __name__=="__main__":main()
