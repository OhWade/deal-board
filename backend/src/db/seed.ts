import { fileURLToPath } from "node:url";
import { db, pool } from "./index.js";
import { addOns, transactions } from "./schema.js";

// Deterministic PRNG so every seed run produces the same demo data
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261102);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const between = (min: number, max: number) => Math.round(min + rand() * (max - min));

const vehicles = [
  { make: "BMW", model: "M4 Competition", years: [2018, 2023], price: [38_000, 72_000] },
  { make: "BMW", model: "M3", years: [2016, 2022], price: [32_000, 68_000] },
  { make: "BMW", model: "440i Gran Coupe", years: [2019, 2023], price: [28_000, 46_000] },
  { make: "BMW", model: "M2", years: [2017, 2023], price: [36_000, 58_000] },
  { make: "Mercedes-Benz", model: "C63 AMG", years: [2016, 2021], price: [34_000, 62_000] },
  { make: "Mercedes-Benz", model: "AMG GT", years: [2017, 2021], price: [68_000, 110_000] },
  { make: "Mercedes-Benz", model: "G550", years: [2015, 2020], price: [72_000, 118_000] },
  { make: "Porsche", model: "911 Carrera S", years: [2014, 2020], price: [68_000, 112_000] },
  { make: "Porsche", model: "Macan GTS", years: [2018, 2022], price: [42_000, 66_000] },
  { make: "Audi", model: "RS5 Sportback", years: [2019, 2023], price: [48_000, 72_000] },
  { make: "Audi", model: "R8 V10", years: [2015, 2019], price: [98_000, 148_000] },
  { make: "Lexus", model: "RC F", years: [2016, 2022], price: [36_000, 58_000] },
] as const;

const customers = [
  "Zack B", "Marcus Lee", "Daniela Ortiz", "Kevin Tran", "Sofia Ramirez", "Andre Wallace",
  "Priya Shah", "Jordan Kim", "Luis Mendoza", "Tyler Brooks", "Nina Petrova", "Chris Alvarez",
  "Hannah Cole", "Omar Haddad", "Bryce Nguyen", "Elena Cruz", "Isaiah Grant", "Mia Torres",
];

const sellers = [
  "Manheim Riverside", "ADESA Los Angeles", "Copart Sun Valley", "Private party",
  "Trade-in", "Dealer wholesale", "Cars & Bids", "Bring a Trailer",
];

const soldAddOns = [
  { name: "Ceramic coating", range: [800, 1_800] },
  { name: "Window tint", range: [300, 650] },
  { name: "Extended warranty", range: [1_500, 3_500] },
  { name: "Paint protection film", range: [1_200, 2_800] },
  { name: "GAP insurance", range: [600, 1_100] },
  { name: "Wheel & tire package", range: [900, 2_200] },
] as const;

const purchasedAddOns = [
  { name: "Transport", range: [250, 900] },
  { name: "Auction fee", range: [400, 950] },
  { name: "Reconditioning", range: [600, 2_500] },
  { name: "Detail", range: [150, 350] },
] as const;

const VIN_CHARS = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
const fakeVin = () => Array.from({ length: 17 }, () => pick([...VIN_CHARS])).join("");

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function seed() {
  await db.delete(transactions); // add-ons cascade

  const DEALS = 48;
  for (let i = 0; i < DEALS; i++) {
    const type = rand() < 0.55 ? "SOLD" : "PURCHASED";
    const v = pick(vehicles);
    const salePrice = between(v.price[0], v.price[1]);
    // Purchases land roughly 12-22% under retail
    const dollars = type === "SOLD" ? salePrice : Math.round(salePrice * (0.78 + rand() * 0.1));

    const [row] = await db
      .insert(transactions)
      .values({
        type,
        partyName: type === "SOLD" ? pick(customers) : pick(sellers),
        year: between(v.years[0], v.years[1]),
        make: v.make,
        model: v.model,
        vin: rand() < 0.8 ? fakeVin() : null,
        priceCents: Math.round(dollars / 100) * 100 * 100 - (type === "SOLD" ? 100 : 0), // e.g. $42,999
        dealDate: isoDaysAgo(between(0, 180)),
      })
      .returning({ id: transactions.id });

    const catalog = type === "SOLD" ? soldAddOns : purchasedAddOns;
    const extras = [...catalog].sort(() => rand() - 0.5).slice(0, between(0, 3));
    if (row && extras.length) {
      await db.insert(addOns).values(
        extras.map((a) => ({
          transactionId: row.id,
          name: a.name,
          priceCents: Math.round(between(a.range[0], a.range[1]) / 10) * 10 * 100,
        })),
      );
    }
  }

  return DEALS;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed()
    .then((n) => console.log(`Seeded ${n} transactions`))
    .catch((err) => {
      console.error("Seed failed", err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
