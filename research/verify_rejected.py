"""Rejected preliminary shape mix: all four sizes, but no valid strict-contact tiling."""
import json
import solver as s
s.BASE={
 'A':[(0,0),(1,0)],'B':[(0,0),(1,0),(2,0)],'C':[(0,0),(1,0),(0,1)],
 'D':[(0,0),(1,0),(0,1),(1,1)],'E':[(0,0),(0,1),(0,2),(1,2)],
 'F':[(0,0),(1,0),(0,1),(1,1),(0,2)],'G':[(0,0),(1,0),(2,0),(1,1),(1,2)],
 'H':[(0,0),(2,0),(0,1),(1,1),(2,1)],'I':[(0,0),(0,1),(0,2),(1,2),(2,2)]}
s.PLACEMENTS=s.all_placements();r=s.search();result={k:v for k,v in r.items() if k!='solutions'};result['base']=s.BASE
json.dump(result,open('research/rejected-verification.json','w'),ensure_ascii=False,indent=2)
print({k:v for k,v in result.items() if k!='base'})
