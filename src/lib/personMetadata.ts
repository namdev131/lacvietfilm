export type PersonMetadata = {
  id: string;
  name: string;
  description?: string;
  image?: string;
  birthDate?: string;
  sourceUrl: string;
};

type SearchItem = { id: string; label?: string; description?: string };
type Claim = { mainsnak?: { datavalue?: { value?: unknown } } };
type Entity = {
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, Claim[]>;
};

const SEARCH = "https://www.wikidata.org/w/api.php";
const ENTITY = "https://www.wikidata.org/wiki/Special:EntityData";
const COMMONS = "https://commons.wikimedia.org/wiki/Special:Redirect/file";
const valueOf = (entity: Entity, property: string) => entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value;

export async function fetchPersonMetadata(name: string, role: "actor" | "director"): Promise<PersonMetadata | null> {
  const params = new URLSearchParams({ action: "wbsearchentities", search: name, language: "vi", uselang: "vi", type: "item", limit: "5", format: "json", origin: "*" });
  const searchResponse = await fetch(`${SEARCH}?${params}`, { signal: AbortSignal.timeout(6000) });
  if (!searchResponse.ok) return null;
  const search = (await searchResponse.json()) as { search?: SearchItem[] };
  const roleTerms = role === "actor" ? /actor|actress|diễn viên/i : /director|đạo diễn/i;
  const exact = search.search?.filter((item) => item.label?.localeCompare(name, "vi", { sensitivity: "base" }) === 0) || [];
  const match = exact.find((item) => roleTerms.test(item.description || "")) || exact[0];
  if (!match) return null;

  const entityResponse = await fetch(`${ENTITY}/${encodeURIComponent(match.id)}.json`, { signal: AbortSignal.timeout(6000) });
  if (!entityResponse.ok) return null;
  const payload = (await entityResponse.json()) as { entities?: Record<string, Entity> };
  const entity = payload.entities?.[match.id];
  if (!entity) return null;

  const imageName = valueOf(entity, "P18");
  const birth = valueOf(entity, "P569") as { time?: string } | undefined;
  return {
    id: match.id,
    name: entity.labels?.vi?.value || entity.labels?.en?.value || match.label || name,
    description: entity.descriptions?.vi?.value || entity.descriptions?.en?.value || match.description,
    image: typeof imageName === "string" ? `${COMMONS}/${encodeURIComponent(imageName)}` : undefined,
    birthDate: birth?.time?.slice(1, 11),
    sourceUrl: `https://www.wikidata.org/wiki/${encodeURIComponent(match.id)}`,
  };
}
