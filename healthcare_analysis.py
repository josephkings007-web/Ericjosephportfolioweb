"""CareAtlas Nigeria: reproducible, standard-library-only registry analysis.

Run: python healthcare_analysis.py [--download]
Raw source is retained locally; published outputs contain aggregates only.
"""
from pathlib import Path
from collections import Counter
import argparse,csv,hashlib,json,sqlite3,urllib.request,urllib.parse,datetime

ROOT=Path(__file__).resolve().parent
API='https://services3.arcgis.com/BU6Aadhn6tbBEdyk/arcgis/rest/services/GRID3_NGA_Health_Facilities_v4_0/FeatureServer/0'

def get(params):
    with urllib.request.urlopen(API+'/query?'+urllib.parse.urlencode(params),timeout=60) as response:
        result=json.load(response)
    if 'error' in result: raise RuntimeError(result['error'])
    return result

def download():
    total=get({'f':'json','where':'1=1','returnCountOnly':'true'})['count']
    rows=[]
    for offset in range(0,total,2000):
        page=get({'f':'json','where':'1=1','outFields':'*','returnGeometry':'false','orderByFields':'OBJECTID','resultRecordCount':2000,'resultOffset':offset})
        rows.extend(f['attributes'] for f in page['features'])
    assert len(rows)==total and len({r['OBJECTID'] for r in rows})==total,'Incomplete/overlapping pagination'
    (ROOT/'data').mkdir(exist_ok=True)
    (ROOT/'data/raw-facilities.json').write_text(json.dumps(rows,separators=(',',':')),encoding='utf-8')

def main():
    args=argparse.ArgumentParser();args.add_argument('--download',action='store_true');options=args.parse_args()
    if options.download:download()
    raw_file=ROOT/'data/raw-facilities.json';raw=json.loads(raw_file.read_text(encoding='utf-8'))
    assert len(raw)==len({r['OBJECTID'] for r in raw})==len({r['unique_id'] for r in raw})
    states=sorted({r['state_standard'].strip() for r in raw})
    lga_keys=sorted({(r['state_standard'].strip(),r['lga_standard'].strip()) for r in raw})
    assert len(states)==37 and len(lga_keys)==774,'Administrative coverage changed: review before publication'
    levels=['Primary','Secondary','Tertiary','Unknown'];owners=['Public','Private','Unknown']
    lgas=[[states.index(s),l] for s,l in lga_keys];lga_id={key:i for i,key in enumerate(lga_keys)}
    (ROOT/'careatlas').mkdir(exist_ok=True)
    database=sqlite3.connect(ROOT/'careatlas/facilities.sqlite')
    database.execute('DROP TABLE IF EXISTS facilities')
    database.execute('CREATE TABLE facilities(id TEXT PRIMARY KEY,state TEXT,lga TEXT,lga_id INTEGER,level TEXT,owner TEXT,status TEXT,lat REAL,lon REAL,located INTEGER,flagged INTEGER,known_status INTEGER,functional INTEGER,name TEXT)')
    clean=[];invalid=0;empty_levels=0;empty_owners=0
    for r in raw:
        state=r['state_standard'].strip();lga=r['lga_standard'].strip()
        level=(r.get('facility_level') or '').strip();owner=(r.get('facility_ownership') or '').strip();status=(r.get('functional') or '').strip()
        if not level:empty_levels+=1
        if not owner:empty_owners+=1
        level=level if level in levels else 'Unknown';owner=owner if owner in owners else 'Unknown';status=status or 'Unknown'
        lat,lon=r.get('latitude'),r.get('longitude')
        located=int(isinstance(lat,(float,int)) and isinstance(lon,(float,int)) and -90<=lat<=90 and -180<=lon<=180 and not(lat==0 and lon==0))
        if lat is not None and lon is not None and not located:invalid+=1
        known=int(status!='Unknown')
        clean.append((r['unique_id'],state,lga,lga_id[state,lga],level,owner,status,lat if located else None,lon if located else None,located,int((r.get('flag_count') or 0)>0),known,int(status=='Functional'),r['facility_name'].strip()))
    database.executemany('INSERT INTO facilities VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',clean)
    database.commit()
    # Reconcile every count to the input, retaining flagged and unmapped records.
    cube=database.execute('SELECT lga_id,level,owner,COUNT(*),SUM(located),SUM(flagged),SUM(known_status),SUM(functional),COALESCE(SUM(lat),0),COALESCE(SUM(lon),0) FROM facilities GROUP BY lga_id,level,owner ORDER BY lga_id,level,owner').fetchall()
    cubes=[[l,levels.index(level),owners.index(owner),n,g,f,k,yes,round(lat,6),round(lon,6)] for l,level,owner,n,g,f,k,yes,lat,lon in cube]
    assert sum(row[3] for row in cubes)==len(raw)
    repeated=database.execute('SELECT COUNT(*),SUM(n-1) FROM (SELECT COUNT(*) n FROM facilities GROUP BY state,lga,lower(name) HAVING COUNT(*)>1)').fetchone()
    summary={k:v for k,v in zip(['records','located','flagged','known_status','functional'],database.execute('SELECT COUNT(*),SUM(located),SUM(flagged),SUM(known_status),SUM(functional) FROM facilities').fetchone())}
    summary.update({'missing_coordinates':summary['records']-summary['located'],'invalid_coordinates':invalid,'blank_level':empty_levels,'blank_owner':empty_owners,'repeated_name_groups':repeated[0],'repeated_name_excess_records':repeated[1] or 0,'states':len(states),'lgas':len(lgas)})
    source={'title':'GRID3 NGA - Health Facilities v4.0','publisher':'CIESIN, Columbia University','year':2026,'accessed':datetime.datetime.fromtimestamp(raw_file.stat().st_mtime,datetime.timezone.utc).date().isoformat(),'doi':'https://doi.org/10.7916/pjpv-9q55','item':'https://www.arcgis.com/home/item.html?id=9df52e12d0b5422f8f73c44d0dc91f8b','api':API,'license':'CC BY 4.0','raw_sha256':hashlib.sha256(raw_file.read_bytes()).hexdigest(),'snapshot_records':len(raw),'scope':'Non-exhaustive, non-validated national registry snapshot; records are not proof of service availability, capacity, affordability, or travel access.'}
    out=ROOT/'careatlas';out.mkdir(exist_ok=True)
    data={'source':source,'summary':summary,'states':states,'lgas':lgas,'levels':levels,'owners':owners,'cube_fields':['lga_index','level_index','owner_index','records','located','source_flagged','known_status','functional','latitude_sum','longitude_sum'],'cube':cubes,'statuses':dict(database.execute('SELECT status,COUNT(*) FROM facilities GROUP BY status'))}
    (out/'data.json').write_text(json.dumps(data,separators=(',',':'),ensure_ascii=False),encoding='utf-8')
    (out/'source.json').write_text(json.dumps(source,indent=2),encoding='utf-8')
    for name,fields in [('states','state'),('lgas','state,lga')]:
        result=database.execute('SELECT '+fields+',COUNT(*) records,SUM(located) located,SUM(flagged) source_flagged,SUM(known_status) known_status,SUM(functional) functional FROM facilities GROUP BY '+fields+' ORDER BY '+fields)
        with (out/(name+'.csv')).open('w',newline='',encoding='utf-8') as f:
            writer=csv.writer(f);writer.writerow([d[0] for d in result.description]);writer.writerows(result)
    print(json.dumps({'summary':summary,'cubes':len(cubes),'data_bytes':(out/'data.json').stat().st_size,'sha256':source['raw_sha256']}))
    database.close()

if __name__=='__main__':main()
