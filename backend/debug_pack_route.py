# Route de diagnostic à ajouter temporairement dans app.py

@app.route('/api/debug/pack')
def debug_pack():
    """Route de diagnostic pour comprendre pourquoi le Pack n'est pas créé"""
    from models import Pack
    
    results = {}
    
    # 1. Vérifier si le Pack existe
    pack = Pack.query.filter_by(name="Abonnement Annuel").first()
    results['pack_exists'] = pack is not None
    
    if pack:
        results['pack_id'] = pack.id
        results['pack_name'] = pack.name
        results['pack_price'] = pack.price_chf
        results['pack_stripe_price_id'] = pack.stripe_price_id
    
    # 2. Compter tous les Packs
    results['total_packs'] = Pack.query.count()
    
    # 3. Lister tous les Packs
    all_packs = Pack.query.all()
    results['all_packs'] = [
        {
            'id': p.id,
            'name': p.name,
            'price': p.price_chf,
            'stripe_price_id': p.stripe_price_id
        }
        for p in all_packs
    ]
    
    # 4. Tester la création directe
    try:
        if not pack:
            test_pack = Pack(name="Abonnement Annuel", price_chf=49.0, access_count=1)
            db.session.add(test_pack)
            db.session.flush()
            results['test_pack_id_before_commit'] = test_pack.id
            db.session.commit()
            results['test_pack_created'] = True
            results['test_pack_id_after_commit'] = test_pack.id
        else:
            results['test_pack_created'] = False
            results['reason'] = "Pack already exists"
    except Exception as e:
        results['test_pack_created'] = False
        results['error'] = str(e)
    
    return jsonify(results)
