import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MatchStat } from "@/types";

const key = (matchId: string) => ["match_stats", matchId];

export function useMatchStats(matchId: string | null) {
  return useQuery({
    queryKey: key(matchId ?? "none"),
    enabled: !!matchId,
    queryFn: async (): Promise<MatchStat[]> => {
      const { data, error } = await supabase.from("ft_match_stats").select("*").eq("match_id", matchId);
      if (error) throw error;
      return (data ?? []) as MatchStat[];
    },
  });
}

export function useUpsertMatchStat(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { player_id: string; goals: number; assists: number; yellow: number; red: number }) => {
      const { error } = await supabase
        .from("ft_match_stats")
        .upsert({ match_id: matchId, ...row }, { onConflict: "match_id,player_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(matchId) });
      qc.invalidateQueries({ queryKey: ["season_stats"] });
    },
  });
}

export interface PlayerSeasonStat {
  player_id: string;
  attended: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
}

/** รวมสถิติทั้งซีซั่นต่อผู้เล่น (มาแข่ง + ประตู/assist/ใบเหลือง-แดง) */
export function useSeasonStats() {
  return useQuery({
    queryKey: ["season_stats"],
    queryFn: async (): Promise<Record<string, PlayerSeasonStat>> => {
      const [statsRes, regRes] = await Promise.all([
        supabase.from("ft_match_stats").select("player_id,goals,assists,yellow,red"),
        supabase.from("ft_match_registrations").select("player_id,status").eq("status", "going"),
      ]);
      if (statsRes.error) throw statsRes.error;
      if (regRes.error) throw regRes.error;

      const map: Record<string, PlayerSeasonStat> = {};
      const get = (id: string) =>
        (map[id] ??= { player_id: id, attended: 0, goals: 0, assists: 0, yellow: 0, red: 0 });

      for (const s of statsRes.data ?? []) {
        const m = get(s.player_id);
        m.goals += s.goals;
        m.assists += s.assists;
        m.yellow += s.yellow;
        m.red += s.red;
      }
      for (const r of regRes.data ?? []) get(r.player_id).attended += 1;
      return map;
    },
  });
}
