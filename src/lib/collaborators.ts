/**
 * The people on a project: the owner and their collaborators, each with a
 * role and an optional organisation label (see supabase/migrations/0004).
 *
 * The database decides who may do what. These functions just ask, and turn
 * its refusals into sentences.
 */
import type { ProjectRole } from "@/lib/product-board/storage";
import { getSupabaseClient } from "@/lib/product-board/storage";

export type Collaborator = {
  userId: string;
  email: string;
  name: string | null;
  role: ProjectRole;
  organisation: string | null;
};

export type CollaboratorRole = Exclude<ProjectRole, "owner">;

const ROLE_ORDER: Record<ProjectRole, number> = { owner: 0, editor: 1, viewer: 2 };

type MemberRow = {
  user_id: string;
  role: ProjectRole;
  organisation: string | null;
  profiles: { email: string; full_name: string | null } | null;
};

function client() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Sign-in isn't set up, so projects can't be shared.");
  return supabase;
}

/** Plain-language versions of what the database says when it refuses. */
function explain(error: { code?: string; message: string }): Error {
  if (error.code === "42501") return new Error("Only the project owner can do that.");
  return new Error(error.message);
}

/** Everyone on the project, owner first, then by name. */
export async function listCollaborators(boardId: string): Promise<Collaborator[]> {
  const { data, error } = await client()
    .from("project_members")
    .select("user_id, role, organisation, profiles(email, full_name)")
    .eq("board_id", boardId);
  if (error) throw explain(error);

  return ((data ?? []) as unknown as MemberRow[])
    .map((row) => ({
      userId: row.user_id,
      email: row.profiles?.email ?? "",
      name: row.profiles?.full_name ?? null,
      role: row.role,
      organisation: row.organisation,
    }))
    .sort(
      (a, b) =>
        ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || (a.name ?? a.email).localeCompare(b.name ?? b.email)
    );
}

/** Adds someone who has already signed up, by their email. Re-adding updates their role and organisation. */
export async function addCollaborator(
  boardId: string,
  input: { email: string; role: CollaboratorRole; organisation: string }
): Promise<void> {
  const { error } = await client().rpc("add_collaborator", {
    p_board_id: boardId,
    p_email: input.email.trim(),
    p_role: input.role,
    p_organisation: input.organisation.trim() || null,
  });
  if (error) throw explain(error);
}

export async function updateCollaborator(
  boardId: string,
  userId: string,
  changes: { role?: CollaboratorRole; organisation?: string | null }
): Promise<void> {
  const patch: Record<string, string | null> = {};
  if (changes.role) patch.role = changes.role;
  if (changes.organisation !== undefined) patch.organisation = changes.organisation?.trim() || null;

  const { data, error } = await client()
    .from("project_members")
    .update(patch)
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .select("user_id");
  if (error) throw explain(error);
  if (!data?.length) throw new Error("Only the project owner can do that.");
}

/** Removes a collaborator; or, with your own id, leaves the project. */
export async function removeCollaborator(boardId: string, userId: string): Promise<void> {
  const { data, error } = await client()
    .from("project_members")
    .delete()
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .select("user_id");
  if (error) throw explain(error);
  if (!data?.length) throw new Error("Only the project owner can do that.");
}
