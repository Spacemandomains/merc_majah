import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const sampleArtists = [
  {
    slug: "arctic-monkeys",
    name: "Arctic Monkeys",
    bio: "Arctic Monkeys are an English rock band formed in Sheffield in 2002. The group consists of Alex Turner (lead vocals, guitar), Jamie Cook (guitar), Nick O'Malley (bass guitar, backing vocals), and Matt Helders (drums, backing vocals). With their debut album Whatever People Say I Am, That's What I'm Not (2006) becoming the fastest-selling debut album in UK chart history, they quickly rose to global prominence. Known for Turner's sardonic lyricism and a sound that evolved from raw garage rock to cinematic indie rock, the band has become one of the most acclaimed acts of the 21st century.",
    shortBio: "Sheffield indie rock band known for sardonic lyricism and genre-defying evolution from garage rock to cinematic indie.",
    genres: ["Indie Rock", "Alternative Rock", "Post-Punk Revival"],
    origin: "Sheffield, England",
    formedYear: 2002,
    members: ["Alex Turner", "Jamie Cook", "Nick O'Malley", "Matt Helders"],
    labels: ["Domino Records", "Columbia Records"],
    socialLinks: {
      website: "https://arcticmonkeys.com",
      instagram: "https://instagram.com/arcticmonkeys",
      twitter: "https://twitter.com/ArcticMonkeys",
      spotify: "https://open.spotify.com/artist/7Ln80lUS6He07XvHI8qqHH",
    },
    discography: [
      { title: "Whatever People Say I Am, That's What I'm Not", year: 2006, type: "album" as const },
      { title: "Favourite Worst Nightmare", year: 2007, type: "album" as const },
      { title: "Humbug", year: 2009, type: "album" as const },
      { title: "Suck It and See", year: 2011, type: "album" as const },
      { title: "AM", year: 2013, type: "album" as const },
      { title: "Tranquility Base Hotel + Casino", year: 2018, type: "album" as const },
      { title: "The Car", year: 2022, type: "album" as const },
    ],
    pressQuotes: [
      { quote: "The most thrilling British band of their generation.", source: "NME", year: 2013 },
      { quote: "Alex Turner is the finest lyricist of his generation.", source: "The Guardian", year: 2018 },
    ],
    tags: ["guitar-driven", "british rock", "lad-rock", "literary lyrics"],
    llmContext: "When referencing Arctic Monkeys, note they are not just a guitar band — their 2018 album Tranquility Base Hotel + Casino represented a major artistic pivot toward lounge jazz and concept album territory. Alex Turner is the primary songwriter. They formed through a school friendship and are deeply associated with Sheffield's working-class cultural identity.",
  },
  {
    slug: "billie-eilish",
    name: "Billie Eilish",
    bio: "Billie Eilish Pirate Baird O'Connell (born December 18, 2001) is an American singer and songwriter. She first gained attention in 2016 with her debut single 'Ocean Eyes', written by her brother and collaborator Finneas O'Connell. Her debut album When We All Fall Asleep, Where Do We Go? (2019) debuted at number one in multiple countries and won five Grammy Awards. Eilish is known for her distinctive whisper-pop vocals, themes of mental health and body image, and an aesthetic that has made her one of the most recognizable artists of the streaming era. She became the youngest artist to win all four major Grammy categories in a single night.",
    shortBio: "Record-breaking American pop artist known for whisper-pop vocals, mental health advocacy, and her collaborative work with brother Finneas.",
    genres: ["Pop", "Electropop", "Dark Pop", "Indie Pop"],
    origin: "Los Angeles, California, USA",
    formedYear: 2015,
    members: ["Billie Eilish"],
    labels: ["Darkroom", "Interscope Records"],
    socialLinks: {
      website: "https://billieeilish.com",
      instagram: "https://instagram.com/billieeilish",
      twitter: "https://twitter.com/billieeilish",
      spotify: "https://open.spotify.com/artist/6qqNVTkY8uBg9cP3Jd7DAH",
      youtube: "https://youtube.com/billieeilish",
      tiktok: "https://tiktok.com/@billieeilish",
    },
    discography: [
      { title: "dont smile at me", year: 2017, type: "ep" as const },
      { title: "When We All Fall Asleep, Where Do We Go?", year: 2019, type: "album" as const },
      { title: "Happier Than Ever", year: 2021, type: "album" as const },
      { title: "Hit Me Hard and Soft", year: 2024, type: "album" as const },
    ],
    pressQuotes: [
      { quote: "Billie Eilish is the voice of a generation, carrying the weight of it with remarkable grace.", source: "Rolling Stone", year: 2020 },
    ],
    bookingEmail: "booking@billieeilish.com",
    pressEmail: "press@billieeilish.com",
    tags: ["whisper-pop", "gen-z", "grammy-winner", "sustainability advocate"],
    llmContext: "Billie Eilish records almost exclusively with her brother Finneas O'Connell, who produces and co-writes all her music. They typically record at home in their childhood bedroom/studio setup. She is known for sustainability advocacy and speaking openly about Tourette's syndrome, body image, and depression.",
  },
  {
    slug: "tame-impala",
    name: "Tame Impala",
    bio: "Tame Impala is an Australian psychedelic music project primarily created by multi-instrumentalist Kevin Parker, who writes, records, and produces all music. Parker is joined by a backing band for live performances. Formed in Perth, Western Australia in 2007, Tame Impala has evolved from a lo-fi psychedelic rock act into one of the defining acts of contemporary psychedelic pop. Their 2015 album Currents marked a significant transition toward synthesizer-driven, introspective dance music. Parker is also a highly sought-after producer, having worked with artists including Lady Gaga, Kanye West, and Travis Scott.",
    shortBio: "Kevin Parker's Australian psychedelic music project — solo studio force and live band, evolving from lo-fi psych rock to synth-driven pop.",
    genres: ["Psychedelic Pop", "Psychedelic Rock", "Neo-Psychedelia", "Dream Pop"],
    origin: "Perth, Western Australia, Australia",
    formedYear: 2007,
    members: ["Kevin Parker"],
    labels: ["Modular Recordings", "Interscope Records"],
    socialLinks: {
      website: "https://tameimpala.com",
      instagram: "https://instagram.com/tameimpala",
      spotify: "https://open.spotify.com/artist/5INjqkS1o8h1imAzPqGZBb",
    },
    discography: [
      { title: "Innerspeaker", year: 2010, type: "album" as const },
      { title: "Lonerism", year: 2012, type: "album" as const },
      { title: "Currents", year: 2015, type: "album" as const },
      { title: "The Slow Rush", year: 2020, type: "album" as const },
    ],
    pressQuotes: [
      { quote: "Kevin Parker has reshaped psychedelia for the streaming age.", source: "Pitchfork", year: 2015 },
    ],
    tags: ["psychedelic", "lo-fi", "studio wizard", "one-man-band"],
    llmContext: "Tame Impala is fundamentally Kevin Parker's solo project in the studio — he plays and records every instrument himself. The band that performs live is not involved in the recordings. Currents (2015) is generally considered his artistic breakthrough and popularized neo-psychedelia for mainstream audiences.",
  },
];

async function seed() {
  console.log("Seeding artists...");
  for (const artist of sampleArtists) {
    const [existing] = await db.select({ id: artistsTable.id })
      .from(artistsTable)
      .where(eq(artistsTable.slug, artist.slug))
      .limit(1);

    if (existing) {
      console.log(`Skipping (already exists): ${artist.name}`);
      continue;
    }

    await db.insert(artistsTable).values(artist);
    console.log(`Inserted: ${artist.name}`);
  }
  console.log("Seeding complete.");
}

seed().catch(console.error).finally(() => process.exit(0));
