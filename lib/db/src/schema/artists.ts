import { pgTable, text, integer, serial, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const socialLinksSchema = z.object({
  website: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  youtube: z.string().optional(),
  spotify: z.string().optional(),
  appleMusic: z.string().optional(),
  soundcloud: z.string().optional(),
  tiktok: z.string().optional(),
  bandcamp: z.string().optional(),
});
export type SocialLinks = z.infer<typeof socialLinksSchema>;

export const albumSchema = z.object({
  title: z.string(),
  year: z.number().int(),
  type: z.enum(["album", "ep", "single", "mixtape"]),
  spotifyUrl: z.string().optional(),
  appleMusicUrl: z.string().optional(),
  youtubeMusicUrl: z.string().optional(),
  tidalUrl: z.string().optional(),
  deezerUrl: z.string().optional(),
  amazonMusicUrl: z.string().optional(),
});
export type Album = z.infer<typeof albumSchema>;

export const musicVideoSchema = z.object({
  title: z.string(),
  url: z.string(),
  year: z.number().int().optional(),
  description: z.string().optional(),
});
export type MusicVideo = z.infer<typeof musicVideoSchema>;

export const pressQuoteSchema = z.object({
  quote: z.string(),
  source: z.string(),
  year: z.number().int().optional(),
});
export type PressQuote = z.infer<typeof pressQuoteSchema>;

export const artistsTable = pgTable("artists", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  shortBio: text("short_bio"),
  genres: jsonb("genres").$type<string[]>().notNull().default([]),
  origin: text("origin"),
  formedYear: integer("formed_year"),
  imageUrl: text("image_url"),
  socialLinks: jsonb("social_links").$type<SocialLinks>().default({}),
  discography: jsonb("discography").$type<Album[]>().default([]),
  musicVideos: jsonb("music_videos").$type<MusicVideo[]>().default([]),
  pressQuotes: jsonb("press_quotes").$type<PressQuote[]>().default([]),
  bookingEmail: text("booking_email"),
  pressEmail: text("press_email"),
  labels: jsonb("labels").$type<string[]>().default([]),
  members: jsonb("members").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  llmContext: text("llm_context"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArtistSchema = createInsertSchema(artistsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artistsTable.$inferSelect;
