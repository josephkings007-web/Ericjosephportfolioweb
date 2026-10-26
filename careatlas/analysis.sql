-- CareAtlas Nigeria | SQLite | GRID3 v4.0 snapshot
-- Run healthcare_analysis.py --download first, then open careatlas/facilities.sqlite.
-- All measures count registry records. No population/travel-access claims are made.

-- 1. Reconcile the source and unique identifiers.
SELECT COUNT(*) AS records,COUNT(DISTINCT id) AS unique_ids FROM facilities;

-- 2. National quality audit: do not delete missing-coordinate or flagged records.
SELECT COUNT(*) AS records,SUM(located) AS located,
       COUNT(*)-SUM(located) AS no_coordinates,
       COUNT(*)-SUM(known_status) AS unknown_status,
       SUM(flagged) AS source_flagged FROM facilities;

-- 3. State counts are a registry measure, not a healthcare performance ranking.
SELECT state,COUNT(*) AS records FROM facilities GROUP BY state ORDER BY records DESC;

-- 4. Ownership composition, including Unknown.
SELECT state,owner,COUNT(*) AS records,
 ROUND(100.0*COUNT(*)/SUM(COUNT(*)) OVER(PARTITION BY state),2) AS share_of_state
FROM facilities GROUP BY state,owner ORDER BY state,records DESC;

-- 5. Care-level composition. Blank/unclassified values are retained as Unknown.
SELECT level,COUNT(*) AS records,ROUND(100.0*COUNT(*)/(SELECT COUNT(*) FROM facilities),2) AS pct_all_records
FROM facilities GROUP BY level ORDER BY records DESC;

-- 6. Status distribution: Unknown does not mean closed.
SELECT status,COUNT(*) AS records FROM facilities GROUP BY status ORDER BY records DESC;

-- 7. Explicit denominator sensitivity.
SELECT SUM(functional) AS recorded_functional,
       SUM(known_status) AS known_status_records,COUNT(*) AS all_records,
       ROUND(100.0*SUM(functional)/NULLIF(SUM(known_status),0),2) AS pct_among_known,
       ROUND(100.0*SUM(functional)/COUNT(*),2) AS pct_among_all FROM facilities;

-- 8. Geocoding review: absolute burden and within-state share answer different questions.
SELECT state,COUNT(*) AS records,COUNT(*)-SUM(located) AS without_coordinates,
 ROUND(100.0*(COUNT(*)-SUM(located))/COUNT(*),2) AS missing_pct
FROM facilities GROUP BY state ORDER BY without_coordinates DESC;

-- 9. State/LGA key prevents collisions between similarly named LGAs.
SELECT state,lga,COUNT(*) AS records,COUNT(*)-SUM(located) AS without_coordinates,
 COUNT(*)-SUM(known_status) AS unknown_status,SUM(flagged) AS source_flagged
FROM facilities GROUP BY state,lga ORDER BY without_coordinates DESC;

-- 10. Name-based candidates require review; matching names are not proof of duplicates.
SELECT state,lga,lower(name) AS normalized_name,COUNT(*) AS repeated_records
FROM facilities GROUP BY state,lga,lower(name) HAVING COUNT(*)>1 ORDER BY repeated_records DESC;

-- 11. Public primary-care subset: national and state comparisons with explicit cohort.
SELECT state,COUNT(*) AS public_primary_records,SUM(located) AS located,
 COUNT(*)-SUM(known_status) AS unknown_status
FROM facilities WHERE level='Primary' AND owner='Public' GROUP BY state ORDER BY public_primary_records DESC;

-- 12. Data cube behind the linked filters and centroid map.
SELECT lga_id,level,owner,COUNT(*) AS records,SUM(located) AS located,
 SUM(flagged) AS flagged,SUM(known_status) AS known_status,SUM(functional) AS functional,
 SUM(lat) AS latitude_sum,SUM(lon) AS longitude_sum
FROM facilities GROUP BY lga_id,level,owner ORDER BY lga_id,level,owner;
