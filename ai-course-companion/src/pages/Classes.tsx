import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createClass,
  getClasses,
  deleteClass,
  updateClassStatus,
  type ClassLevel,
} from "@/services/classApi";
import { getBoards, type Board } from "@/services/boardApi";

const Classes = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [className, setClassName] = useState("");
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBoard = useMemo(
    () => boards.find((item) => item.id === selectedBoardId),
    [boards, selectedBoardId]
  );

  const loadBoards = async () => {
    try {
      const data = await getBoards({ includeInactive: true });
      setBoards(data);
      if (!selectedBoardId && data.length > 0) {
        setSelectedBoardId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to load boards", error);
    }
  };

  const loadClasses = async (board: Board | undefined) => {
    if (!board) {
      setClasses([]);
      return;
    }
    try {
      const data = await getClasses({
        board: board.name,
        boardId: board.id,
        includeInactive: true,
      });
      setClasses(data);
    } catch (error) {
      console.error("Failed to load classes", error);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    loadClasses(selectedBoard);
  }, [selectedBoard]);

  const handleCreateClass = async () => {
    const name = className.trim();
    if (!name) {
      alert("Class name is required");
      return;
    }
    if (!selectedBoardId) {
      alert("Select a board first");
      return;
    }
    setIsSubmitting(true);
    try {
      await createClass({ name, board_id: selectedBoardId });
      setClassName("");
      await loadClasses(selectedBoard);
      alert("Class created successfully");
    } catch (error) {
      console.error("Failed to create class", error);
      alert("Failed to create class");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: ClassLevel) => {
    const nextStatus = item.status === "active" ? "inactive" : "active";
    try {
      await updateClassStatus(item.id, nextStatus);
      await loadClasses(selectedBoard);
    } catch (error) {
      console.error("Failed to update class status", error);
      alert("Failed to update class status");
    }
  };

  const handleDeleteClass = async (item: ClassLevel) => {
    const confirmed = window.confirm(
      `Delete class "${item.name}"? This will remove related subjects.`
    );
    if (!confirmed) {
      return;
    }
    try {
      await deleteClass(item.id);
      await loadClasses(selectedBoard);
    } catch (error) {
      console.error("Failed to delete class", error);
      alert("Failed to delete class");
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Classes</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage classes for each board.
            </p>
          </div>
        </div>

        <div className="card-elevated p-6 mb-8">
          <div className="max-w-lg space-y-3">
            <Label htmlFor="boardSelect">Board</Label>
            <select
              id="boardSelect"
              value={selectedBoardId}
              onChange={(event) => setSelectedBoardId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="">Select board</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>

            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="e.g., 12"
            />
            <Button onClick={handleCreateClass} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Class"}
            </Button>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Existing Classes
          </h2>
          {classes.length ? (
            <div className="space-y-3">
              {classes.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {item.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleToggleStatus(item)}
                    >
                      {item.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDeleteClass(item)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No classes found for this board.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Classes;
