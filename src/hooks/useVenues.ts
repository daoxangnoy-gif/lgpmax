import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Venue } from "@/types";

const KEY = ["venues"];

export function useVenues() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Venue[]> => {
      const { data, error } = await supabase
        .from("ft_venues")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Venue[];
    },
  });
}

/** สร้าง venue ถ้ายังไม่มีชื่อนี้ แล้วคืน venue (ใช้ตอนพิมพ์ชื่อสนามใหม่) */
export function useEnsureVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<Venue | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const { data: existing } = await supabase
        .from("ft_venues")
        .select("*")
        .ilike("name", trimmed)
        .limit(1)
        .maybeSingle();
      if (existing) return existing as Venue;
      const { data, error } = await supabase
        .from("ft_venues")
        .insert({ name: trimmed })
        .select("*")
        .single();
      if (error) throw error;
      return data as Venue;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
