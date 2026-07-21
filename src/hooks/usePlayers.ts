import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Player } from "@/types";

const KEY = ["players"];

export function usePlayers() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Player[]> => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("jersey_number", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Player[];
    },
  });
}

export type PlayerInput = Omit<Player, "id" | "created_at">;

export function useUpsertPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlayerInput & { id?: string }) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await supabase.from("players").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("players").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
