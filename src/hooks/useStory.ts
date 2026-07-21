import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { deleteImageByUrl } from "@/lib/storage";
import type { StoryPhoto } from "@/types";

const key = (matchId: string) => ["story", matchId];

export function useStoryPhotos(matchId: string | null) {
  return useQuery({
    queryKey: key(matchId ?? "none"),
    enabled: !!matchId,
    queryFn: async (): Promise<StoryPhoto[]> => {
      const { data, error } = await supabase
        .from("story_photos")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StoryPhoto[];
    },
  });
}

export function useAddStoryPhoto(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { photo_url: string; caption?: string }) => {
      const { error } = await supabase.from("story_photos").insert({
        match_id: matchId,
        photo_url: params.photo_url,
        caption: params.caption ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(matchId) }),
  });
}

export function useDeleteStoryPhoto(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: StoryPhoto) => {
      const { error } = await supabase.from("story_photos").delete().eq("id", photo.id);
      if (error) throw error;
      await deleteImageByUrl(photo.photo_url);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(matchId) }),
  });
}
