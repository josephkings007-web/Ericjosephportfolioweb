# CareAtlas Nigeria

A portfolio analysis by Eric Joseph Benedict, developed with AI assistance. The question is: **How does recorded health-facility provision vary across Nigeria, and which registry gaps should be verified before planning?**

## Dataset and attribution

Center for Integrated Earth System Information (CIESIN), Columbia University (2026). *GRID3 NGA – Health Facilities v4.0.* New York: Columbia University. DOI: https://doi.org/10.7916/pjpv-9q55. Accessed 26 October 2026. CC BY 4.0. Source metadata: https://www.arcgis.com/home/item.html?id=9df52e12d0b5422f8f73c44d0dc91f8b.

The country outline is Natural Earth's public-domain 1:110m countries geometry, obtained from https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson. Coordinate-centroid bubbles are an analytical derivative, not administrative headquarters or patient locations.

This release contains 70,235 records across 37 state/FCT units and 774 state–LGA pairs. The publisher describes it as non-exhaustive and not fully validated. Different input sources refer to different dates; a 2026 release is not proof that each facility was visited in 2026.

## Reproduce

From the repository root, using Python 3 (standard library only):

```sh
python healthcare_analysis.py --download
```

The pipeline downloads all source pages in OBJECTID order, verifies pagination and identifier uniqueness, retains the raw snapshot locally, and creates `careatlas/facilities.sqlite`, `careatlas/data.json`, `careatlas/states.csv`, `careatlas/lgas.csv`, and `careatlas/source.json`. The raw dataset and generated SQLite database are not distributed in this portfolio; they can be reconstructed with the command above.

Run the queries in `careatlas/analysis.sql` against the generated SQLite database. Re-running without `--download` analyses the locally saved snapshot. Source revisions may change results; `source.json` records a SHA-256 checksum of the raw input. Updating the snapshot requires reviewing and updating the narrative findings too.

## Decisions and audit trail

- Keep all records; require unique OBJECTID and unique_id values.
- Trim administrative labels; group LGAs by both state and LGA name.
- Standardize blank ownership and blank/unclassified care levels to `Unknown`.
- Treat blank/unknown functional status as missing information, not non-functionality.
- Retain records without coordinates in every non-spatial metric. Maps use only available valid coordinates.
- Preserve source quality flags; do not interpret a flagged record as an invalid facility.
- Inspect name repetitions without deleting records. Similar names can refer to different facilities.
- Build a 4,427-row cube by state/LGA, care level, and ownership; reconcile its counts to 70,235.

## Key national results

| Measure | Result | Interpretation |
| --- | ---: | --- |
| Registry records | 70,235 | A count of records, not independently validated distinct facilities |
| Records with coordinates | 58,529 | Available for the centroid calculation |
| Records without coordinates | 11,706 (16.7%) | Invisible in a point-only map, retained in totals |
| Blank/unknown operating status | 34,496 (49.1%) | Not evidence of closure |
| Source-flagged records | 29,976 (42.7%) | A verification worklist, not a deletion rule |
| Blank care-level fields | 14,097 | Kept under Unknown; another 108 explicitly say Unknown |
| Blank ownership fields | 4,551 | Kept under Unknown |
| Repeated state/LGA/name groups | 1,336 | Candidates for review, not confirmed duplicate facilities |
| Excess records in repeated-name groups | 1,378 | No records removed |

Lagos has 3,966 records, the highest state/FCT count in this snapshot, and 882 records without coordinates. These counts do not establish whether Lagos has adequate services relative to need.

Of 35,739 records with known status, 35,434 say Functional (99.1%). The same numerator is 50.5% of the full registry. The difference demonstrates why missingness and denominators must accompany a chart.

## Practical next steps

1. Validate unknown-status and unlocated records with local health authorities and source identifiers.
2. Review flags and repeated-name candidates before any deduplication.
3. Add independently sourced population, staffing, capacity, opening hours, and road/travel data before assessing actual access or allocating resources.

The dashboard's geocoding worklist orders records for **data verification**, not for medical need or healthcare investment.

## Interface and measures

State, care-level, and ownership filters update registry KPIs, state rankings, care/ownership mixes, and LGA rows. The comparison panel ignores the single-state filter but respects care-level and ownership filters, as labeled. Data downloads reflect all matching LGA summary rows, not only the visible page.

Shares use the selected records within each group. Zero denominators display a dash. Bubbles are positioned at the mean of available coordinates for each group and sized by total record count; their colors indicate missing-coordinate share. National findings remain fixed to the full snapshot and are labeled separately from interactive cohort metrics.

## Limits

This project does not estimate population-adjusted access, journey time, affordability, clinical quality, staffing, or operational capacity. A facility register is not a patient survey or a live status feed. Centroids obscure within-area geography and are not catchment models. Findings are descriptive and do not establish causality.

## Validation

```sh
node test_careatlas.cjs
python verify_healthcare_sql.py
```

Run the Python pipeline first to generate the local SQLite database used by the SQL checks. The interface tests use a DOM fixture; browser visual layout has not been verified.
