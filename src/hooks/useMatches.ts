import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Match } from "@/types";

const KEY = ["matches"];

export function useMatches() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Match[]> => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: false })
        .order("match_time", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Match[];
    },
  });
}

export type MatchInput = Omit<Match, "id" | "created_at">;

export function useUpsertMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<MatchInput> & { id?: string }) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await supabase.from("matches").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("matches").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("matches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
