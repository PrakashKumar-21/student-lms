import { useEffect, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createBoard,
  getBoards,
  deleteBoard,
  updateBoardStatus,
  type Board,
} from "@/services/boardApi";

const Boards = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardName, setBoardName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBoards = async () => {
    try {
      const data = await getBoards({ includeInactive: true });
      setBoards(data);
    } catch (error) {
      console.error("Failed to load boards", error);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const handleCreateBoard = async () => {
    const name = boardName.trim();
    if (!name) {
      alert("Board name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await createBoard(name);
      setBoardName("");
      await loadBoards();
      alert("Board created successfully");
    } catch (error) {
      console.error("Failed to create board", error);
      alert("Failed to create board");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (board: Board) => {
    const nextStatus = board.status === "active" ? "inactive" : "active";
    try {
      await updateBoardStatus(board.id, nextStatus);
      await loadBoards();
    } catch (error) {
      console.error("Failed to update board status", error);
      alert("Failed to update board status");
    }
  };

  const handleDeleteBoard = async (board: Board) => {
    const confirmed = window.confirm(
      `Delete board "${board.name}"? This will remove related classes and subjects.`
    );
    if (!confirmed) {
      return;
    }
    try {
      await deleteBoard(board.id);
      await loadBoards();
    } catch (error) {
      console.error("Failed to delete board", error);
      alert("Failed to delete board");
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Boards
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage boards for your courses.
            </p>
          </div>
        </div>

        <div className="card-elevated p-6 mb-8">
          <div className="max-w-lg space-y-3">
            <Label htmlFor="boardName">Board Name</Label>
            <Input
              id="boardName"
              value={boardName}
              onChange={(event) => setBoardName(event.target.value)}
              placeholder="e.g., CBSE"
            />
            <Button onClick={handleCreateBoard} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Board"}
            </Button>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Existing Boards
          </h2>
          {boards.length ? (
            <div className="space-y-3">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {board.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {board.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleToggleStatus(board)}
                    >
                      {board.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDeleteBoard(board)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No boards created yet.
            </p>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Boards;
