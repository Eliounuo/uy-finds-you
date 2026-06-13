import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type RequestRow = Database["public"]["Tables"]["requests"]["Row"];
export type Offer = Database["public"]["Tables"]["offers"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Chat = Database["public"]["Tables"]["chats"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// ---------- Properties ----------
export type PropertyFilters = {
  city?: string;
  search?: string;
};

export const propertiesQuery = (filters: PropertyFilters = {}) =>
  queryOptions({
    queryKey: ["properties", filters],
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (filters.city && filters.city !== "Все") q = q.eq("city", filters.city);
      if (filters.search) q = q.ilike("title", `%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });

export const propertyQuery = (id: string) =>
  queryOptions({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Property | null;
    },
  });

export const myPropertiesQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["my-properties", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });

// ---------- Requests ----------
export const myRequestsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["my-requests", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("requests")
        .select("*, offers(*, properties(*))")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (RequestRow & {
        offers: (Offer & { properties: Property | null })[];
      })[];
    },
  });

export const openRequestsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["open-requests", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("status", "open")
        .neq("client_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RequestRow[];
    },
  });

// ---------- Bookings ----------
export const myBookingsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["my-bookings", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*, properties(*)")
        .eq("client_id", userId)
        .order("check_in", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (Booking & { properties: Property | null })[];
    },
  });

export const ownerBookingsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["owner-bookings", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*, properties(*)")
        .eq("owner_id", userId)
        .order("check_in", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (Booking & { properties: Property | null })[];
    },
  });

// ---------- Chats / Messages ----------
export const myChatsQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["my-chats", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("chats")
        .select("*, properties(*), client:profiles!chats_client_id_fkey(full_name, avatar_url), owner:profiles!chats_owner_id_fkey(full_name, avatar_url)")
        .or(`client_id.eq.${userId},owner_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (Chat & {
        properties: Property | null;
        client: { full_name: string | null; avatar_url: string | null } | null;
        owner: { full_name: string | null; avatar_url: string | null } | null;
      })[];
    },
  });

export const chatMessagesQuery = (chatId: string) =>
  queryOptions({
    queryKey: ["chat-messages", chatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

export const chatHeaderQuery = (chatId: string) =>
  queryOptions({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chats")
        .select("*, properties(*), client:profiles!chats_client_id_fkey(full_name, avatar_url), owner:profiles!chats_owner_id_fkey(full_name, avatar_url)")
        .eq("id", chatId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

// ---------- Favorites ----------
export const favoritesQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("property_id, properties(*)")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []) as { property_id: string; properties: Property | null }[];
    },
  });

// ---------- Profile ----------
export const profileQuery = (userId: string | null) =>
  queryOptions({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
