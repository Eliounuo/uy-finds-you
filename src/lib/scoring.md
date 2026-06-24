# Property matching score (match_properties_for_request)

Computed in SQL on the database for each candidate property. Max ≈ 100.

| Signal | Weight | Notes |
|---|---|---|
| City match | +30 | hard filter — non-matching cities are excluded |
| Price within budget | +20 / +10 | 20 if ≤ budget_max, 10 if within +15%, 0 otherwise |
| Guests capacity | +10 | property.guests ≥ request.guests |
| Rooms | +8 | property.rooms ≥ requested rooms (or unspecified) |
| Amenities | +2 per match | each requested amenity present on property |
| Property rating | +0…10 | `min(rating × 2, 10)` |
| Distance | +20 / +12 / +4 | <2 km / <5 km / further (0 if no coords) |

**Hard filters** (a property must satisfy all):
- `status = 'active'`
- same `city`
- `price_per_night ≤ budget_max × 1.25`
- `guests ≥ requested guests`
- dates free (`is_property_available`)

**Distance** uses the Haversine formula with R=6371 km, returned in `distance_km` (2 decimals).

**UI surface**: requests page (`request-matches`) shows `match_score`, `rating`, and `distance_km` for each card so users can see why a property was suggested.

To tune weights, edit `match_properties_for_request` in a new migration; this doc must be updated in the same change.
