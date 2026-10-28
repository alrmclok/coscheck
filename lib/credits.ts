export type Person = {
  name: string;
  role: string;
  photo?: string;
  link?: string;
  group?: string; // optional, must match one of memberGroups to be grouped
  bio?: string; // optional, shown in the lightbox
};
export type Sponsor = Person & { tier?: "utama" | "biasa" };

// Order here = order on the page. Empty groups are hidden automatically.
export const memberGroups = ["Developer", "Moderator", "Kontributor"];

export const members: Person[] = [
  {
    name: "alrmclok",
    role: "Creator / Owner",
    group: "Developer",
    bio: "bikin dan ngurus coscheck!!",
    photo:
      "https://res.cloudinary.com/re8qzxdm/image/upload/v1793185480/fantube.png",
    link: "https://instagram.com/alrmclok",
  },
  {
    name: "levtofer",
    role: "Beban / Co-owner",
    group: "Developer",
    bio: "real beban",
    photo: "https://res.cloudinary.com/re8qzxdm/image/upload/v1793201457/download.png",
    link: "https://instagram.com/levtofer",
  },
];

export const sponsors: Sponsor[] = [
  {
    name: "Bandung Anime Event",
    role: "Sponsor Utama",
    bio: "[PLACEHOLDER] latip katanya mau genset + tangga 25",
    photo:
      "https://res.cloudinary.com/re8qzxdm/image/upload/v1793185479/logo-bae.jpg",
    link: "https://instagram.com/bdg.anime.event",
    tier: "biasa",
  },
];

export const tools: [string, string][] = [
  ["Next.js & React", "kerangka aplikasi"],
  ["Tailwind CSS", "tampilan"],
  ["Turso & Drizzle ORM", "database"],
  ["Cloudinary", "hosting dan optimasi gambar"],
  ["Auth.js", "login Google untuk admin"],
  ["Apify", "ambil data postingan Instagram"],
  ["dnd-kit", "geser urutan gambar"],
  ["Lucide", "ikon"],
];

export const specials: [string, string][] = [
  ["fantube", "wow"],
  ["9 Trio", "barudak agartha"],
];

export const fonts: string[] = ["DM Sans", "Space Grotesk", "DM Mono"];
