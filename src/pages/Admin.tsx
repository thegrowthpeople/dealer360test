import { useState, useEffect } from 'react';
import { SimpleLayout } from '@/components/SimpleLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Edit, Loader2 } from 'lucide-react';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  role: z.enum(['admin', 'manager', 'user']),
  bdm_id: z.number().positive().nullable(),
}).refine(data => {
  if (data.role === 'user') return data.bdm_id !== null;
  return true;
}, { message: 'BDM is required for users', path: ['bdm_id'] });

interface User {
  id: string;
  email: string;
  created_at: string;
  role?: string;
  bdm_id?: number;
  bdm_name?: string;
}

interface BDM {
  'BDM ID': number;
  'Full Name': string | null;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [bdms, setBdms] = useState<BDM[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

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

  const fetchBDMs = async () => {
    try {
      const { data, error } = await supabase
        .from('BDM')
        .select('"BDM ID", "Full Name"')
        .eq('Active', 1)
        .order('Full Name');

      if (error) throw error;
      setBdms(data || []);
    } catch (error) {
      console.error('Error fetching BDMs:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users with their roles and BDM info
      const { data: usersData, error: usersError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          bdm_id
        `);

      if (usersError) throw usersError;

      // Get auth users
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) throw authError;

      // Merge data
      const mergedUsers = authUsers.map(authUser => {
        const roleData = usersData?.find(r => r.user_id === authUser.id);
        return {
          id: authUser.id,
          email: authUser.email || '',
          created_at: authUser.created_at,
          role: roleData?.role,
          bdm_id: roleData?.bdm_id,
        };
      });

      // Fetch BDM names for users
      const usersWithBdmNames = await Promise.all(
        mergedUsers.map(async (user) => {
          if (user.bdm_id) {
            const { data: bdmData } = await supabase
              .from('BDM')
              .select('"Full Name"')
              .eq('"BDM ID"', user.bdm_id)
              .single();
            
            return {
              ...user,
              bdm_name: bdmData?.['Full Name'] || undefined,
            };
          }
          return user;
        })
      );

      setUsers(usersWithBdmNames);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validate form data
      const validatedData = createUserSchema.parse(formData);
      
      setSubmitting(true);

      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: validatedData,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User created successfully',
      });

      setCreateDialogOpen(false);
      setFormData({
        email: '',
        password: '',
        role: 'user',
        bdm_id: null,
      });
      
      fetchUsers();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('Error creating user:', error);
        toast({
          title: 'Error',
          description: 'Failed to create user',
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. They will receive login credentials.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'admin' | 'manager' | 'user') => {
                      setFormData({ 
                        ...formData, 
                        role: value,
                        bdm_id: value === 'admin' ? null : formData.bdm_id
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role !== 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="bdm">
                      BDM {formData.role === 'user' && <span className="text-destructive">*</span>}
                    </Label>
                    <Select
                      value={formData.bdm_id?.toString() || ''}
                      onValueChange={(value) => {
                        setFormData({ 
                          ...formData, 
                          bdm_id: value ? parseInt(value) : null 
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select BDM" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.role === 'manager' && (
                          <SelectItem value="">None</SelectItem>
                        )}
                        {bdms.map((bdm) => (
                          <SelectItem key={bdm['BDM ID']} value={bdm['BDM ID'].toString()}>
                            {bdm['Full Name']} (ID: {bdm['BDM ID']})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading users...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>BDM</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No Role</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.bdm_name || '-'}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </SimpleLayout>
  );
}
