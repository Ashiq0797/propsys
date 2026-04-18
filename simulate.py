"""
Property Management System - Full Simulation
Runs against localhost:5000
"""
import requests
import json

BASE = 'http://localhost:5000'


def p(label, res):
    print(f'\n{"-"*50}')
    print(f'[{res.status_code}] {label}')
    try:
        print(json.dumps(res.json(), indent=2))
    except Exception:
        print(res.text)


print('\n== PROPERTY MANAGEMENT SYSTEM - SIMULATION ==\n')

# 1. Properties
r = requests.post(f'{BASE}/properties', json={
    'address': '12 Baker Street, London, NW1 6XE',
    'type': 'flat', 'bedrooms': 2, 'monthly_rent': 2200,
})
p('Create property 1 (Baker St flat)', r)
prop1_id = r.json()['id']

r = requests.post(f'{BASE}/properties', json={
    'address': '45 Victoria Road, London, SW1V 2QH',
    'type': 'house', 'bedrooms': 3, 'monthly_rent': 3500,
})
p('Create property 2 (Victoria Rd house)', r)
prop2_id = r.json()['id']

r = requests.post(f'{BASE}/properties', json={
    'address': '8 Camden High St, London, NW1 0JH',
    'type': 'studio', 'bedrooms': 0, 'monthly_rent': 1400,
})
p('Create property 3 (Camden studio)', r)
prop3_id = r.json()['id']

# 2. Tenants
r = requests.post(f'{BASE}/tenants', json={
    'name': 'Ashiq Pavel', 'email': 'ashiq@example.com', 'phone': '07700900001',
})
p('Create tenant 1', r)
tenant1_id = r.json()['id']

r = requests.post(f'{BASE}/tenants', json={
    'name': 'Sarah Johnson', 'email': 'sarah@example.com', 'phone': '07700900002',
})
p('Create tenant 2', r)
tenant2_id = r.json()['id']

# 3. Leases
r = requests.post(f'{BASE}/leases', json={
    'property_id': prop1_id, 'tenant_id': tenant1_id,
    'start_date': '2026-01-01', 'end_date': '2026-12-31',
    'monthly_rent_at_time': 2200,
})
p('Create lease (Ashiq -> Baker St)', r)
lease1_id = r.json()['id']

r = requests.post(f'{BASE}/leases', json={
    'property_id': prop2_id, 'tenant_id': tenant2_id,
    'start_date': '2026-03-01', 'end_date': '2027-02-28',
    'monthly_rent_at_time': 3500,
})
p('Create lease (Sarah -> Victoria Rd)', r)
lease2_id = r.json()['id']

# Double-book attempt (should fail)
r = requests.post(f'{BASE}/leases', json={
    'property_id': prop1_id, 'tenant_id': tenant2_id,
    'start_date': '2026-06-01', 'end_date': '2027-05-31',
    'monthly_rent_at_time': 2200,
})
p('Try double-book occupied property (should fail)', r)

# 4. Payments - mix paid, pending, overdue
# paid
for due, paid in [('2026-01-31', '2026-01-30'), ('2026-02-28', '2026-02-27'), ('2026-03-31', '2026-03-31')]:
    r = requests.post(f'{BASE}/payments', json={
        'lease_id': lease1_id, 'amount': 2200,
        'due_date': due, 'paid_date': paid, 'method': 'bank_transfer',
    })
p('Record 3 paid months (Baker St)', r)

# overdue (due in the past, paid_date null)
r = requests.post(f'{BASE}/payments', json={
    'lease_id': lease1_id, 'amount': 2200,
    'due_date': '2026-04-01', 'method': 'bank_transfer',
})
p('Record overdue payment (due 2026-04-01, unpaid)', r)

# pending (due in the future)
r = requests.post(f'{BASE}/payments', json={
    'lease_id': lease1_id, 'amount': 2200,
    'due_date': '2026-12-31', 'method': 'bank_transfer',
})
p('Record pending payment (due 2026-12-31)', r)

# one paid on Victoria Rd
r = requests.post(f'{BASE}/payments', json={
    'lease_id': lease2_id, 'amount': 3500,
    'due_date': '2026-03-31', 'paid_date': '2026-03-31', 'method': 'card',
})
p('Record 1 paid month (Victoria Rd)', r)

# 5. Payments per lease
r = requests.get(f'{BASE}/payments?lease_id={lease1_id}')
p(f'All payments for lease {lease1_id} (expect paid / overdue / pending mix)', r)

# 6. Maintenance
r = requests.post(f'{BASE}/maintenance', json={
    'property_id': prop1_id, 'issue': 'Leaking kitchen tap',
})
p('Create maintenance request (Baker St, leaking tap)', r)
maint1_id = r.json()['id']

r = requests.post(f'{BASE}/maintenance', json={
    'property_id': prop2_id, 'issue': 'Boiler pressure low',
})
p('Create maintenance request (Victoria Rd, boiler)', r)
maint2_id = r.json()['id']

r = requests.put(f'{BASE}/maintenance/{maint2_id}', json={'status': 'closed'})
p(f'Close maintenance request {maint2_id}', r)

r = requests.get(f'{BASE}/maintenance?status=open')
p('Open maintenance requests', r)

# 7. Listings
r = requests.get(f'{BASE}/properties')
p('All properties', r)

r = requests.get(f'{BASE}/properties?status=available')
p('Available properties only', r)

r = requests.get(f'{BASE}/tenants')
p('All tenants', r)

# 8. Terminate + verify property flips back to available
r = requests.post(f'{BASE}/leases/{lease1_id}/terminate')
p(f'Terminate lease {lease1_id}', r)

r = requests.get(f'{BASE}/properties/{prop1_id}')
p('Baker St property after lease terminated (should be available)', r)

# 9. Dashboard stats
r = requests.get(f'{BASE}/dashboard/stats')
p('DASHBOARD SUMMARY', r)

print('\n\n[OK] Simulation complete!\n')
