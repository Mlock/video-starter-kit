import { supabase } from "./supabase";
import type { Database } from "@/types/supabase";

type Video = Database["public"]["Tables"]["videos"]["Row"];
type NewVideo = Database["public"]["Tables"]["videos"]["Insert"];

export async function createVideo(video: NewVideo) {
  const { data, error } = await supabase
    .from("videos")
    .insert(video)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVideo(id: string) {
  const { data, error } = await supabase
    .from("videos")
    .select()
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateVideo(id: string, updates: Partial<Video>) {
  const { data, error } = await supabase
    .from("videos")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVideo(id: string) {
  const { error } = await supabase.from("videos").delete().eq("id", id);

  if (error) throw error;
}

export async function listVideos(userId: string) {
  const { data, error } = await supabase
    .from("videos")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
