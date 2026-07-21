import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MatchRegistration, RegistrationStatus } from "@/types";

const key = (matchId: string) => ["registrations", matchId];

export function useRegistrations(matchId: string | null) {
  return useQuery({
    queryKey: key(matchId ?? "none"),
    enabled: !!matchId,
    queryFn: async (): Promise<MatchRegistration[]> => {
      const { data, error } = await supabase
        .from("ft_match_registrations")
        .select("*")
        .eq("match_id", matchId);
      if (error) throw error;
      return (data ?? []) as MatchRegistration[];
    },
  });
}

export function useSetRegistration(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { playerId: string; status: RegistrationStatus }) => {
      const { error } = await supabase
        .from("ft_match_registrations")
        .upsert(
          { match_id: matchId, player_id: params.playerId, status: params.status },
          { onConflict: "match_id,player_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(matchId) }),
  });
}

export function useClearRegistration(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase
        .from("ft_match_registrations")
        .delete()
        .eq("match_id", matchId)
        .eq("player_id", playerId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(matchId) }),
  });
}
