export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string | null;
          video_url: string;
          thumbnail_url: string | null;
          user_id: string;
          status: "draft" | "published";
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description?: string | null;
          video_url: string;
          thumbnail_url?: string | null;
          user_id: string;
          status?: "draft" | "published";
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string | null;
          video_url?: string;
          thumbnail_url?: string | null;
          user_id?: string;
          status?: "draft" | "published";
          metadata?: Json | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
