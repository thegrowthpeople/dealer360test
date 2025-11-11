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
  const { signIn, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <Card className="w-full max-w-3xl relative z-10 backdrop-blur-sm bg-card/95 -translate-y-[25vh]">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left Column - Logo and Title */}
          <div className="flex flex-col items-center justify-center p-8 border-r border-border mt-2">
            <a href="https://www.daimlertruck.com.au" target="_blank" rel="noopener noreferrer" className="mb-12">
              <img src={logoBlack} alt="Daimler Truck" className="h-12 dark:invert hover:opacity-80 transition-opacity cursor-pointer" />
            </a>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Dealer 360</h1>
              <p className="text-lg text-foreground mt-1">Dealer Management</p>
            </div>
          </div>

          {/* Right Column - Form */}
          <CardContent className="p-8 animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@daimlertruck.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
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
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </div>
      </Card>
      <div className="relative z-10 mt-2 max-w-3xl w-full">
        <a 
          href="https://www.thegrowthpeople.com.au" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors block text-right"
        >
          created by The Growth People
        </a>
      </div>
    </div>
  );
};

export default Login;
