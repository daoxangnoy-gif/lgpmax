import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/identity";
import type { Reaction, ReactionType } from "@/types";

const key = (matchId: string) => ["reactions", matchId];

export function useReactions(matchId: string) {
  return useQuery({
    queryKey: key(matchId),
    queryFn: async (): Promise<Reaction[]> => {
      const { data, error } = await supabase
        .from("ft_reactions")
        .select("*")
        .eq("match_id", matchId);
      if (error) throw error;
      return (data ?? []) as Reaction[];
    },
  });
}

export function useSetReaction(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (type: ReactionType) => {
      const { error } = await supabase
        .from("ft_reactions")
        .upsert(
          { match_id: matchId, device_id: getDeviceId(), type },
          { onConflict: "match_id,device_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(matchId) }),
  });
}

export function useClearReaction(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("ft_reactions")
        .delete()
        .eq("match_id", matchId)
        .eq("device_id", getDeviceId());
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(matchId) }),
  });
}
