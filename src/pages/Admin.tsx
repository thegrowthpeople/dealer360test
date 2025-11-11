import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Trash2, UserPlus } from 'lucide-react';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  role: z.enum(['admin', 'manager', 'user']),
  bdm_id: z.number().positive().nullable(),
}).refine(data => {
  if (data.role === 'user') return data.bdm_id !== null;
  return true;
}, { message: "BDM is required for users with 'user' role", path: ['bdm_id'] });

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: string;
  bdm_id: number | null;
  bdm_name: string | null;
}

interface BDM {
  'BDM ID': number;
  'Full Name': string;
}

const Admin = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [bdms, setBdms] = useState<BDM[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user' as 'admin' | 'manager' | 'user',
    bdm_id: null as number | null,
  });

  useEffect(() => {
    fetchUsers();
    fetchBDMs();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, bdm_id');

      if (rolesError) throw rolesError;

      const { data: bdmsData, error: bdmsError } = await supabase
        .from('BDM')
        .select('"BDM ID", "Full Name"')
        .eq('Active', 1);

      if (bdmsError) throw bdmsError;

      const usersWithRoles: UserWithRole[] = usersData.users.map(user => {
        const userRole = rolesData?.find(r => r.user_id === user.id);
        const bdm = bdmsData?.find(b => b['BDM ID'] === userRole?.bdm_id);
        
        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          role: userRole?.role || 'user',
          bdm_id: userRole?.bdm_id || null,
          bdm_name: bdm?.['Full Name'] || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBDMs = async () => {
    try {
      const { data, error } = await supabase
        .from('BDM')
        .select('"BDM ID", "Full Name"')
        .eq('Active', 1)
        .order('"Full Name"');

      if (error) throw error;
      setBdms(data || []);
    } catch (error) {
      console.error('Error fetching BDMs:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = createUserSchema.parse(formData);

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: validatedData,
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('User created successfully');
      setOpen(false);
      setFormData({ email: '', password: '', role: 'user', bdm_id: null });
      fetchUsers();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Failed to create user');
      }
      console.error('Error creating user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) throw error;

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  const showBdmField = formData.role !== 'admin';
  const bdmRequired = formData.role === 'user';

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-6 xl:p-12 2xl:p-16 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'manager' | 'user') => 
                    setFormData({ ...formData, role: value, bdm_id: value === 'admin' ? null : formData.bdm_id })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showBdmField && (
                <div className="space-y-2">
                  <Label htmlFor="bdm">BDM {bdmRequired && <span className="text-destructive">*</span>}</Label>
                  <Select
                    value={formData.bdm_id?.toString() || ''}
                    onValueChange={(value) => setFormData({ ...formData, bdm_id: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select BDM" />
                    </SelectTrigger>
                    <SelectContent>
                      {!bdmRequired && <SelectItem value="">None</SelectItem>}
                      {bdms.map(bdm => (
                        <SelectItem key={bdm['BDM ID']} value={bdm['BDM ID'].toString()}>
                          {bdm['Full Name']} (ID: {bdm['BDM ID']})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full">Create User</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>BDM</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.bdm_name || '-'}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
