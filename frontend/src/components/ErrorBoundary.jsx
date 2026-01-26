import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('❌ ERROR BOUNDARY CAUGHT:', error);
        console.error('❌ ERROR INFO:', errorInfo);
        console.error('❌ COMPONENT STACK:', errorInfo.componentStack);
        
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Envoyer l'erreur à l'API backend pour logging
        fetch('/api/log-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: error.toString(),
                errorInfo: errorInfo.componentStack,
                url: window.location.href,
                timestamp: new Date().toISOString()
            })
        }).catch(e => console.error('Failed to log error:', e));
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">⚠️</div>
                            <h1 className="text-3xl font-bold text-red-600 mb-2">
                                Erreur de chargement
                            </h1>
                            <p className="text-gray-600">
                                Une erreur s'est produite lors du chargement du formulaire
                            </p>
                        </div>

                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                            <h2 className="font-bold text-red-800 mb-2">Détails de l'erreur :</h2>
                            <pre className="text-sm text-red-700 overflow-auto">
                                {this.state.error && this.state.error.toString()}
                            </pre>
                        </div>

                        {this.state.errorInfo && (
                            <details className="mb-6">
                                <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                                    Stack trace complet
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-turquoise text-white py-3 px-6 rounded-lg hover:bg-turquoise/90 transition-colors"
                            >
                                Recharger la page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Retour à l'accueil
                            </button>
                        </div>

                        <div className="mt-6 text-center text-sm text-gray-500">
                            <p>Si le problème persiste, contactez le support technique.</p>
                            <p className="mt-1">
                                <a href="mailto:support@peps.swiss" className="text-turquoise hover:underline">
                                    support@peps.swiss
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
