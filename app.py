from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import date, datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///propman.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
CORS(app)

# ── Models ──────────────────────────────────────────────

class Property(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    address = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50))
    bedrooms = db.Column(db.Integer, default=1)
    monthly_rent = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='available')  # available, occupied
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    leases = db.relationship('Lease', backref='property', lazy=True)
    maintenance_requests = db.relationship('Maintenance', backref='property', lazy=True)

    def to_dict(self):
        return {
            'id': self.id, 'address': self.address, 'type': self.type,
            'bedrooms': self.bedrooms, 'monthly_rent': self.monthly_rent,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Tenant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    leases = db.relationship('Lease', backref='tenant', lazy=True)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'email': self.email, 'phone': self.phone,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Lease(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenant.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    monthly_rent_at_time = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='active')  # active, expired, terminated
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    payments = db.relationship('Payment', backref='lease', lazy=True)

    def to_dict(self):
        return {
            'id': self.id, 'property_id': self.property_id, 'tenant_id': self.tenant_id,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'monthly_rent_at_time': self.monthly_rent_at_time,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lease_id = db.Column(db.Integer, db.ForeignKey('lease.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    paid_date = db.Column(db.Date, nullable=True)
    method = db.Column(db.String(50), default='bank_transfer')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def computed_status(self):
        if self.paid_date:
            return 'paid'
        if self.due_date and self.due_date < date.today():
            return 'overdue'
        return 'pending'

    def to_dict(self):
        return {
            'id': self.id, 'lease_id': self.lease_id, 'amount': self.amount,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'method': self.method,
            'status': self.computed_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Maintenance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey('property.id'), nullable=False)
    issue = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='open')  # open, closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'property_id': self.property_id, 'issue': self.issue,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Helpers ─────────────────────────────────────────────

def err(msg, code=400):
    # Return a JSON error response with optional HTTP status code
    return jsonify({'error': msg}), code

def parse_date(s):
    # Convert a date string (YYYY-MM-DD) or date object to a date object, or return None if empty
    if not s:
        return None
    if isinstance(s, date):
        return s
    return datetime.strptime(s, '%Y-%m-%d').date()


# ── Properties ──────────────────────────────────────────

@app.route('/properties', methods=['GET'])
def get_properties():
    # Fetch all properties, optionally filter by status (available/occupied)
    status = request.args.get('status')
    q = Property.query
    if status:
        q = q.filter_by(status=status)
    return jsonify([p.to_dict() for p in q.all()])

@app.route('/properties', methods=['POST'])
def create_property():
    # Create a new property (requires address and monthly_rent)
    d = request.json or {}
    if not d.get('address') or not d.get('monthly_rent'):
        return err('address and monthly_rent required')
    p = Property(
        address=d['address'], type=d.get('type', 'flat'),
        bedrooms=d.get('bedrooms', 1), monthly_rent=d['monthly_rent']
    )
    db.session.add(p); db.session.commit()
    return jsonify(p.to_dict()), 201

@app.route('/properties/<int:pid>', methods=['GET'])
def get_property(pid):
    # Fetch a single property by ID, return 404 if not found
    return jsonify(Property.query.get_or_404(pid).to_dict())

@app.route('/properties/<int:pid>', methods=['PUT'])
def update_property(pid):
    # Update property fields: address, type, bedrooms, monthly_rent, status
    p = Property.query.get_or_404(pid)
    d = request.json or {}
    for field in ['address', 'type', 'bedrooms', 'monthly_rent', 'status']:
        if field in d:
            setattr(p, field, d[field])
    db.session.commit()
    return jsonify(p.to_dict())

@app.route('/properties/<int:pid>', methods=['DELETE'])
def delete_property(pid):
    # Delete a property by ID
    p = Property.query.get_or_404(pid)
    db.session.delete(p); db.session.commit()
    return jsonify({'deleted': pid})


# ── Tenants ─────────────────────────────────────────────

@app.route('/tenants', methods=['GET'])
def get_tenants():
    # Fetch all tenants
    return jsonify([t.to_dict() for t in Tenant.query.all()])

@app.route('/tenants', methods=['POST'])
def create_tenant():
    # Create a new tenant (requires name and email, email must be unique)
    d = request.json or {}
    if not d.get('name') or not d.get('email'):
        return err('name and email required')
    if Tenant.query.filter_by(email=d['email']).first():
        return err('email already exists')
    t = Tenant(name=d['name'], email=d['email'], phone=d.get('phone'))
    db.session.add(t); db.session.commit()
    return jsonify(t.to_dict()), 201

@app.route('/tenants/<int:tid>', methods=['GET'])
def get_tenant(tid):
    # Fetch a single tenant by ID
    return jsonify(Tenant.query.get_or_404(tid).to_dict())

@app.route('/tenants/<int:tid>', methods=['PUT'])
def update_tenant(tid):
    # Update tenant fields: name, email, phone
    t = Tenant.query.get_or_404(tid)
    d = request.json or {}
    for field in ['name', 'email', 'phone']:
        if field in d:
            setattr(t, field, d[field])
    db.session.commit()
    return jsonify(t.to_dict())

@app.route('/tenants/<int:tid>', methods=['DELETE'])
def delete_tenant(tid):
    # Delete a tenant by ID
    t = Tenant.query.get_or_404(tid)
    db.session.delete(t); db.session.commit()
    return jsonify({'deleted': tid})


# ── Leases ──────────────────────────────────────────────

@app.route('/leases', methods=['GET'])
def get_leases():
    # Fetch all leases, optionally filter by tenant_id, property_id, or status
    q = Lease.query
    tenant_id = request.args.get('tenant_id')
    property_id = request.args.get('property_id')
    status = request.args.get('status')
    if tenant_id:
        q = q.filter_by(tenant_id=int(tenant_id))
    if property_id:
        q = q.filter_by(property_id=int(property_id))
    if status:
        q = q.filter_by(status=status)
    return jsonify([l.to_dict() for l in q.all()])

@app.route('/leases', methods=['POST'])
def create_lease():
    # Create a new lease; validates property and tenant exist, no active lease on property
    d = request.json or {}
    required = ['property_id', 'tenant_id', 'start_date', 'end_date', 'monthly_rent_at_time']
    missing = [k for k in required if k not in d]
    if missing:
        return err(f'missing fields: {missing}')
    prop = Property.query.get(d['property_id'])
    if not prop:
        return err('property not found', 404)
    tenant = Tenant.query.get(d['tenant_id'])
    if not tenant:
        return err('tenant not found', 404)
    active = Lease.query.filter_by(property_id=d['property_id'], status='active').first()
    if active:
        return err('property already has an active lease', 409)
    try:
        sd = parse_date(d['start_date'])
        ed = parse_date(d['end_date'])
    except ValueError:
        return err('dates must be YYYY-MM-DD')
    l = Lease(
        property_id=d['property_id'], tenant_id=d['tenant_id'],
        start_date=sd, end_date=ed,
        monthly_rent_at_time=d['monthly_rent_at_time'],
    )
    prop.status = 'occupied'
    db.session.add(l); db.session.commit()
    return jsonify(l.to_dict()), 201

@app.route('/leases/<int:lid>', methods=['GET'])
def get_lease(lid):
    # Fetch a single lease by ID
    return jsonify(Lease.query.get_or_404(lid).to_dict())

@app.route('/leases/<int:lid>', methods=['PUT'])
def update_lease(lid):
    # Update lease fields (start_date, end_date, monthly_rent_at_time, status) and sync property status
    l = Lease.query.get_or_404(lid)
    d = request.json or {}
    if 'status' in d and d['status'] == 'active' and l.status != 'active':
        conflict = Lease.query.filter_by(property_id=l.property_id, status='active').first()
        if conflict and conflict.id != l.id:
            return err('another active lease exists on this property', 409)
    if 'start_date' in d:
        try:
            l.start_date = parse_date(d['start_date'])
        except ValueError:
            return err('start_date must be YYYY-MM-DD')
    if 'end_date' in d:
        try:
            l.end_date = parse_date(d['end_date'])
        except ValueError:
            return err('end_date must be YYYY-MM-DD')
    if 'monthly_rent_at_time' in d:
        l.monthly_rent_at_time = d['monthly_rent_at_time']
    if 'status' in d:
        l.status = d['status']
        if l.status != 'active':
            still_active = Lease.query.filter(
                Lease.property_id == l.property_id, Lease.status == 'active', Lease.id != l.id
            ).first()
            if not still_active:
                l.property.status = 'available'
        else:
            l.property.status = 'occupied'
    db.session.commit()
    return jsonify(l.to_dict())

@app.route('/leases/<int:lid>', methods=['DELETE'])
def delete_lease(lid):
    # Delete a lease and mark property as available if no other active leases exist
    l = Lease.query.get_or_404(lid)
    was_active = l.status == 'active'
    pid = l.property_id
    db.session.delete(l); db.session.commit()
    if was_active:
        still_active = Lease.query.filter_by(property_id=pid, status='active').first()
        if not still_active:
            prop = Property.query.get(pid)
            if prop:
                prop.status = 'available'
                db.session.commit()
    return jsonify({'deleted': lid})

@app.route('/leases/<int:lid>/terminate', methods=['POST'])
def terminate_lease(lid):
    # Terminate a lease and mark the property as available
    l = Lease.query.get_or_404(lid)
    l.status = 'terminated'
    l.property.status = 'available'
    db.session.commit()
    return jsonify({'message': f'lease {lid} terminated', 'lease': l.to_dict()})


# ── Payments ────────────────────────────────────────────

@app.route('/payments', methods=['GET'])
def get_payments():
    # Fetch all payments, optionally filter by lease_id or tenant_id
    q = Payment.query
    lease_id = request.args.get('lease_id')
    tenant_id = request.args.get('tenant_id')
    if lease_id:
        q = q.filter_by(lease_id=int(lease_id))
    if tenant_id:
        q = q.join(Lease).filter(Lease.tenant_id == int(tenant_id))
    return jsonify([p.to_dict() for p in q.all()])

@app.route('/payments', methods=['POST'])
def create_payment():
    # Create a new payment; validates lease exists
    d = request.json or {}
    if not d.get('lease_id') or d.get('amount') is None or not d.get('due_date'):
        return err('lease_id, amount, and due_date required')
    lease = Lease.query.get(d['lease_id'])
    if not lease:
        return err('lease not found', 404)
    try:
        due = parse_date(d['due_date'])
        paid = parse_date(d.get('paid_date'))
    except ValueError:
        return err('dates must be YYYY-MM-DD')
    p = Payment(
        lease_id=d['lease_id'], amount=d['amount'],
        due_date=due, paid_date=paid,
        method=d.get('method', 'bank_transfer'),
    )
    db.session.add(p); db.session.commit()
    return jsonify(p.to_dict()), 201

@app.route('/payments/<int:pid>', methods=['GET'])
def get_payment(pid):
    # Fetch a single payment by ID
    return jsonify(Payment.query.get_or_404(pid).to_dict())

@app.route('/payments/<int:pid>', methods=['PUT'])
def update_payment(pid):
    # Update payment fields: amount, due_date, paid_date, method
    p = Payment.query.get_or_404(pid)
    d = request.json or {}
    if 'amount' in d:
        p.amount = d['amount']
    if 'due_date' in d:
        try:
            p.due_date = parse_date(d['due_date'])
        except ValueError:
            return err('due_date must be YYYY-MM-DD')
    if 'paid_date' in d:
        try:
            p.paid_date = parse_date(d['paid_date'])
        except ValueError:
            return err('paid_date must be YYYY-MM-DD')
    if 'method' in d:
        p.method = d['method']
    db.session.commit()
    return jsonify(p.to_dict())

@app.route('/payments/<int:pid>', methods=['DELETE'])
def delete_payment(pid):
    # Delete a payment by ID
    p = Payment.query.get_or_404(pid)
    db.session.delete(p); db.session.commit()
    return jsonify({'deleted': pid})


# ── Maintenance ─────────────────────────────────────────

@app.route('/maintenance', methods=['GET'])
def get_maintenance():
    # Fetch all maintenance requests, optionally filter by property_id, tenant_id, or status
    q = Maintenance.query
    property_id = request.args.get('property_id')
    tenant_id = request.args.get('tenant_id')
    status = request.args.get('status')
    if property_id:
        q = q.filter_by(property_id=int(property_id))
    if tenant_id:
        # Find all maintenance tickets for properties this tenant has leased (current or past)
        leased_property_ids = db.session.query(Lease.property_id).filter(
            Lease.tenant_id == int(tenant_id)
        ).distinct().subquery()
        q = q.filter(Maintenance.property_id.in_(leased_property_ids))
    if status:
        q = q.filter_by(status=status)
    return jsonify([m.to_dict() for m in q.all()])

@app.route('/maintenance', methods=['POST'])
def create_maintenance():
    # Create a new maintenance request; validates property exists
    d = request.json or {}
    if not d.get('property_id') or not d.get('issue'):
        return err('property_id and issue required')
    if not Property.query.get(d['property_id']):
        return err('property not found', 404)
    m = Maintenance(
        property_id=d['property_id'], issue=d['issue'],
        status=d.get('status', 'open'),
    )
    db.session.add(m); db.session.commit()
    return jsonify(m.to_dict()), 201

@app.route('/maintenance/<int:mid>', methods=['GET'])
def get_maintenance_one(mid):
    # Fetch a single maintenance request by ID
    return jsonify(Maintenance.query.get_or_404(mid).to_dict())

@app.route('/maintenance/<int:mid>', methods=['PUT'])
def update_maintenance(mid):
    # Update maintenance request fields: issue, status
    m = Maintenance.query.get_or_404(mid)
    d = request.json or {}
    if 'issue' in d:
        m.issue = d['issue']
    if 'status' in d:
        m.status = d['status']
    db.session.commit()
    return jsonify(m.to_dict())

@app.route('/maintenance/<int:mid>', methods=['DELETE'])
def delete_maintenance(mid):
    # Delete a maintenance request by ID
    m = Maintenance.query.get_or_404(mid)
    db.session.delete(m); db.session.commit()
    return jsonify({'deleted': mid})


# ── Dashboard ───────────────────────────────────────────

@app.route('/dashboard/stats', methods=['GET'])
def dashboard_stats():
    # Fetch landlord portfolio stats: properties, occupancy, income, overdue, maintenance
    total_props = Property.query.count()
    occupied = Property.query.filter_by(status='occupied').count()
    active_leases = Lease.query.filter_by(status='active').count()

    paid_sum = db.session.query(db.func.sum(Payment.amount)).filter(
        Payment.paid_date.isnot(None)
    ).scalar() or 0

    monthly_income = db.session.query(db.func.sum(Property.monthly_rent)).filter_by(
        status='occupied'
    ).scalar() or 0

    today = date.today()
    overdue_count = Payment.query.filter(
        Payment.paid_date.is_(None), Payment.due_date < today
    ).count()

    open_maintenance = Maintenance.query.filter_by(status='open').count()

    return jsonify({
        'total_properties': total_props,
        'occupied': occupied,
        'available': total_props - occupied,
        'occupancy_rate': f'{(occupied/total_props*100):.1f}%' if total_props else '0%',
        'active_leases': active_leases,
        'total_payments_collected': round(paid_sum, 2),
        'monthly_rental_income': round(monthly_income, 2),
        'overdue_payments_count': overdue_count,
        'open_maintenance_count': open_maintenance,
    })


# ── Tenant self-view ────────────────────────────────────

@app.route('/me', methods=['GET'])
def me():
    # Fetch tenant's own profile: active lease (with property), next unpaid rent, open maintenance count
    tid = int(request.args.get('tenant_id', 1))
    tenant = Tenant.query.get_or_404(tid)
    lease = Lease.query.filter_by(tenant_id=tid, status='active').first()
    lease_dict = None
    next_payment = None
    open_maint = 0
    if lease:
        ld = lease.to_dict()
        ld['property'] = lease.property.to_dict() if lease.property else None
        lease_dict = ld
        unpaid = (
            Payment.query
            .filter_by(lease_id=lease.id, paid_date=None)
            .order_by(Payment.due_date.asc())
            .first()
        )
        if unpaid:
            next_payment = unpaid.to_dict()
        open_maint = Maintenance.query.filter_by(
            property_id=lease.property_id, status='open'
        ).count()
    return jsonify({
        'tenant': tenant.to_dict(),
        'lease': lease_dict,
        'next_payment': next_payment,
        'open_maintenance_count': open_maint,
    })


# ── Boot ────────────────────────────────────────────────

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
