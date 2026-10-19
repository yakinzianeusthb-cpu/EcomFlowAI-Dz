import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <div role="alert" className="mx-auto grid min-h-[50vh] max-w-md place-items-center px-4 text-center">
      <div>
        <h2 className="text-lg font-semibold text-fg">{t('errBoundaryTitle', 'Cette page n’a pas pu s’afficher.')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          {t('errBoundaryText', 'Une nouvelle version du site vient peut-être d’être publiée. Recharge la page pour continuer ; ton travail enregistré est conservé.')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => window.location.reload()} className="btn-dz-primary"><RefreshCw size={16} /> {t('errBoundaryReload', 'Recharger la page')}</button>
          <button type="button" onClick={onRetry} className="btn-dz-secondary">{t('errBoundaryRetry', 'Réessayer')}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Catches a screen that fails to load (a code chunk missing after a deploy) or crashes while rendering, so the rest
 * of the app stays usable. `resetKey` clears the error when it changes (for example on navigation).
 */
export default class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen failed to render:', error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (this.state.failed) return <ErrorScreen onRetry={() => this.setState({ failed: false })} />;
    return this.props.children;
  }
}
