from pathlib import Path
import sqlite3,json,csv
p=Path(__file__).parent
db=sqlite3.connect(p/'careatlas/facilities.sqlite')
queries=[];buffer=''
for line in (p/'careatlas/analysis.sql').read_text(encoding='utf-8').splitlines(True):
    buffer+=line
    if sqlite3.complete_statement(buffer):
        cursor=db.execute(buffer);queries.append(cursor.fetchall());buffer=''
assert len(queries)==12
assert queries[0]==[(70235,70235)]
assert queries[1]==[(70235,58529,11706,34496,29976)]
assert queries[6][0][:3]==(35434,35739,70235)
data=json.loads((p/'careatlas/data.json').read_text(encoding='utf-8'))
assert len(queries[11])==len(data['cube'])==4427
for name,count in [('states',37),('lgas',774)]:
    with (p/f'careatlas/{name}.csv').open(encoding='utf-8') as f:rows=list(csv.DictReader(f))
    assert len(rows)==count and sum(int(r['records']) for r in rows)==70235
db.close()
print('PASS: all 12 SQL analyses execute; snapshot, cube, CSV exports and denominator evidence reconcile.')
