# Edge Functions - Response Shapes Documentation

## Common Response Format

All endpoints return responses in this format:

```json
{
  "success": boolean,
  "data": any,
  "demo"?: object,
  "message"?: string,
  "error"?: string
}
```

---

## 1. `/get-dashboard`

### Success Response (with data)

```json
{
  "success": true,
  "data": {
    "profile": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "auth_user_id": "auth-user-uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "role": "farmer",
      "phone_number": "+1234567890",
      "address": "123 Farm St, City, State 12345",
      "profile_picture": "https://example.com/photo.jpg"
    },
    "counts": {
      "farms_count": 3,
      "crops_count": 12,
      "inventory_count": 25,
      "listings_count": 5
    },
    "recent_crops": [
      {
        "crop_id": 123,
        "crop_name": "Maize",
        "farm_id": 45,
        "farm_name": "Green Farm",
        "sowing_date": "2025-09-01",
        "expected_harvest": "2026-01-15",
        "status": "planted",
        "area": 2.5
      }
    ],
    "recent_listings": [
      {
        "listing_id": 789,
        "crop_id": 123,
        "crop_name": "Maize",
        "farm_id": 45,
        "farm_name": "Green Farm",
        "price_per_unit": 25.50,
        "available_qty": 500,
        "status": "active",
        "listed_on": "2025-01-15T10:30:00Z"
      }
    ]
  },
  "demo": {
    "crop": {
      "crop_id": 0,
      "crop_name": "Demo Maize",
      "farm_name": "Demo Green Farm",
      "sowing_date": "2025-01-01",
      "expected_harvest": "2025-05-01",
      "status": "planted",
      "area": 1.5
    },
    "listing": {
      "listing_id": 0,
      "crop_name": "Demo Maize",
      "farm_name": "Demo Green Farm",
      "price_per_unit": 25.50,
      "available_qty": 500,
      "status": "active"
    }
  }
}
```

### Empty Response (no data, includes demo)

```json
{
  "success": true,
  "data": {
    "profile": { /* user profile */ },
    "counts": {
      "farms_count": 0,
      "crops_count": 0,
      "inventory_count": 0,
      "listings_count": 0
    },
    "recent_crops": [],
    "recent_listings": []
  },
  "demo": {
    "crop": { /* demo crop */ },
    "listing": { /* demo listing */ }
  }
}
```

### Unauthorized Response

```json
{
  "success": false,
  "error": "Unauthorized. Missing or invalid token."
}
```

---

## 2. `/get-farms`

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "farm_id": 45,
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "farm_name": "Green Farm",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "area": 10.5,
      "soil_type": "Loamy",
      "crop_type": "Mixed",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Empty Response (with demo)

```json
{
  "success": true,
  "data": [],
  "demo": {
    "farm": {
      "farm_id": 0,
      "farm_name": "Demo Green Farm",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "area": 10.5,
      "soil_type": "Loamy",
      "crop_type": "Mixed"
    }
  },
  "message": "No farms found for this account."
}
```

---

## 3. `/get-crops`

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "crop_id": 123,
      "crop_name": "Maize",
      "farm_id": 45,
      "farm_name": "Green Farm",
      "crop_type": "Cereal",
      "sowing_date": "2025-01-01",
      "expected_harvest": "2025-05-01",
      "area": 1.5,
      "soil_type": "Loamy",
      "status": "planted",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Empty Response (with demo)

```json
{
  "success": true,
  "data": [],
  "demo": {
    "crop": {
      "crop_id": 0,
      "crop_name": "Demo Maize",
      "farm_name": "Demo Green Farm",
      "sowing_date": "2025-01-01",
      "expected_harvest": "2025-05-01",
      "status": "planted",
      "area": 1.5
    }
  },
  "message": "No crops found for this account."
}
```

---

## 4. `/get-inventory`

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "inventory_id": 456,
      "farm_id": 45,
      "farm_name": "Green Farm",
      "input_id": 10,
      "input_name": "Nitrogen Fertilizer",
      "category": "Fertilizer",
      "unit": "kg",
      "quantity": 100,
      "added_on": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Empty Response (with demo)

```json
{
  "success": true,
  "data": [],
  "demo": {
    "inventory": {
      "inventory_id": 0,
      "farm_name": "Demo Green Farm",
      "input_name": "Demo Fertilizer",
      "category": "Fertilizer",
      "unit": "kg",
      "quantity": 100
    }
  },
  "message": "No inventory items found for this account."
}
```

---

## 5. `/get-listings`

### Success Response (Farmer Role)

```json
{
  "success": true,
  "data": [
    {
      "listing_id": 789,
      "crop_id": 123,
      "crop_name": "Maize",
      "farm_id": 45,
      "farm_name": "Green Farm",
      "price_per_unit": 25.50,
      "available_qty": 500,
      "status": "active",
      "listed_on": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Success Response (Buyer Role - includes seller_name)

```json
{
  "success": true,
  "data": [
    {
      "listing_id": 789,
      "crop_id": 123,
      "crop_name": "Maize",
      "farm_id": 45,
      "farm_name": "Green Farm",
      "seller_id": "123e4567-e89b-12d3-a456-426614174000",
      "seller_name": "John Doe",
      "price_per_unit": 25.50,
      "available_qty": 500,
      "status": "active",
      "listed_on": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### Empty Response (with demo)

```json
{
  "success": true,
  "data": [],
  "demo": {
    "listing": {
      "listing_id": 0,
      "crop_name": "Demo Maize",
      "farm_name": "Demo Green Farm",
      "price_per_unit": 25.50,
      "available_qty": 500,
      "status": "active"
    }
  },
  "message": "No listings found for this account."
}
```

---

## 6. `/get-profile`

### Success Response

```json
{
  "success": true,
  "data": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "auth_user_id": "auth-user-uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "role": "farmer",
    "phone_number": "+1234567890",
    "address": "123 Farm St, City, State 12345",
    "profile_picture": "https://example.com/photo.jpg",
    "dob": "1990-01-01"
  }
}
```

### User Not Found Response

```json
{
  "success": false,
  "error": "User not found in database."
}
```

---

## 7. `/search`

### Success Response

```json
{
  "success": true,
  "data": {
    "crops": [
      {
        "crop_id": 123,
        "crop_name": "Maize",
        "farm_id": 45,
        "farm_name": "Green Farm",
        "crop_type": "Cereal",
        "status": "planted",
        "area": 1.5
      }
    ],
    "listings": [
      {
        "listing_id": 789,
        "crop_id": 123,
        "crop_name": "Maize",
        "farm_id": 45,
        "farm_name": "Green Farm",
        "price_per_unit": 25.50,
        "available_qty": 500,
        "status": "active"
      }
    ],
    "query": "maize",
    "total_results": 2
  }
}
```

### Empty Query Response

```json
{
  "success": true,
  "data": {
    "crops": [],
    "listings": []
  },
  "message": "Please provide a search query (q parameter)."
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized. Missing or invalid token."
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "User not found in database."
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error."
}
```

---

## Query Parameters

All endpoints (except `/get-profile`) support:

- `?limit=N` - Number of results to return (default: 5, max: 50)
- `/search` also supports `?q=searchterm` - Search query text

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. Demo data is always included in responses when data array is empty
3. Buyer role receives `seller_name` and `seller_id` in listings
4. Empty arrays are returned as `[]`, not `null`
5. All UUIDs are in standard format
6. Prices are in decimal format (e.g., 25.50)
7. Quantities are integers
8. Areas are in decimal format (hectares or acres)

