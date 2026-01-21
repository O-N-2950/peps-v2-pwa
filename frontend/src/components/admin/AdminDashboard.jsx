import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Store, AlertTriangle, TrendingUp, MessageSquare, Gift } from 'lucide-react';
import axios from 'axios';

/**
 * Dashboard Admin V20
 * Vue d'ensemble : statistiques, alertes, feedbacks récents
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Charger les statistiques
      const statsRes = await axios.get('/api/admin/stats', { headers });
      setStats(statsRes.data);
      
      // Charger les alertes (feedbacks négatifs récents)
      const feedbacksRes = await axios.get('/api/admin/feedbacks?status=pending&limit=5', { headers });
      setAlerts(feedbacksRes.data.feedbacks || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D9A9A]"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Dashboard Admin V20</h1>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-8 h-8" />}
            title="Membres Actifs"
            value={stats?.members || 0}
            color="blue"
          />
          <StatCard
            icon={<Store className="w-8 h-8" />}
            title="Partenaires"
            value={stats?.partners || 0}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="MRR CHF"
            value={`${stats?.mrr_chf || 0} CHF`}
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="MRR EUR"
            value={`${stats?.mrr_eur || 0} €`}
            color="orange"
          />
        </div>

        {/* Alertes et feedbacks récents */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">Alertes Récentes</h2>
            </div>
            <div className="space-y-4">
              {alerts.map((feedback) => (
                <AlertItem key={feedback.id} feedback={feedback} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickAction
            icon={<Store className="w-6 h-6" />}
            title="Gérer les Commerçants"
            description="Éditer, valider, avertir"
            href="/admin/partners"
            color="green"
          />
          <QuickAction
            icon={<MessageSquare className="w-6 h-6" />}
            title="Notifications"
            description="Envoyer des messages ciblés"
            href="/admin/notifications"
            color="blue"
          />
          <QuickAction
            icon={<Gift className="w-6 h-6" />}
            title="Parrainages"
            description="Valider les récompenses"
            href="/admin/referrals"
            color="purple"
          />
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className={`${colors[color]} text-white p-3 rounded-lg inline-block mb-4`}>
        {icon}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </motion.div>
  );
}

function AlertItem({ feedback }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
      <AlertTriangle className="w-5 h-5 text-red-500 mt-1" />
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{feedback.partner_name}</p>
        <p className="text-sm text-gray-600">{feedback.comment}</p>
        <p className="text-xs text-gray-500 mt-1">
          Par {feedback.member_name} • {new Date(feedback.created_at).toLocaleDateString()}
        </p>
      </div>
      <a
        href={`/admin/feedbacks/${feedback.id}`}
        className="text-sm text-red-600 hover:text-red-700 font-medium"
      >
        Voir →
      </a>
    </div>
  );
}

function QuickAction({ icon, title, description, href, color }) {
  const colors = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
  };

  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-lg p-6 block"
    >
      <div className={`${colors[color]} text-white p-3 rounded-lg inline-block mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </motion.a>
  );
}
