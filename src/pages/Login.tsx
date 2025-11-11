import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import loginBackground from '@/assets/login-background.jpg';
import logoBlack from '@/assets/logo-black.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/performance');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-start justify-center pt-12 p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <Card className="w-full max-w-3xl relative z-10 backdrop-blur-md bg-card/98 shadow-2xl border-border/50 animate-fade-in">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left Column - Logo and Title */}
          <div className="flex flex-col items-center justify-center p-8 border-r border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
            <a href="https://www.daimlertruck.com.au" target="_blank" rel="noopener noreferrer" className="mb-12 transition-transform duration-300 hover:scale-105">
              <img src={logoBlack} alt="Daimler Truck" className="h-12 dark:invert" />
            </a>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Dealer 360</h1>
              <p className="text-lg text-foreground mt-1">Dealer Management</p>
            </div>
          </div>

          {/* Right Column - Form */}
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-scale-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="transition-all duration-200 focus:scale-[1.01]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="transition-all duration-200 focus:scale-[1.01]"
                />
              </div>

              <Button type="submit" className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default Login;
