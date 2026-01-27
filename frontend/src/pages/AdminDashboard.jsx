import { useState, useEffect } from 'react';
import { TrendingUp, Users, Store, DollarSign } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    mrrCHF: 0,
    mrrEUR: 0,
    activeMembers: 0,
    partners: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://www.peps.swiss/api/admin/stats_v20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard Admin V20</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="MRR Total (CHF)"
          value={`${stats.mrrCHF} CHF`}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="MRR Total (EUR)"
          value={`${stats.mrrEUR} €`}
          icon={DollarSign}
          color="bg-blue-500"
        />
        <StatCard
          title="Membres Actifs"
          value={stats.activeMembers}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="Partenaires"
          value={stats.partners}
          icon={Store}
          color="bg-teal-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Évolution MRR (6 derniers mois)</h2>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Graphique à venir
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
