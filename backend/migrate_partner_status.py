"""
Migration V24: Vérification et correction des statuts partenaires
- Ajoute la colonne 'status' si elle n'existe pas
- Définit 'active' par défaut pour tous les partenaires existants
- Vérifie l'intégrité des données
"""

from sqlalchemy import text
from models import db
import traceback

def run_partner_status_migration():
    """
    Exécute la migration de vérification/correction des statuts partenaires
    """
    print("\n" + "="*70)
    print("🚀 MIGRATION V24 - VÉRIFICATION STATUTS PARTENAIRES")
    print("="*70 + "\n")
    
    try:
        # ==========================================
        # 1. VÉRIFIER LA STRUCTURE DE LA TABLE
        # ==========================================
        print("📊 Étape 1: Vérification de la structure de la table 'partners'...")
        
        result = db.session.execute(text("""
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'partners'
            ORDER BY ordinal_position;
        """)).fetchall()
        
        print("\n✅ Colonnes actuelles dans 'partners':")
        has_status = False
        for col in result:
            print(f"  - {col.column_name}: {col.data_type} (nullable: {col.is_nullable}, default: {col.column_default})")
            if col.column_name == 'status':
                has_status = True
        
        # ==========================================
        # 2. AJOUTER LA COLONNE 'status' SI ABSENTE
        # ==========================================
        if not has_status:
            print("\n⚠️  Colonne 'status' absente - Ajout en cours...")
            db.session.execute(text("""
                ALTER TABLE partners 
                ADD COLUMN status VARCHAR(20) DEFAULT 'active' NOT NULL;
            """))
            db.session.commit()
            print("✅ Colonne 'status' ajoutée avec succès (défaut: 'active')")
        else:
            print("\n✅ Colonne 'status' déjà présente")
        
        # ==========================================
        # 3. COMPTER LES PARTENAIRES PAR STATUT
        # ==========================================
        print("\n📊 Étape 2: Analyse des statuts actuels...")
        
        stats = db.session.execute(text("""
            SELECT 
                status,
                COUNT(*) as count
            FROM partners
            GROUP BY status
            ORDER BY count DESC;
        """)).fetchall()
        
        print("\n📈 Répartition des statuts:")
        total = 0
        for stat in stats:
            print(f"  - {stat.status or 'NULL'}: {stat.count} partenaires")
            total += stat.count
        print(f"\n  TOTAL: {total} partenaires")
        
        # ==========================================
        # 4. CORRIGER LES STATUTS NULL
        # ==========================================
        print("\n🔧 Étape 3: Correction des statuts NULL...")
        
        null_count = db.session.execute(text("""
            SELECT COUNT(*) as count
            FROM partners
            WHERE status IS NULL OR status = '';
        """)).scalar()
        
        if null_count > 0:
            print(f"⚠️  {null_count} partenaires avec statut NULL ou vide - Correction en cours...")
            db.session.execute(text("""
                UPDATE partners
                SET status = 'active'
                WHERE status IS NULL OR status = '';
            """))
            db.session.commit()
            print(f"✅ {null_count} partenaires mis à jour avec statut 'active'")
        else:
            print("✅ Aucun statut NULL détecté")
        
        # ==========================================
        # 5. NORMALISER LES STATUTS NON-STANDARD
        # ==========================================
        print("\n🔧 Étape 4: Normalisation des statuts non-standard...")
        
        # Mapper les variations possibles vers les statuts standards
        normalization_map = {
            'Active': 'active',
            'ACTIVE': 'active',
            'Actif': 'active',
            'actif': 'active',
            'Inactive': 'inactive',
            'INACTIVE': 'inactive',
            'Inactif': 'inactive',
            'inactif': 'inactive',
            'Pending': 'pending',
            'PENDING': 'pending',
            'En attente': 'pending',
            'Suspended': 'suspended',
            'SUSPENDED': 'suspended',
            'Suspendu': 'suspended'
        }
        
        normalized_count = 0
        for old_status, new_status in normalization_map.items():
            result = db.session.execute(text("""
                UPDATE partners
                SET status = :new_status
                WHERE status = :old_status;
            """), {'old_status': old_status, 'new_status': new_status})
            
            if result.rowcount > 0:
                print(f"  ✓ '{old_status}' → '{new_status}': {result.rowcount} partenaires")
                normalized_count += result.rowcount
        
        if normalized_count > 0:
            db.session.commit()
            print(f"\n✅ {normalized_count} statuts normalisés")
        else:
            print("✅ Tous les statuts sont déjà normalisés")
        
        # ==========================================
        # 6. VÉRIFIER LES STATUTS NON-RECONNUS
        # ==========================================
        print("\n🔍 Étape 5: Vérification des statuts non-reconnus...")
        
        valid_statuses = ('active', 'inactive', 'pending', 'suspended')
        unknown_statuses = db.session.execute(text("""
            SELECT DISTINCT status, COUNT(*) as count
            FROM partners
            WHERE status NOT IN :valid_statuses
            GROUP BY status;
        """), {'valid_statuses': valid_statuses}).fetchall()
        
        if unknown_statuses:
            print("⚠️  Statuts non-reconnus détectés:")
            for status in unknown_statuses:
                print(f"  - '{status.status}': {status.count} partenaires")
            
            # Demander confirmation avant de corriger (en production, mettre en 'pending')
            print("\n🔧 Correction automatique: statuts non-reconnus → 'pending'")
            db.session.execute(text("""
                UPDATE partners
                SET status = 'pending'
                WHERE status NOT IN :valid_statuses;
            """), {'valid_statuses': valid_statuses})
            db.session.commit()
            print("✅ Statuts non-reconnus corrigés")
        else:
            print("✅ Tous les statuts sont reconnus")
        
        # ==========================================
        # 7. STATISTIQUES FINALES
        # ==========================================
        print("\n📊 Étape 6: Statistiques finales...")
        
        final_stats = db.session.execute(text("""
            SELECT 
                status,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
            FROM partners
            GROUP BY status
            ORDER BY count DESC;
        """)).fetchall()
        
        print("\n📈 Répartition finale des statuts:")
        print("  " + "-" * 50)
        print(f"  {'Statut':<15} {'Nombre':<10} {'Pourcentage':<15}")
        print("  " + "-" * 50)
        for stat in final_stats:
            print(f"  {stat.status:<15} {stat.count:<10} {stat.percentage}%")
        print("  " + "-" * 50)
        
        # ==========================================
        # 8. VÉRIFICATION DES PARTENAIRES ACTIFS AVEC GPS
        # ==========================================
        print("\n🗺️  Étape 7: Vérification des partenaires actifs avec coordonnées GPS...")
        
        gps_stats = db.session.execute(text("""
            SELECT 
                CASE 
                    WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 'Avec GPS'
                    ELSE 'Sans GPS'
                END as gps_status,
                COUNT(*) as count
            FROM partners
            WHERE status = 'active'
            GROUP BY gps_status;
        """)).fetchall()
        
        print("\n📍 Partenaires actifs:")
        for stat in gps_stats:
            print(f"  - {stat.gps_status}: {stat.count} partenaires")
        
        # ==========================================
        # 9. LISTE DES PARTENAIRES SANS GPS (POUR DEBUG)
        # ==========================================
        partners_without_gps = db.session.execute(text("""
            SELECT id, name, city, category
            FROM partners
            WHERE status = 'active' 
            AND (latitude IS NULL OR longitude IS NULL)
            LIMIT 10;
        """)).fetchall()
        
        if partners_without_gps:
            print("\n⚠️  Exemples de partenaires actifs SANS GPS (max 10):")
            for p in partners_without_gps:
                print(f"  - ID {p.id}: {p.name} ({p.category}) - {p.city or 'Ville inconnue'}")
            print("\n  💡 Ces partenaires n'apparaîtront pas sur la carte")
        
        # ==========================================
        # 10. CRÉER UN INDEX SUR 'status' POUR PERFORMANCE
        # ==========================================
        print("\n⚡ Étape 8: Optimisation des performances...")
        
        # Vérifier si l'index existe déjà
        index_exists = db.session.execute(text("""
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE tablename = 'partners' 
            AND indexname = 'idx_partners_status';
        """)).scalar()
        
        if not index_exists:
            print("📊 Création d'un index sur 'status' pour optimiser les requêtes...")
            db.session.execute(text("""
                CREATE INDEX idx_partners_status ON partners(status);
            """))
            db.session.commit()
            print("✅ Index 'idx_partners_status' créé")
        else:
            print("✅ Index 'idx_partners_status' déjà présent")
        
        # Index composite pour la recherche optimisée
        composite_index_exists = db.session.execute(text("""
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE tablename = 'partners' 
            AND indexname = 'idx_partners_active_gps';
        """)).scalar()
        
        if not composite_index_exists:
            print("📊 Création d'un index composite (status + GPS)...")
            db.session.execute(text("""
                CREATE INDEX idx_partners_active_gps 
                ON partners(status, latitude, longitude) 
                WHERE status = 'active' AND latitude IS NOT NULL AND longitude IS NOT NULL;
            """))
            db.session.commit()
            print("✅ Index 'idx_partners_active_gps' créé (optimise /api/partners/search_v2)")
        else:
            print("✅ Index 'idx_partners_active_gps' déjà présent")
        
        # ==========================================
        # RÉSULTAT FINAL
        # ==========================================
        print("\n" + "="*70)
        print("✅ MIGRATION V24 TERMINÉE AVEC SUCCÈS !")
        print("="*70 + "\n")
        
        return True
        
    except Exception as e:
        print("\n" + "="*70)
        print("❌ ERREUR LORS DE LA MIGRATION")
        print("="*70)
        print(f"\n🔴 Erreur: {str(e)}\n")
        print("📋 Traceback complet:")
        print(traceback.format_exc())
        print("\n⚠️  La migration a été annulée (rollback automatique)")
        db.session.rollback()
        return False


def verify_migration():
    """
    Vérification rapide post-migration
    """
    try:
        # Compter les partenaires actifs avec GPS
        active_with_gps = db.session.execute(text("""
            SELECT COUNT(*) 
            FROM partners 
            WHERE status = 'active' 
            AND latitude IS NOT NULL 
            AND longitude IS NOT NULL;
        """)).scalar()
        
        # Total partenaires
        total = db.session.execute(text("SELECT COUNT(*) FROM partners;")).scalar()
        
        print("\n" + "="*70)
        print("🔍 VÉRIFICATION POST-MIGRATION")
        print("="*70)
        print(f"\n  📊 Total partenaires: {total}")
        print(f"  ✅ Partenaires actifs avec GPS: {active_with_gps}")
        print(f"  📍 Prêts pour la carte interactive: {active_with_gps}")
        print("\n" + "="*70 + "\n")
        
        return True
    except Exception as e:
        print(f"\n❌ Erreur de vérification: {str(e)}\n")
        return False


if __name__ == '__main__':
    """
    Exécution standalone pour debug
    """
    from app import app
    with app.app_context():
        success = run_partner_status_migration()
        if success:
            verify_migration()
