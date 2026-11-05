import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="arena-glass rounded-3xl p-8 text-center max-w-md mx-auto my-16">
        <AlertTriangle className="w-10 h-10 mx-auto text-warning mb-3" aria-hidden />
        <h2 className="font-display text-2xl mb-2">یک خطا رخ داد</h2>
        <p className="text-muted-foreground text-sm mb-5">این بخش درست بارگذاری نشد. دوباره امتحان کن.</p>
        <Button onClick={() => this.setState({ error: null })}>تلاش دوباره</Button>
      </div>
    );
  }
}
