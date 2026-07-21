import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Formation, FormationData } from "@/types";

const KEY = ["formations"];

export function useFormations() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Formation[]> => {
      const { data, error } = await supabase
        .from("ft_formations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Formation[];
    },
  });
}

export function useUpsertFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      match_id: string | null;
      data: FormationData;
    }) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await supabase.from("ft_formations").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ft_formations").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ft_formations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
