import { useState } from "react";
import { Plus, Edit2, Trash2, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useFrameworks } from "@/hooks/useFrameworks";
import { useFrameworkManagement } from "@/hooks/useFrameworkManagement";
import { QualificationFramework, FrameworkCategory } from "@/types/qualificationScorecard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const FrameworkManagement = () => {
  const { frameworks, isLoading } = useFrameworks(true); // Include inactive frameworks
  const { createFramework, updateFramework, deleteFramework, isCreating, isUpdating, isDeleting } = useFrameworkManagement();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFramework, setEditingFramework] = useState<QualificationFramework | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    active: true,
    display_order: 0,
    categories: [] as FrameworkCategory[],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      active: true,
      display_order: 0,
      categories: [],
    });
    setEditingFramework(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (framework: QualificationFramework) => {
    setEditingFramework(framework);
    setFormData({
      name: framework.name,
      description: framework.description,
      active: framework.active,
      display_order: framework.display_order,
      categories: framework.structure.categories,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return;
    }

    try {
      if (editingFramework) {
        await updateFramework({
          id: editingFramework.id,
          name: formData.name,
          description: formData.description,
          active: formData.active,
          display_order: formData.display_order,
          structure: { categories: formData.categories },
        });
      } else {
        await createFramework({
          name: formData.name,
          description: formData.description,
          structure: { categories: formData.categories },
          display_order: formData.display_order,
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving framework:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFramework(id);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting framework:', error);
    }
  };

  const addCategory = () => {
    setFormData({
      ...formData,
      categories: [
        ...formData.categories,
        {
          name: "",
          displayName: "",
          color: "bg-blue-500",
          questions: [""],
        },
      ],
    });
  };

  const removeCategory = (index: number) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index),
    });
  };

  const updateCategory = (index: number, field: keyof FrameworkCategory, value: any) => {
    const updated = [...formData.categories];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, categories: updated });
  };

  const addQuestion = (categoryIndex: number) => {
    const updated = [...formData.categories];
    updated[categoryIndex].questions.push("");
    setFormData({ ...formData, categories: updated });
  };

  const removeQuestion = (categoryIndex: number, questionIndex: number) => {
    const updated = [...formData.categories];
    updated[categoryIndex].questions = updated[categoryIndex].questions.filter((_, i) => i !== questionIndex);
    setFormData({ ...formData, categories: updated });
  };

  const updateQuestion = (categoryIndex: number, questionIndex: number, value: string) => {
    const updated = [...formData.categories];
    updated[categoryIndex].questions[questionIndex] = value;
    setFormData({ ...formData, categories: updated });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading frameworks...</div>;
  }

  return (
    <div className="min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-4">
            Framework Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage qualification frameworks like FAINT, MEDDPICC, BANT, and more
          </p>
        </div>
        <Button size="lg" onClick={openCreateDialog} className="gap-2">
          <Plus className="w-5 h-5" />
          New Framework
        </Button>
      </div>

      <Separator className="my-6" />

      {/* Frameworks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {frameworks.map((framework) => (
          <Card key={framework.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {framework.name}
                    {!framework.active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{framework.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {framework.structure.categories.map((cat, idx) => (
                      <Badge key={idx} variant="outline" className={cat.color}>
                        {cat.displayName}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(framework)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirmId(framework.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFramework ? "Edit Framework" : "Create New Framework"}
            </DialogTitle>
            <DialogDescription>
              Define the framework structure with categories and questions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Framework Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., MEDDPICC"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this qualification framework..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Active</Label>
            </div>

            <Separator />

            {/* Categories */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Categories</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </div>

              {formData.categories.map((category, catIdx) => (
                <Card key={catIdx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <CardTitle className="text-base">Category {catIdx + 1}</CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCategory(catIdx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Internal Name (lowercase)</Label>
                        <Input
                          placeholder="e.g., funds"
                          value={category.name}
                          onChange={(e) => updateCategory(catIdx, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Display Name</Label>
                        <Input
                          placeholder="e.g., Funds"
                          value={category.displayName}
                          onChange={(e) => updateCategory(catIdx, 'displayName', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Color Class</Label>
                      <Input
                        placeholder="e.g., bg-blue-500"
                        value={category.color}
                        onChange={(e) => updateCategory(catIdx, 'color', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Questions</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addQuestion(catIdx)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Question
                        </Button>
                      </div>
                      {category.questions.map((question, qIdx) => (
                        <div key={qIdx} className="flex gap-2">
                          <Input
                            placeholder={`Question ${qIdx + 1}`}
                            value={question}
                            onChange={(e) => updateQuestion(catIdx, qIdx, e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(catIdx, qIdx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
              {editingFramework ? "Update Framework" : "Create Framework"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Framework?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the framework and may affect existing scorecards using it.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FrameworkManagement;
