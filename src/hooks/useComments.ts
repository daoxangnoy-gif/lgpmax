import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/identity";
import type { Comment } from "@/types";

const key = (matchId: string) => ["comments", matchId];

export function useComments(matchId: string) {
  return useQuery({
    queryKey: key(matchId),
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("ft_comments")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
  });
}

export function useAddComment(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { body: string; author_name: string; parent_id?: string | null }) => {
      const { error } = await supabase.from("ft_comments").insert({
        match_id: matchId,
        parent_id: params.parent_id ?? null,
        device_id: getDeviceId(),
        author_name: params.author_name || "ผู้เล่น",
        body: params.body,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(matchId) }),
  });
}

export function useDeleteComment(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ft_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(matchId) }),
  });
}
