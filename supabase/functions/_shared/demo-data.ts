export const demoData = {
  farm: {
    farm_id: 1,
    farm_name: 'Green Valley Farm',
    latitude: 40.7128,
    longitude: -74.006,
    area: 12.5,
    soil_type: 'Loamy',
    created_at: new Date().toISOString()
  },
  crop: {
    crop_id: 1,
    farm_id: 1,
    farm_name: 'Green Valley Farm',
    crop_name: 'Wheat',
    crop_type: 'Cereal',
    crop_variety: 'Golden Durum',
    sowing_date: '2025-02-01',
    expected_harvest: '2025-06-15',
    area: 5.0,
    status: 'growing',
    expected_yield: 15.0
  },
  inventory: {
    inventory_id: 1,
    farm_id: 1,
    input_name: 'N-P-K Fertilizer 15-15-15',
    category: 'Fertilizer',
    quantity: 250,
    unit: 'kg',
    farm_name: 'Green Valley Farm'
  },
  listing: {
    listing_id: 1,
    farm_id: 1,
    crop_name: 'Organic Wheat',
    farm_name: 'Green Valley Farm',
    price_per_unit: 25.5,
    available_qty: 500,
    status: 'active',
    seller_name: 'Farmer John'
  }
}
