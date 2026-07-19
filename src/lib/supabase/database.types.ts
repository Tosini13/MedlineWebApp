/**
 * Database types for MedlineWebApp.
 *
 * These are kept in sync with `supabase/migrations/*`. After running migrations
 * against a linked project you can regenerate them with:
 *
 *   pnpm db:types
 *
 * (which runs `supabase gen types typescript --local`).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EventTypeCode = "MA" | "O" | "MT" | "S" | "other";

export interface Database {
  public: {
    Tables: {
      lines: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          line_id: string;
          title: string;
          event_date: string;
          description: string | null;
          type: EventTypeCode;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          line_id: string;
          title: string;
          event_date: string;
          description?: string | null;
          type?: EventTypeCode;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          line_id?: string;
          title?: string;
          event_date?: string;
          description?: string | null;
          type?: EventTypeCode;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_line_id_fkey";
            columns: ["line_id"];
            referencedRelation: "lines";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          storage_path: string;
          mime_type: string | null;
          size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          storage_path: string;
          mime_type?: string | null;
          size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          storage_path?: string;
          mime_type?: string | null;
          size?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          user_id: string;
          date_of_birth: string | null;
          blood_type: string | null;
          emergency_contact: string | null;
          medicaments: string | null;
          chronic_health_issues: string | null;
          lock_screen_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          date_of_birth?: string | null;
          blood_type?: string | null;
          emergency_contact?: string | null;
          medicaments?: string | null;
          chronic_health_issues?: string | null;
          lock_screen_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          date_of_birth?: string | null;
          blood_type?: string | null;
          emergency_contact?: string | null;
          medicaments?: string | null;
          chronic_health_issues?: string | null;
          lock_screen_summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: "INSERT" | "UPDATE" | "DELETE";
          entity: "line" | "event" | "document";
          entity_id: string | null;
          at: string;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          action: "INSERT" | "UPDATE" | "DELETE";
          entity: "line" | "event" | "document";
          entity_id?: string | null;
          at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      event_type: EventTypeCode;
    };
    CompositeTypes: Record<never, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
