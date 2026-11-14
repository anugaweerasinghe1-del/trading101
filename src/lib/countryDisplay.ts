/** Location wording for sentences; navigation retains each country's proper name. */
export function countryLocationName(name: string): string {
  return name === "Philippines" ? "the Philippines" : name;
}
