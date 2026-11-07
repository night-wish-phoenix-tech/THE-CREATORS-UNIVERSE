// All planets are defined here ONCE. Later (Phase 4) this can move to Firestore.
export const WORLDS = [
  {
    id: "nexus",
    name: "NEXUS",
    tagline: "Central Hub",
    description: "The welcome island and spaceport. Meet featured creators and find your way to every other world.",
    categories: ["Spaceport", "Featured creators", "Featured projects", "Announcements"],
    color: "#fbbf24",
    size: 3,
    position: [0, 0, 0],
    ring: false,
    type: "island"
  },
  {
    id: "artoria",
    name: "ARTORIA",
    tagline: "Art Planet",
    description: "Paintings, drawings and crafts from creators of every age.",
    categories: ["Paintings", "Drawings", "Sketches", "Photography", "Digital art", "Illustration", "Handicrafts"],
    color: "#f472b6",
    size: 1.7,
    position: [-11, 2, -4],
    ring: false
  },
  {
    id: "inventia",
    name: "INVENTIA",
    tagline: "Innovation Planet",
    description: "Science projects, electronics, robots and inventions.",
    categories: ["Science projects", "Electronics", "Robotics", "Engineering", "Prototypes", "Research"],
    color: "#22d3ee",
    size: 1.8,
    position: [-6, -3, 8],
    ring: true
  },
  {
    id: "technova",
    name: "TECHNOVA",
    tagline: "Technology Planet",
    description: "Websites, software, apps, AI and open-source projects.",
    categories: ["Websites", "Software", "Applications", "AI projects", "Coding", "Open-source"],
    color: "#8b5cf6",
    size: 1.6,
    position: [9, 3, 6],
    ring: false
  },
  {
    id: "lorelia",
    name: "LORELIA",
    tagline: "Story Planet",
    description: "Stories, poems, books and comics waiting to be read.",
    categories: ["Stories", "Books", "Poems", "Comics", "Creative writing"],
    color: "#34d399",
    size: 1.5,
    position: [12, -2, -6],
    ring: false
  },
  {
    id: "melodia",
    name: "MELODIA",
    tagline: "Music Planet",
    description: "Original music, compositions and performances.",
    categories: ["Original music", "Compositions", "Performances", "Audio creations"],
    color: "#fb923c",
    size: 1.4,
    position: [3, 5, -12],
    ring: true
  },
  {
    id: "forma",
    name: "FORMA",
    tagline: "Design Planet",
    description: "Fashion, architecture, product design and UI/UX.",
    categories: ["Fashion", "Product design", "Architecture", "UI/UX", "Crafts"],
    color: "#60a5fa",
    size: 1.6,
    position: [-3, -5, -11],
    ring: false
  },
  {
    id: "discovery",
    name: "DISCOVERY ISLES",
    tagline: "Events & Challenges",
    description: "Competitions, community challenges and special exhibitions.",
    categories: ["Competitions", "Challenges", "Special exhibitions", "Events"],
    color: "#a3e635",
    size: 1.3,
    position: [6, -6, 12],
    ring: false
  }
];
